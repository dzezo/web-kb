# Advanced Node

## Note Internals

NodeJS like any other JS project has internal dependencies that it uses to execute your JS code two most important dependencies are:

1. V8
2. libuv

**V8** project is open source JS engine created by google. Purpose of this engine is to execute JS code outside of browser.
**libuv** is C++ open source project that gives Node access to the OS **file system**, gives access to **networking** and handles some aspect of concurrency.

Node is a bridge between your JS code and these libs, it creates module layer that we can use to interact with underlying C++ code, some of modules are:

- http
- fs
- crypto
- path

### Module Implementations

What happens when we call some function from lets say crypto module:

1. Node's JS Side _(lib folder in Node repo)_
   1.1 `process.binding()` - _connect JS and C++ functions_
   1.2 V8 - _converts values between JS and C++ world_
2. Node's C++ Side _(src folder in Node repo)_
3. libuv - _gives Node easy access to underlying OS_

### Event loop

Below code is pseudo implementation of event loop, as an attempt to understand it better.

```js
// node index.js

const pendingTimers = [];
const pendingOSTasks = [];
const pendingOperations = [];

// timers, tasks and operations are recorded from index.js running
index.runContents();

function shouldContinue() {
  // Check one: Any pending setTimeout, setInterval, setImmediate?
  // Check two: Any pending OS tasks? (like server listening on port)
  // Check three: Any pending long running operations? (like fs module)

  return (
    pendingTimers.length || pendingOSTasks.length || pendingOperations.length
  );
}

// Entire body executes in one 'tick'
while (shouldContinue()) {
  // 1) Node looks at pendingTimers and sees if any functions
  // are ready to be callled. (setTimeout, setInterval)
  // 2) Node looks at pendingOSTasks and pendingOperations
  // and calls relevant callbacks
  // 3) Pause execution. Continue when...
  // - a new pendingOSTask is done
  // - a new pendingOperation is done
  // - a timer is about to complete
  // 4) Look at pendingTimers. Call any setImmediate
}
```

#### Libuv thread pool

Notion that NodeJS is single threaded comes from the fact that event loop is executed inside a single thread.

But some standard lib function calls like `pbkdf2` from `crypto` module are exectued outside of event loop.
Instead of event loop they use something called _thread pool_. Thread pool is series of **4** threads _(by default)_ that are used for running computationaly intesive tasks.

You can change threadpool size like this

```js
process.env.UV_THREADPOOL_SIZE = 2;
```

**Q:** Can we use threadpool for js code or can NodeJS functions use it?
**A:** We can write custom JS that uses threadpool

**Q:** What functions in Node std lib use the threadpool?
**A:** All `fs` module functions and some from `crypto`. Depends on OS

**Q:** How does this threadpool fit into event loop?
**A:** Tasks running in threadpool are `pendingOperations` in our mock eventloop implementation

#### Unexpected Event Loop events

```js
const start = Date.now();

const doRequest = () => {
  https
    .request("https://www.google.com", (res) => {
      res.on('data' noop);
      res.on("end", () => console.log("HTTP", Date.now() - start));
    })
    .end();
};

const doHash = () => {
   crypto.pbkdf2('a', 'b', 100_000, 512, 'sha512', () => {
      console.log("CRYPTO", Date.now() - start);
   })
}

const doReadFile = () => {
   fs.readFile('index.js', 'utf8', () => {
      console.log("FS", Date.now() - start);
   })
}
```

What would happend if we make function calls like this:

```js
doRequest();
doReadFile();
doHash();
doHash();
doHash();
doHash();
```

console output would be something like this:

```
HTTP 294
CRYPTO 2154
FS 2155
CRYPTO 2268
CRYPTO 2320
CRYPTO 2354
```

when we remove `doHash` function this is how console output looks:

```
FS 24
HTTP 294
```

There are a couple of questions here:

- Why do we see one HASH console log before FS?
- Why do we see HTTP request complete first?

`fs` and `crypto` modules are using libuv threadpools, and `http` module delegates network request to OS immediately. This is the reason why we see HTTP first, it skips threadpools.

Reason why `fs` module doesn't directly read from hard drive, is because Node makes 2 _"trips"_ to hard drive:

1. Get stats like size and whatnot, to gauge whether it can actually read it
2. Read file (file contents streamed back to app)

Key thing here is that fs is requesting something from hard drive, and when it does it **pauses** until it gets results back.

And in order to prevent idle time threadpool will look if it can do something!
Since we have 5 tasks and by default 4 threads, threadpool is going to eject FS task and replace it with CRYPTO.
So FS eventho is fast is going to wait for one CRYPTO task to finish in order to get mounted again and read file. That is why we see CRYPTO and then immediately FS in our console output.

