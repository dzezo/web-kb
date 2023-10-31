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

## Automated Headless Browser Testing

### Chromium with Puppeteer

To launch Chromium instance we are going to use Puppeteer library. Once launched this Chromium instance will be a separate process outside of NodeJS. This causes commuication between Node and Chromium to always be `async`!
Puppeteer communicates by serializing our code into text, that text gets sent to Chromium where it gets evaled inside the browser.

```js
// Represents browser window
const browser = await puppeteer.launch({
  headless: false, // This will render browser GUI
});

// Represents browser tab
const page = await browser.newPage();

// Closes browser instance
await browser.close();
```

This will open up Chromium browser with two tabs opened (one by default) and both showing blank pages.
In order to navigate to our application we are going to use `goto`

```js
await page.goto("localhost:3000");
```

To scrape page content for specific element we can pass selector to `$eval` call, this works simlarly to `$` in JQuery.

```js
const text = await page.$eval("a.brand-logo", (el) => el.innerHTML);
```

### Testing with Puppeteer

Test example for asserting correct OAuth flow:

```js
const puppeteer = require("puppeteer");

let browser, page;

beforeEach(async () => {
  browser = await puppeteer.launch();
  page = await browser.newPage();
  await page.goto("localhost:3000");
});

afterAll(async () => {
  await browser.close();
});

test("clicking login starts oauth flow", async () => {
  await page.click(".right a"); // Simulate clicking on login button
  const url = await page.url(); // Check current page URL
  expect(url).toMatch(/accounts\.google\.com/);
});
```

### Testing OAuth - Understanding Cookie Session

In our example project we are using authentication via Google. Our backend side has two libraries to help us with auth flow.

1. cookie-session
2. passport

This is how authorization of incoming request is handled:

- cookie-session
  - pulls properties `session` and `session.sig` from cookie
  - uses `session.sig` to ensure `session` wasn't manipulated
    - `session` + cookie signing key = `session.sig`
    - it uses keygrip library to create `sessions.sig`
  - decode `session` into JS object
  - place that JS object on `req.session`
- passport
  - look at `req.session` and try to find `req.session.passport.user`
  - if an id is stored there, pass it to `deserializeUser`
  - get back user and assing it to `req.user`

To test authorized actions in our application using Puppeteer we need to:

1. Create mongoDB ID
2. Create JS object where `passport.user` is set to this ID
   ```js
   const fakeId = "fake-id"; // Valid mongo ID
   const sessionObject = {
     passport: {
       user: fakeId,
     },
   };
   ```
3. Create base64 session string out of this
   ```js
   const Buffer = require("safe-buffer").Buffer;
   const sessionBuffer = Buffer.from(JSON.stringify(sessionObject));
   const session = sessionBuffer.toString("base64");
   ```
4. Create session signature

   ```js
   const Keygrip = require("keygrip");
   // config/keys.js file has side-effects
   // checks in which environment Node is running
   // module.exports JS object containing env values
   const keys = require("../config/keys");

   const keygrip = new Keygrip([keys.cookieKey]);
   const sessionSig = keygrip.sign("session=" + session);
   ```

5. We need to use Puppeteer to set cookies in our Chromium instance

   ```js
   await page.setCookie({ name: "session", value: session });
   await page.setCookie({ name: "session.sig", value: sessionSig });
   ```

6. We need to refresh in order to apply cookies
   ```js
   await page.goto("localhost:3000");
   ```
7. To check if we are logged in correctly we can try to find login button

   ```js
   // Don't let await on goto fool you!
   // It waits for refresh to be executed, not for page to fully load
   // We use waitFor functions for that!
   await page.waitFor('a[href="/auth/logout"]');

   // Without previous instruction test would fail
   const text = await page.$eval(
     'a[href="/auth/logout"]',
     (el) => el.innerText
   );

   expect(text).toEqual("Logout");
   ```

### Session Factory

We would like to use this authentication logic in multiple places. But moving this logic into Jest hook is not going to cut it, because we would need to do that for each test suite.

Better approach is to create factory functions. We are going to separate this logic into two factories:

1. Session factory - Factory that produces sessions.
2. User factory - Factory that produces new users. We don't want to use same user in all our tests, because some tests might have unwanted side-effects

**Session factory implementation:**

