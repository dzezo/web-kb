# PWA

## PWA Core Building Blocks

### Service Workers

Service Worker is JS background process that runs even when your application is closed.
They are used for:

- Caching/Offline support
- Enable other PWA features
  - Background Sync - Sync user data once internet connection is established
  - Web Push - Mobile-like push notifications

### Application Manifest

This is one single file that you can use to pass some extra information to your browser. Browser can take this information to display some things about your application differently, and depending on OS allow you to intall aplication on your home screen.

### Native API

API to access device native features like:

- Geolocation API - user location access
- Media API - device camera and microphone access

## Application Manifest

Create `manifest.json` in your root folder.
To use it add link tag in head of all your pages in case of MPA or just in `index.html` if you have SPA, like this:

```html
<link rel="manifest" href="/manifest.json" />
```

### Manifest Properties

These are some of many properties that can be defined in manifest file for more information visit:
https://web.dev/articles/add-manifest
https://web.dev/articles/customize-install

- `name` - Long name of app (e.g. on Splashscreen)
- `short_name` - Short name of app (e.g. below icon)
- `start_url` - Which page to load when user clicks on icon
- `scope` - Which pages are include in PWA, `"."` means all pages
- `display` - Should it look like standalone app, `"standalone"` means no browser controls
- `background_color` - Color whilst loading and on Splashscreen
- `theme_color` - Theme color (e.g. top bar in task switcher)
- `description` - Description (e.g. as favorite)
- `dir` - Read direction of your app
- `lang` - Main language of app
- `orientation` - Set (and enforce) default orientation
- `icons` - Configure icons, system will chose the best-fitting one
  ```json
  {
    "icons": [
      {
        "src": "/src/images/icons/app-icon-48x48.png",
        "type": "image/png",
        "sizes": "48x48"
      }
    ]
  }
  ```
- `related_applications` - Related native applications users might want to install, in case you have both Native and PWA
  ```json
  {
    "related_applications": [
      {
        "platform": "play",
        "url": "https://play.google.com/...",
        "id": "com.example.app1"
      }
    ]
  }
  ```

#### Safari support

Safari support for `manifest.json` file is not good at this moment. But they use some specific meta tags to accomplish similar results.

```html
<!-- Tells Safari browser that this app is installable -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<!-- Control how status bar looks in your PWA -->
<meta name="apple-mobile-web-app-title" content="PWAGram" />
<meta name="apple-mobile-web-app-status-bar-style" content="black" />
<!-- This how you can add icons -->
<meta
  name="apple-touch-icon"
  href="/src/images/icons/apple-icon-144x144.png"
  size="144x144"
/>
<meta
  name="apple-touch-icon"
  href="/src/images/icons/apple-icon-512x512.png"
  size="512x512"
/>
```

## The Service Workers

Service worker run on **additional single thread**, and are **decoupled** from HTML document! Once registered service worker is available on all your pages, and **they live even after pages have been closed**. Since they have these properties they are good for reacting to events, either from your app or some external server (push notifications).

Service workers are special type of web workers. Web workers also run on a background thread, decoupled from the DOM, but **they don't keep on living** after page is closed! They can communicate with _"normal"_ JS code using messages like web workers.

There can be multiple service workers **but only with different scopes**. The more specific service worker overwrites the other one for its scope (like css selectors). Service worker scope is by default folder that he sits in.

Service workers only work on HTTPS connections, so you need to serve your app over HTTPS!

### Listenable Events

| Event                    | Source                                                           |
| :----------------------- | :--------------------------------------------------------------- |
| Fetch                    | Browser or page-related JS initiates a fetch [^1]                |
| Push Notifiactions       | Service worker receives Web Push Notification (from Server) [^2] |
| Notification Interaction | User interacts with displayed notification                       |
| Background Sync          | e.g. Internet Connection was restored                            |
| Service Worker Lifecycle | Service Worker phase changes                                     |

It is possible to have multiple event listeners in a service worker.

[^1]: _HTTP Request like image tag GET or fetch API triggers `fetch` event. You don't trigger fetch using XMLHttpRequest (XHR) utilized in libraries like Axios._
[^2]: Every browser vendor has its own web push server, you can send push notifications to these servers from your server, then theses servers will send push notification to your client.\*

### Lifecycle

Once browser loads `index.html` it will execute `main.js` file. This file will tell browser to register service worker.

`installation` _(registration)_
`activation` _(registration)_ - just got activated by the browser, it now controlls all pages of _Scope_
`idle` - inactive
`terminated` - after prolonged inactivity it goes into stand-by, until some event occurs like `fetch`

It may seem that service worker gets installed every time we refresh the page, but it won't if the service worker file hasn't changed. But it will ofcourse try.

### Registering Service Worker

You want to register service worker on all your pages, since you don't know which ones are going to be visited by user, perfect place for that would be `app.js` file.

```js
// Check if browser supports service worker
// by checking serviceWorker property in navigator object
if ("serviceWorker" in navigator) {
  // Register service worker
  navigator.serviceWorker
    .register("/sw.js")
    .then((reg) => {
      console.log("Service worker registered", reg);
    })
    .catch((err) => {
      console.log("Service worker not registered", err);
    });
}
```