if we would to increase threadpool size to 5, then this would be the console output:

```
FS 24
HTTP 294
CRYPTO 2154
CRYPTO 2268
CRYPTO 2320
CRYPTO 2354
```

FS task now has dedicated thread and will not wait for slower running tasks.

## Enhancing Performance

1. Use Node in Cluster mode (Recommended)
2. Use worker threads (Experimental)

### Clustering in theory

When we use clustering inside our NodeJS application we are going to start multiple node processes, there is always going to be one _parent_ process called **Cluster Manager**.

Cluster Manager is responsible for monitoring health of our Node instances. It can start, stop or restart them, send some data or do some other administrative task.
Cluster Manager does not execute any application code.

### Clustering in action

NodeJS `cluster` module contains things that are essential for setting up clustering in our application.

```js
const cluster = require("cluster");

console.log(cluster.isMaster);
```

When we run this code with `node index.js` we are going to get `true` printed in our console, what does that mean?
Run command executes index.js file and starts up Node instance called **Cluster Manager** which has property `isMaster` set to true.

Whenever we start forking with `cluster.fork()` that isMaster flag for new instances is going to be set to false.

One thing to note is that every new NodeJS instance has 4 threads in its Thread Pool, by default.
Which means that settings `UV_THREADPOOL_SIZE` in our application **doesn't restrict total number of threads in our entire cluster**, it means that every slave in our cluster is going to have that much threads in its Thread Pool.

One good rule of thumb is to match number of slaves to number of your physical cores, otherwise it may negatively impact performance.

**Example:**
Lets say that we are on a machine with 2 cores, and we are running cluster of 6 NodeJS instances.

We recieve 6 requests at once, each taking 1s to complete, the result from each instance comes after 3s! Why shouldn't results all come after 1s?

Well our machine has 2 cores and now it has 6 instances running in 6 separate threads. Our machines starts work on all 6 instances right away but it bounces CPU time back and forth, until all work is dones after 3s.

Much better solution would be to have 2 instances on 2 core machine. In such configuration all 6 requests will be completed after 3s which is the same, but with one key difference that some requests are going to be served faster!

In this configuration we have dedicated cores for each Node instance.
Both instances work in parallel and finish their first request after 1s, which means that we responed to two requests in 1s, then they respond to next 2 in 1s and finally they respond to last 2, making it 3s in total.

For banchmarking performance of our application we can use Apache Banchmark (ab):

`ab -c 1 -n 1 localhost:3000/`

c - maximum number of concurent requests
n - total number of requests

### PM2

PM2 is production **P**rocess **M**anager for NodeJS with built-in load balancer.

It spawns multiple instances of your application and manages their health, which means that if some instance goes down it gets reloaded automatically.

To start using PM2 you run `pm2 start index.js -i 0`

`-i` is a flag for number of instances to spawn, if we set it to 0 pm is going to make decission for us.

Some other usefull commands are:
`pm2 monit` - To monitor your cluster performance
`pm2 delete index` - To stop your cluster

### Worker Threads

Worker threads use threads from libuv Thread Pool, so even tho we have direct access to Thread Pool via WT we are still limited to processing power of our machine.

Our main app doesn't have any means of direct communication with worker thread so everything is done via Worker Interface that consists of `postMessage` and `onMessage`

Simple worker thread implementation

```js
// index.js
const express = require("express");
const { Worker } = require("worker_threads");

const app = express();

app.get("/", (req, res) => {
  // worker code is exectued immediately
  const worker = new Worker("./worker.js");

  // Expectin postMassage from worker
  worker.on("message", (counter) => {
    res.send({ data: counter });
  });
});

app.listen(3000, () => {
  console.log("Example app listening on port 3000!");
});
```

```js
// worker.js
const { parentPort } = require("worker_threads");

let counter = 0;
while (counter < 99e3) {
  counter++;
}

// Sends data to main thread
parentPort.postMessage(counter);
```

Data can be sent from main to worker thread using:

```js
// index.js
worker.postMessage(undefined);

// worker.js
parentPort.on("message", (value) => console.log(value));
```

you can also set workerData when creating Worker.

## Data Caching with Redis

Cache Server is located between ORM and DB, for example in between Mongoose and MongoDB.
Whenever we issue a query request to DB it first hits cache server and if result is not found query gets relayed to DB.
Result from DB is sent to client as fast as possible, recording result to cache should never drastically impact response time.

Cache Server is only used for reading data, and data in it should have some TTL.

### Gettings started with Redis

One thing to note about Redis is that it can only store numbers and strings.

Structure: Key-Value
Mental Model: Simple JS Object

