# NATS Streaming Service

To work with NATS Streaming Server in Node.js we are going to use _node-nats-streaming_ library to create events and send them to NATS Streaming Server.

NATS Streaming requires us to subscribe to channels. Events are emitted to specific channels. For example on NATS Streaming Server we are going to create collection of topics or channels. Then whenever we want to emit some kind of event we are going to create it inside one of our service and then reach out to nats lib to publish this event on some channel. This event will reach NATS server and will be sent to all services that are listening to that channel.

For comparison in our custom event-bus implementation we used express and axios libs to communicate between services. And whenever some event was sent to event-bus it was then re-emited back to every service using axios library.

In order to handle outages in our own event-bus implementation we had a record of all events that have been emitted. Which was crucial even when we have to add new service. That service would use this record collection to get up to date.

NATS Streaming stores all events in memory _(default)_, flat files or in a MySQL/Postgres DB.

## Scaling

Lets say that we have Order service that is running at its capacity, there are two ways in which we can scale vertically by increasing its CPU capabilities for example or horizontally by adding another Order service.

Adding another service seems like more realistic approach but it comes with its problems.

First problem that we are going to encounter is that when we try to connect to NATS its going to throw _clientID already registered_ error because NATS also has list of clients.

clientID is set by second argument of connect function

```js
// clientID is 123
const stan = nats.connect("ticketing", "123", {
  url: "http://localhost:4222",
});
```

Second problem is that we most likely don't want to handle same event on multiple services. NATS has some built-in solution for this called **Queue Group**.

Queue Group is something that is being created inside a channel. One channel can have many Queue Groups.
When we have two or more listeners inside one Queue Group event is going to be sent to listener that is first in queue.
Having more then one Queue Group is benefitial in scenarios when we introduce another service that only wants to get specifc event if its sent to group that its listening to.

## Acknowledgment: ACK Mode

Whenever we recieve some event, that event is by default marked as acknowledged and service will not be to process it again. So what happens if while processing event in service write to DB fails? Event will in that case be lost, and data will be corrupted.

NATS offers option for manually acknowledging events/messages

```js
const opts = stan.subscriptionOptions().setManualAckMode(true);
```

NATS is going to wait for some period of time and if we don't ack event in that time window, NATS is going to take that exact event and send it to some other service in Queue Group or send it again to exact same service.

```js
// To manually ack event/message just call ack func on Message instance
msg.ack();
```

## Client Health Checks

When we configured NATS pod we had a few flags:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nats-depl
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nats
  template:
    metadata:
      labels:
        app: nats
    spec:
      containers:
        - name: nats
          image: nats-streaming:0.17.0
          # Set of arguments to provide to primary command that gets executed when image is built
          args: [
              "-p",
              "4222",
              "-m",
              "8222",
              "-hbi", # hearth beat interval - how often NATS is going to send health check request to each of its clients
              "5s",
              "-hbt", # how much time each client has to respond to health check
              "5s",
              "-hbf", # how many times each client can fail before that connection becomes dead
              "2",
              "-SD",
              "-cid",
              "ticketing",
            ]
```

In order to check status of our NATS server we can connect to monitoring server which in our case lives on port **8222**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nats-srv
spec:
  selector:
    app: nats
  ports:
    - name: client
      protocol: TCP
      port: 4222
      targetPort: 4222
    - name: monitoring
      protocol: TCP
      port: 8222
      targetPort: 8222
```

`localhost:8222/streaming/channelsz?subs=1` This url will return all chanells with subscription array displayed. Here we can see all of our listeners.

Whenever we do `rs` command for our ts-node-dev listener server which means to restart, we are killing off one subscriber. That subscriber will live for some time and will recieve events/messages for that Queue Group. That is why we might not see some event for certain period of time, it takes tiem for NATS to realize that listener is dead.

We can gracefully shutdown or NATS clients in following manner

```js
stan.on("connect", () => {
  console.log("listener connected to nats");

  stan.on("close", () => {
    console.log("NATS connection closed!");
    process.exit();
  });
});

// Interrupt signal
process.on("SIGINT", () => stan.close());
// Terminate signal
process.on("SIGTERM", () => stan.close());
```

## Concurrency Issues

1. **Listener can fail to process the event:** Something inside service can prevent it from acking a message which will cause time delay before that message is processed again. Meanwhile other event might come and if order is important then this is problematic.
2. **One listener might run more quickly:** Case can occur where one service is running at its capacity and therefore is slow, and while its processing an event another can come after it. That second event can be emitted to another service which will process it in no time.
3. **NATS might think client is still alive:** If one service failed and NATS doesn't know about it event will be sent to it which will block it until NATS realizes that client is dead.
4. **We might receive the same event twice:** Event might come to some service and that service can take more then **ack timeout** to process something, but it completes afterwards. In such case NATS is going to send exact same event to other service which is going to process it again.

## Event redelivery

This will redeliver all events, this can be alot if system was running for weeks, months or years.

```js
const opts = stan.subscriptionOptions().setDeliverAllAvailable();
```

There is a solution for this

```js
const opts = stan
  .subscriptionOptions()
  .setManualAckMode(true)
  .setDeliverAllAvailable()
  .setDurableName("abc-123");
```

Whenever we defined durrable subscription, we introduce history specific for that id, in this case id is `abc-123`. So whenever client reconnects with this id it will look in this history.

Durable history will hold information whether or not event/message has been **proccessed** and will re-emit those that are not. Now question is why do we need _setDeliverAllAvailable_? This is usefull for first initialization when there is no history just in case there is something important.

There is one more gotcha you need to use _Queue Group_ with _setDurableName_ otherwise durable subscription history will get dropped once client is dead.
