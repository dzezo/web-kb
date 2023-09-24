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