| Key  | Value   |
| ---- | ------- |
| 'hi' | 'there' |

```js
const redis = require("redis");
const redisUrl = "redis://127.0.0.1:6379";
const client = redis.createClient(redisUrl);

client.set("hi", "there");
client.get("hi", (err, value) => console.log(value));
```

Structure: Nested Hash
Mental Model: Nested JS Object

| Key       | Value          |                  |
| :-------- | :------------- | ---------------- |
|           | **Nested Key** | **Nested Value** |
| 'spanish' | 'red'          | 'rojo'           |
| 'spanish' | 'orange'       | 'naranja'        |
| 'german'  | 'red'          | 'rot'            |

```js
client.hset("spanish", "red", "rojo");
client.hget("spanish", "red", (err, value) => console.log(value));
```

With redis you can also set expiration time of a value like this:

```js
client.set("hi", "there", "EX", 5); // this value will expire after 5s
```

### Caching system

In order to properly implement caching system into our application we need to think and solve following problems:

1. Code reusability
   - Figure out how to have caching integrated into query calls
2. Cache expiry
   - Add timeout to values assigned to redis (TTL).
   - Add ability to reset all values tied to some specifc event
3. Unique keys
   - Figure out more robust solution for generating cache keys

##### Cache implementation

We are going to accomplish this by monkey patching mongoose `exec` function, which is always called after query has been prepared.

```js
const mongoose = require("mongoose");

// Monkey patching the exec function of mongoose.Query
const exec = mongoose.Query.prototype.exec; // Original exec function

// We are using a function because this should refer to the query instance
mongoose.Query.prototype.exec = async function () {
  return exec.apply(this, arguments);
};
```

We can break down cache implementation in three steps:

1. Create unique key _(some suggestions below)_
   - Name of collection we are querying
   - All query parameters _(params, limit, sort, ...)_
2. Check Redis on this key **If** value is found return value.
3. **Else** retrieve value from DB then store it in Redis before returning it.

```js
mongoose.Query.prototype.exec = async function () {
  const keyJSON = {
    ...this.getQuery(),
    _collection: this.mongooseCollection.name,
  };
  const key = JSON.stringify(keyJSON); // Key must be string

  const cacheValue = await client.get(key);
  if (cacheValue) {
    // cache hit
    const parsedCacheValue = JSON.parse(cacheValue);

    // exec should return mongoose model
    return Array.isArray(parsedCacheValue)
      ? parsedCacheValue.map((el) => new this.model(el))
      : new this.model(parsedCacheValue);
  }

  // cache miss
  const result = await exec.apply(this, arguments);
  client.set(key, JSON.stringify(result)); // Value must be string

  return result;
};
```

It is important to remember that Redis store data as string, that is why we have to stringify/parse whenever we use it.

##### Cache invalidation

We don't want to persist our cache forever. Luckily Redis has built-in solution for this.

When setting value in Redis we can specify exipiry time like this:

```js
// Expire value after 10 sec
client.set(key, JSON.stringify(result), "EX", 10);
```

We should also expose function to clear entry from Redis, so that we can invalidate cache on demand.

```js
function clearHash(hashKey) {
  client.del(JSON.stringify(hashKey));
}
```

We don't want to always use cache as well, caching should be opt-in service. To implement this we can add `cache` function to `Query` prototype.

```js
mongoose.Query.prototype.cache = function () {
  this.useCache = true;
  return this; // to make it chainable
};

mongoose.Query.prototype.exec = async function () {
  if (!this.useCache) {
    return exec.apply(this, arguments);
  }

  // Previous cache implementation
};
```

##### Cache in action

To enable caching we just need to chain our `cache` function to any `Query` method.

```js
app.get("/api/blogs", requireLogin, async (req, res) => {
  const blogs = await Blog.find({ _user: req.user.id }).cache();
  res.send(blogs);
});
```

To invalidate cache whenever new blog is inserted we can call `clearHash` **after** blog gets saved. This can be easy to forget so its probably better to create middleware.

There is one issue with creating this middleware. We want to execute it after request handler and to do so we need to call `next` at the end which defeats the purpose.
Luckily we can await execution of next middleware like this:

```js
// cleanCache.js
module.exports = async (req, res, next) => {
  await next(); // wait for the route handler to finish executing
  clearHash(req.user.id);
};
```

Final solution using this middleware would look like this:

```js
app.post("/api/blogs", requireLogin, cleanCache, async (req, res) => {
  const { title, content } = req.body;

  const blog = new Blog({
    title,
    content,
    _user: req.user.id,
  });

  const [err] = await to(blog.save());

  if (!err) res.send(blog);
  else res.send(400, err);
});
```
