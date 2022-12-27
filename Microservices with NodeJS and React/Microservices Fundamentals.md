### What is Microservice

#### Monolithic server

**Definition:** All of the code needed to implement our application is inside one single codebase and we deploy that code base as one single unit.

**Differences**
Monolith contains: Routing, Middlewares, Business Logic & Database access to implement **entire** aplication whereas Microservice has all these components but for a **single** feature within application.

#### Microservice architecture

Entire app is divided into services that perform completely unrelated tasks and are independent of one another. Those services can even have their own DBs.
Advantage of such approach is that app can still function even if some services fail.

#### Data in Microservices

Managing data between services is the biggest challenge when it comes to microservices.

One way in which we can overcome this is issue is to implement design pattern called Database-Per-Service. DPS pattern is used for a couple of reasons:

1. **We want each service to run independently of other services:**
   To ensure this we need to assign database to each services (if that services needs DB to begin with), and we need to prevent services from ever reaching into another services database, because this will cause dependency in case of failiure.
2. **Database schema/structure might change unexpectedly**
   Team that works on **service#2** can for example change name of some property without informing team that works on **service#1**. In such case service#1 which is not configured to handle new property name will fail because of this.
3. **Some services might function more efficently with different types of DB's (sql vs nosql)**

#### Communication Strategies Between Services

There are to strategies for communications: **Sync and Async**
These words don't mean what they mean in the JS world.

**Sync**: Services communicate with each other using direct requests.

- Pros:
  1. Easy to understand
  2. Additional service might not need DB
- Cons:
  1. Introduces a dependecy between services
  2. If any inter-service request fails the overall request fails
  3. The entire request is only as fast as slowest request
  4. Can easily introduce nested dependencies

**Async**: Services communicate with each other using events.
General idea is to introduce **Event Bus** that is accessible to every other service. Job of this Event Bus is to handle notifications from different services.
Events are small objects, example:

```js
const event = {
  type: UserQuery,
  data: {
    id: number,
  },
};
```

Lets say that we have **4** services, **service#4** is newly added service that needs to communicate with other **3** inorder to complete its task. To accomplish this **service#4** emits an event to read from **service#1**, **service#1** acknowledges this event fullfils it and responds with event of its own, **service#4** grabs this new event from event bus and issues another request to **service#2** and so on so forth.

This way of communication is not as easy to understand as **Sync**, and furthermore it doesn't even solve issues that come with Sync way of communication.

So this form of **Async** communication will not be used very often (but it exists).

There is another way to handle async communication and that is to have DB for this new **service#4** and whenever something happens in other services that service emits an event to event bus, **service#4** will then pick up relevant events and populate its DB.

- Pros:
  1. Service has zero dependencies
  2. Service will be extremely fast
- Cons:
  1. Data duplication.
  2. Harder to understand