```js
const Buffer = require("safe-buffer").Buffer;
const Keygrip = require("keygrip");
const keys = require("../../config/keys");

const keygrip = new Keygrip([keys.cookieKey]);

module.exports = (user) => {
  const sessionObject = {
    passport: {
      user: user._id.toString(),
    },
  };

  const sessionBuffer = Buffer.from(JSON.stringify(sessionObject));
  const session = sessionBuffer.toString("base64");
  const sig = keygrip.sign("session=" + session);

  return { session, sig };
};
```

**User factory implementation:**
Simply creates user and saves it to mongoDB

```js
const mongoose = require("mongoose");
const User = mongoose.model("User");

module.exports = () => {
  return new User({}).save();
};
```

This code will throw an error! But, Why?
Whenever we run Jest it starts new Node environment. Then it looks for all files that end in `.test.js` and executes **ONLY** them.
This means that our new Node env is not connected to mongoDB and is unaware that User model even exists.

To fix this issue we are going to create `setup.js` file inside test folder to configure Jest.

```js
// This line will tell Jest what User model is
require("../models/User");

const mongoose = require("mongoose");
const keys = require("../config/keys");

//
mongoose.Promise = global.Promise;
mongoose.connect(keys.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

afterAll(async () => {
  await mongoose.disconnect();
});
```

Making this file is not enough we need to tell Jest to run it. We can specify this in `package.json` with following entry:

```json
"jest": {
  "setupTestFrameworkScriptFile": "./tests/setup.js"
},
```

### Intoduction to Proxies

There is a problem we want to take Page class from Puppeteer and extend it to have login method. This login method is going to use login logic that we have established above.
We don't want to do this with monkey patching! What are our options?

Whenever we want to enchance functionalities of some object without actually changing it we can use Proxies.
Proxy allow us to manage access to some target object or multiple target objects. Idea is that whenever we want to access object we can access it through proxy, which is going to be responsible for dealing with that access in some custom way.

Example of you can use Proxy to enhance Page from Puppeteer.

```js
class CustomPage {
  static async build() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    const customPage = new CustomPage(page);

    return new Proxy(customPage, {
      get: function (target, property) {
        return target[property] || browser[property] || page[property];
      },
    });
  }

  constructor(page) {
    this.page = page;
  }

  async login() {
    const user = await userFactory();
    const { session, sig } = sessionFactory(user);

    await this.page.setCookie({ name: "session", value: session });
    await this.page.setCookie({ name: "session.sig", value: sig });
    await this.page.goto("localhost:3000/blogs");
    await this.page.waitFor('a[href="/auth/logout"]');
  }

  async getContentsOf(selector) {
    return this.page.$eval(selector, (el) => el.innerHTML);
  }
}
```

### Test timeout

Whenever a Jest test runs by default i has 5 seconds to either pass or fail a test. There can be a scenario where it can take more than 5 seconds to do something.
To change this you can add following line to your `setup.js` file:

```js
// Extends default timeout to 30 seconds
jest.setTimeout(30000);
```

### Common Test Setup

Blog test suite breakdown example:

- **When** logged in **(state)**
  - Can see the form **(assertion)**
  - **When** using valid form inputs **(state)**
    - Submitting takes user to review screen **(assertion)**
    - Submitting then saving adds blog to Blogs page **(assertion)**
  - **When** using invalid form inputs **(state)**
    - Submiting shows error messages **(assertion)**
- **When** not logged in **(state)**
  - Creating blog post results in an error **(assertion)**
  - Viewing blog post results in an error **(assertion)**

When we are coming up with test suite assertions, it is very beneficial to find their common testing states, because each testing state requries some setup, and we don't want to repeat them.

Every state is a **Describe Statement**, and every assertions is a **Test Statement**.
Describe Statement is used to group tests that share similar setup logic. It can have both Test and Describe Statements and can define Jest hooks to setup common conditions.