register function takes second argument where you can define scope of your service worker. For example we can do:

```js
navigator.serviceWorker.register("/sw.js", { scope: "/help" });
```

If we registerd service worker inside help directory would **would not** be able to set scope to root!

### Reacting to events

In our service worker file we are going to refer to service worker with `self` keyword, this is example of how to set up event listener.

```js
self.addEventListener("install", (event) => {
  console.log("Service worker has been installed", event);
});
```

New service worker **will not** activate immediately, you **need to re-open** your application! There are a couple of ways around this you can check `Update on reload`, click on `Unregister` and then refresh, click on `Update` or click on `skip waiting` next to activation status.

```js
self.addEventListener("activated", (event) => {
  console.log("Service worker has been activated", event);
  return self.clients.claim();
});
```

Listening to fetch event is really powerful, because our service worker acts as a network proxy. You can intercept both outgoing and incoming requests and overwrite the response. This is specially usefull for responding to offline network requests.

```js
self.addEventListener("fetch", (event) => {
  console.log("Fetching something ...", event);
  // This allows us to overwrite the response
  event.respondWith(fetch(event.request));
});
```

### Deffered installation

We can control when we want to show installation banner to our users, but first we need to intercept default instalation and prevent it:

```js
var defferedPrompt;
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  defferedPrompt = event;
  return false;
});
```

Then when our conditions are met we can show it:

```js
if (defferedPrompt) {
  defferedPrompt.prompt();
  defferedPrompt.userChoice.then((choice) => {
    if (choice.outcome === "dismissed") {
      console.log("User cancelled installation");
    } else {
      console.log("User added to home screen");
    }
  });
  defferedPrompt = null;
}
```

### Testing with Real Device

Enable debugging and open Remote devices tool in Chrome, there just port forward your application.

## Service Worker - Caching

### Cache API

[Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache) provides persistant storage mechanism for Request/Response object pairs. Note that Cache is accessible from both workers and windowed scope.

### Pre-Caching

The install events in service workers use `waitUntil()` to hold the service worker in the installing phase until tasks complete.
If the promise passed to `waitUntil()` rejects, the install is considered a failure, and the installing service worker is discarded.
This is primarily used to ensure that a service worker is not considered installed until all of the core caches it depends on are successfully populated.

Pre-caching is caching during installation period.

```js
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("static").then((cache) => {
      cache.add("/src/js/app.js");
    })
  );
});
```

`caches` refers to overal Cache storage available under Application tab in Dev Tools. `cache` is particular cache that we opened within that storage, if `cache` with that name doesn't exist it is upserted.
When adding things to cache you need to think of **keys as requests not strings**. For example eventho we are adding `app.js` and `index.html` our app is not going to load in offline mode!

```js
cache.add("/index.html");
cache.add("/src/js/app.js");
```

Thats because we are not caching request user is triggering when he opens our app!

```js
cache.add("/"); // key is domain root request e.g. localhost:3000
```

`add` sends a request and automatically stores the request response key-value pair. There is method called `addAll` to do this for multiple resources at once:

```js
cache.addAll([
  "/",
  "/index.html",
  "/src/js/app.js",
  "/src/js/feed.js",
  "/src/js/promise.js",
  "/src/js/fetch.js",
  "/src/js/material.min.js",
  "/src/css/app.css",
  "/src/css/feed.css",
  "/src/images/main-image.jpg",
  "https://fonts.googleapis.com/css?family=Roboto:400,700",
  "https://fonts.googleapis.com/icon?family=Material+Icons",
  "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
]);
```

Now to intercept and serve from cache we can listen on `fetch` request and use `respondWith`:

```js
self.addEventListener("fetch", function (event) {
  event.respondWith(
    // Request object is key, not string!!!
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      } else {
        return fetch(event.request);
      }
    })
  );
});
```

In case of cache miss cachedResponse is `null`, it doesn't throw an error.

### Dynamic-Caching

Dynamic caching means that we want to cache some request.

This is example of how we would approach such scenario. Note that once Response is used it is considered empty and **cannot be used**! `clone()` allows multiple uses of body object.

```js
self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((res) => {
        const _res = res.clone();
        caches.open("dynamic").then((cache) => {
          cache.put(event.request.url, _res);
        });
        return res;
      });
    })
  );
});
```

### Adding Cache Versioning

To version your cache it is better to change name of sub cache and delete old ones after service worker has been activated.
It is not adviced to delete old cache during installation because application may depend on some data from it.

Example of cache pruning, it is important to wait until delete is completed before calling claim, to ensure that application is using new cache.

```js
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then((keyList) => {
      const staleCaches = keyList.filter(
        (key) => ![CACHE_STATIC_NAME, CACHE_DYNAMIC_NAME].includes(key)
      );
      return Promise.all(staleCaches.map((cache) => caches.delete(cache)));
    })
  );
  return self.clients.claim();
});
```

## Service Worker - Advanced Caching