```js
describe("When logged in", async () => {
  beforeEach(async () => {
    await page.login();
    await page.click("a.btn-floating");
  });

  test("Can see blog create form", async () => {
    // beforeEach: logged in and on correct page
    const label = await page.getContentsOf("form label");
    expect(label).toEqual("Blog Title");
  });

  describe("And using invalid inputs", async () => {
    beforeEach(async () => {
      // Submitting empty form
      await page.click("form button");
    });

    test("the form shows an error message", async () => {
      // beforeEach: logged in and on correct page
      // beforeEach: form submitted

      const titleError = await page.getContentsOf(".title .red-text");
      const contentError = await page.getContentsOf(".content .red-text");

      expect(titleError).toEqual("You must provide a value");
      expect(contentError).toEqual("You must provide a value");
    });
  });

  describe("And using valid inputs", async () => {
    beforeEach(async () => {
      // Submitting valid form
      await page.type(".title input", "My Title");
      await page.type(".content input", "My Content");
      await page.click("form button");
    });

    test("Submitting takes user to review screen", async () => {
      const text = page.getContentsOf("h5");
      expect(text).toEqual("Please confirm your entries");
    });

    test("Submitting then saving adds blog to index page", async () => {
      // sends request to BE
      await page.click("button .green");
      // we need to wait for it to complete and redirect
      await page.waitFor(".card");

      const title = page.getContentsOf(".card-title");
      const content = page.getContentsOf("p");

      expect(title).toEqual("My Title");
      expect(content).toEqual("My Content");
    });
  });
});

describe("User is not logged in", async () => {
  test("User cannot create blog posts", async () => {
    const evalFn = async () => {
      const res = fetch("/api/blogs", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "My Title",
          content: "My Content",
        }),
      });

      return res.json();
    };

    const result = await page.evaluate(evalFn);
    expect(result).toEqual({ error: "You must log in!" });
  });
});
```

## Scalable Image/File Upload

When uploading image to AWS S3 through Express the image gets streamed to our backend where it is held into temporary storage until all chunks are received.
Issue here is that we are going to spend alot of Express resources (CPU and RAM) to deal with this image upload. This approach is alos not scalable.
Better alternative would be to use S3 presigned URL.

### Presigned URL

File upload flow:

1. Client tells server it needs to upload file to S3. Includes file name and file type.
2. Server asks S3 for presigned URL
3. AWS S3 responds with presigned URL that only works fro a file matching the original file name
4. Server sends url to React client
5. Client uploads image file **directly** to S3
6. Client tells server the upload was successful. Server saves URL of that new image

Features of presigned URL:

1. URL can only be used for a single file upload
2. URL encodes the file name and type of file
3. URL can expire
4. URL is generated by a secure request between our server and AWS
5. URL only works for the S3 bucket it is created for

### Presigned URL in Action

First we are going to create a set of User Credentials with AWS IAM service to control specific S3 bucket.
Inside AWS IAM there are two different types of records:

1. **User** - Users get policies assigned to them. Users are applications or people.
2. **Policy** - Describes what User can do on AWS.

For our purposes we are going to create both User and Policy.
When creating policy we need to specify:

- Service - Service this policy applies to, in our case S3
- Actions - What can User do with this service, in our case Write (upload images to S3)
- Resources - Sets resources this policy applies to, in our case we want to restirct access to specific bucket by adding its ARN (Amazon Resource Name).

When creating user we need to:

- Choose a name for User
- Select Access type - How user will access AWS, in our case its programmatic
- Attach existing policy

This will yield `Access key ID` and `Secret access key` which we are going to use with AWS SDK to get presigned URL.

```js
// This S3 instance is going to help us create presigned URL
const s3 = new AWS.S3({
  credentials: {
    accessKeyId: keys.awsAccessKeyId,
    secretAccessKey: keys.awsSecretAccessKey,
  },
  region: keys.awsRegion,
});

app.get("/api/upload", requireLogin, (req, res) => {
  const key = `${req.user.id}/${uuid()}.jpeg`;
  s3.getSignedUrl(
    "putObject",
    {
      Bucket: keys.awsBucketName,
      ContentType: "image/jpeg",
      Key: key,
    },
    (err, url) => res.send({ key, url })
  );
});
```

On frontend side we are going to first request presigned url from our server and then issue `PUT` request to AWS S3 bucket. When sending file to S3 bucket it is important to match Content-Type otherwise upload will fail.

```js
// Request to our server
const uploadConfig = await axios.get("/api/upload");
// Request to AWS bucket
await axios.put(uploadConfig.data.url, file, {
  headers: {
    "Content-Type": file.type,
  },
});
```

Since we are crossing origins with this upload we need to set up CORS policy on our S3 bucket to accept requests from our application.

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT"],
    "AllowedOrigins": ["http://localhost:3000"],
    "ExposeHeaders": [],
    "MaxAgeSeconds": 3000
  }
]
```

Next thing would be to allow public access to our S3 bucket since it is private by default, we can do this under Bucket Policy using policy generator.
