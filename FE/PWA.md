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

If we registerd service worker inside help directory we **would not** be able to set scope to root!

To unregister service worker you can call `unregister` on all registrations, example:

```js
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
}
```

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
          cache.put(event.request, _res);
        });
        return res;
      });
    })
  );
});
```

Note that `cache.put` doesn't execute request before storing it, like `cache.add` does.

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

### Cache on Demand

You can access Cache storage from your _"frontend"_ code with the same API. Example of storing request data no button click:

```js
function onSaveButtonClicked() {
  // Check if Cache storage is supported in users browser
  if (!("caches" in window)) return;

  caches.open("user-requested").then((cache) => {
    cache.add("https://httpbin.org/get");
    cache.add("/src/images/sf-boat.jpg");
  });
}
```

### Offline Fallback Page

It might be good to have offline fallback page in case user wants to see some page that is not supported in offline mode. You can achieve this by returning `offline.html` file whenver user fails to `GET` some html content while offline.

You can use `accept` property in request header to see if its HTML request.

```js
// in catch block
const isHTMLRequest = event.request.headers.get("accept").includes("text/html");

if (isHTMLRequest) {
  return caches.open(CACHE_STATIC_NAME).then((cache) => {
    return cache.match("/offline.html");
  });
}
```

### Post Requet and Cache API

Cache storage is saving fetch responses, so if configuration of service worker allows POST response will get cached, but once we go offline all POST requests will fail because you can't initiate such request while offline.

### Trimming Cach

There is a size limit to your cache, so its adviced to keep your cache trimmed.

```js
function trimCache(cacheName, maxItems) {
  caches.open(cacheName).then((cache) =>
    cache.keys().then((keys) => {
      if (keys.length > maxItems) {
        // Remove the oldest item, and try to trim more
        cache.delete(keys[0]).then(trimCache(cacheName, maxItems));
      }
    })
  );
}
```

## IndexedDB and Dynamic Data

Cache storage is good for storing assets like style sheets, images and other files. We can use this Cache for storing dynamic data like one we may get from server, but its better to use IndexedDB for that.

## IndexedDB

This is transactional Key-Value Database in the browser. Being transactional means that if one action within transaction fails others are not applied. You can store both structured, like JSON, and unstructured data, like Files/Blobs.
It can be accessed asynchronously which means that it can be used in Service Workers, unlike Session and Local storage which are only accessed synchronously and therefore can't be used in Service Workers.

### CRUD with IndexedDB

This PWA course uses `idb` library, which is a wrapper around indexedDB that promisifies its API.

```js
// Opens posts-store db version 1
var dbPromise = idb.open("posts-store", 1, (db) => {
  // if collection doesn't exist create one
  if (!db.objectStoreNames.contains("posts")) {
    db.createObjectStore("posts", { keyPath: "id" });
  }
});
```

To write into DB we are going to start transaction towards object store in `readwrite` mode. Once we finish with writing it is important to commit the transaction.

```js
function writeAllData(store, data) {
  return dbPromise.then((db) => {
    // Start transaction
    const tx = db.transaction(store, "readwrite");
    // Open object store
    const st = tx.objectStore(store);
    // Upsert object into object store
    Object.keys(data).forEach((key) => st.put(data[key]));
    // Commit transaction
    return tx.complete;
  });
}
```

When reading data from DB we also need to open transaction, this time in `readonly` mode. We don't have to commit this transaction, since we are not modifing data inside.

```js
function readAllData(store) {
  return dbPromise.then((db) => {
    const tx = db.transaction(store, "readonly");
    const st = tx.objectStore(store);
    return st.getAll();
  });
}
```

Deleting data is done in `readwrite` mode.

```js
function clearAllData(store) {
  return dbPromise.then((db) => {
    const tx = db.transaction(store, "readwrite");
    const st = tx.objectStore(store);
    st.clear();
    return tx.complete;
  });
}

function clearData(store, dataId) {
  return dbPromise.then((db) => {
    const tx = db.transaction(store, "readwrite");
    const st = tx.objectStore(store);
    st.delete(dataId);
    return tx.complete;
  });
}
```

Since service worker lives on separate thread to use idb and this utility functions we need to import them. Importing scripts into service worker is done by using `importScripts`

```js
importScripts("/src/js/idb.js");
importScripts("/src/js/utils.js");
```

## Background Sync

Background sync is all about sending data to a server when we have no internet connection.
To acomplish this we can register listener on `sync` event which listens when connectivity is (re-)established. Here we can instruct our service worker to store data in IndexedDB until its time to send it to the server.
This event will also fire if the connectivity was always there as soon as a new sync task was registered, which means that we can have logic for both online and offline state inside same event listener.
Good thing about this is that it works in the background, so user doesn't have to be using our app for sync to occur.

### Background Sync in Action

Whenever user submits a form, we can store that data in IndexedDB under some synchronization collection, and trigger `sync` event on currently active service worker.

```js
// ready - sw installed and activated
navigator.serviceWorker.ready.then((sw) => {
  writeAllData("sync-posts", [post])
    .then(() => {
      return sw.sync.register("sync-new-posts");
    })
    .then(() => {
      const snackbarContainer = document.querySelector("#confirmation-toast");
      const data = {
        message: "Your Post was saved for syncing",
      };

      snackbarContainer.MaterialSnackbar.showSnackbar(data);
    })
    .catch((err) => console.err(err));
});
```

Now in our service worker we can register event listener on `sync` and react to specific sync event by using tag name. Example below reads form data from IndexedDB and sends POST request, if request is successful entry from IndexedDB is removed.

```js
self.addEventListener("sync", function (event) {
  if (event.tag === "sync-new-posts") {
    event.waitUntil(
      readAllData("sync-posts").then((data) => {
        data.forEach((post) => {
          fetch(postsURL, {
            method: "POST",
            body: JSON.stringify(post),
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          })
            .then((res) => {
              if (!res.ok) return;
              clearData("sync-posts", post.id);
            })
            .catch((err) => console.log("Error while sending data", err));
        });
      })
    );
  }
});
```

### Periodic Sync

[Periodic Sync](https://developer.mozilla.org/en-US/docs/Web/API/Web_Periodic_Background_Synchronization_API#browser_compatibility) is all about getting data on a regular basis from the server. Its good for when our data changes frequently and we want our application to get updates in the background. This is still experimental feature.

## Push notifications

### Requesting permission

It might be useful to check if client browser even supports notifications

```js
function areNotificationsSupported() {
  return "Notification" in window;
}
```

Then we can ask user to grant notification permissions. Note that notification permissions also include push permission.

```js
function askForNotificationPermission() {
  Notification.requestPermission((userChoice) => {
    if (userChoice !== "granted") {
      console.log("Permission denied");
    } else {
      console.log("Permission granted");
      displayConfirmNotification();
    }
  });
}
```

### Displaying Notification

Important thing to remember is that notifications are not shown by your browser, they are shown by your device. With that said available options may vary, title and body are supported across the board so you should put main information in there.

```js
function displayConfirmNotification() {
  /**
   * @param icon - usually shown on the right, should be app icon
   * @param image - shown in notification body
   * @param vibrate - allows you to define vibration pattern, that goes: [vibration, pause, vibration, pause, ...]
   * @param badge - icon on Android toolbar. Android will turn it into black and white icon
   * @param tag - notification identifier. Notification with same tag will overwrite
   * @param notify - whether notification should vibrate after overwrite
   */
  const options = {
    body: "You successfully subscribed to our Notification service!",
    icon: "/src/images/icons/app-icon-96x96.png",
    image: "/src/images/sf-boar.jpg",
    dir: "ltr",
    lang: "en-US",
    vibrate: [100, 50, 200],
    badge: "/src/images/icons/app-icon-96x96.png",
    tag: "confirm-notification",
    renotify: true,
  };
  new Notification("Successfully subscribed!", options);
}
```

Displaying notifications from service worker

```js
function displayConfirmNotification() {
  if (!("serviceWorker" in navigator)) return;

  const options = {
    body: "You successfully subscribed to our Notification service!",
  };
  navigator.serviceWorker.ready.then((sw) => {
    sw.showNotification("Successfully subscribed!", options);
  });
}
```

### Notification actions

Notification options allow you to define actions

```js
const options = {
  actions: [
    { action: "confirm", title: "Okay", icon: "/src/images/checkmark.png" },
    { action: "cancel", title: "Cancel" },
  ],
};
```

Reacting to these actions is done in service worker, because notifications are displayed by the device not browser, and user can therefore interact with them even when our application is closed.

```js
// sw.js
self.addEventListener("notificationclick", (event) => {
  const notification = event.notification;
  const action = event.action;

  if (action === "confirm") {
    console.log("user confirmed");
  }

  notification.close();
});

// click x or swipe away
self.addEventListener("notificationclose", (event) => {
  console.log("notification was closed");
});
```

### Push notification

Subscriptions to push notification are managed in service worker, because users device needs to react to our events even when application is closed.
We can react to some event on our frontend and initialize subscription once condition is met, good example would be to set up push notifications once users allows notifications.

```js
function enableNotifications() {
  Notification.requestPermission((userChoice) => {
    if (userChoice === "grant") configurePushSub();
  });
}
```

Once we create subscription it is important to protect it. If attacker gets a hold of browser vendor endpoint for this user, he can then send notifications instead of us.
We can protect this by using VAPID keys to identify our backend service. You can generate your own keys, but its probably better to use `web-push` lib.

On backend side run `npm i web-push -s`, create web-push script in package.json like this:

```json
"scripts": {
  "web-push": "web-push"
}
```

then run `npm run web-push generate-vapid-keys`, you need to do this once. Result of this is public and private key. We are going to use public key in our FE application but not like this (base64), we need to convert it into `Uint8Array`.

```js
function configurePushSub() {
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker.ready.then((sw) => {
    sw.pushManager.getSubscription().then((sub) => {
      if (sub) return;

      // if we have subscription this will overwrite
      sw.pushManager
        .subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64ToUint8Array(vapidPublicKey),
        })
        .then((sub) => storeSubscription(sub));
    });
  });
}

// save subscription on our backend
function storeSubscription(sub) {
  return fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(sub),
  });
}
```

Important thing to note is that if user clears site data, which may include unregistering service worker. Subscription managed by service worker will be lost, which means that our stored subscription will become useless.

On our backend we can push notifications using `web-push` lib, like this:

```js
const webpush = require("web-push");

// You don't need to transform VAPID keys, that's pushManager requirement on FE
webpush.setVapidDetails(
  "mailto:business@gmail.com",
  publicVapidKey,
  privateVapidKey
);

// Get subscriptions from DB
// We want to send notification to every device this user has
const subscriptions = Subscriptions.findMany({ userId });
const data = {
  title: "New Post",
  content: "New Post Content!",
};
subscriptions.forEach((subscription) => {
  // This returns promise which we can await
  webpush.sendNotification(subscription, JSON.stringify(data));
});
```

In our service worker we need to listen to `push` event in order to catch this data, and display Notification. Active service worker **can't display notifications**, we need to use service worker registration.
Registration has pushManager that holds subscription we are trying to serve.

```js
self.addEventListener("push", (event) => {
  if (event.data) return;

  const data = JSON.parse(event.data);
  const options = {
    body: data.content,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});
```

### Opening a Page

We can use `clients` to get access to all clients that are in scope of active service worker. There are three types of client: window, worker and sharedWorker.
By doing so we can instruct window client to navigate to some page or open new window (tab).

```js
self.addEventListener("notificationclick", (event) => {
  const notification = event.notification;
  const action = event.action;

  if (action === "confirm") {
    event.waitUntil(
      clients.matchAll().then((cs) => {
        const client = cs.find((c) => c.visibilityState === "visible");
        if (client) {
          client.navigate("http://localhost:8080");
          client.focus();
        } else {
          // opens tab
          clients.openWindow("http://localhost:8080");
        }
      })
    );
  }

  notification.close();
});
```

Problem with code above is that it navigates to some static page. How can we navigate to user specific page with data received in `push` event?
For that we can use data property when defining notification options.

```js
self.addEventListener("push", (event) => {
  if (event.data) return;

  const data = JSON.parse(event.data);
  const options = {
    body: data.content,
    data: {
      url: data.openUrl,
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  const notification = event.notification;
  const data = notification.data;
  const action = event.action;

  if (action === "confirm") {
    event.waitUntil(openUrl(url));
  }

  notification.close();
});

function openUrl(url) {
  clients.matchAll().then((_clients) => {
    const client = _clients.find(
      (client) => client.visibilityState === "visible"
    );
    if (client) {
      client.navigate(url);
      client.focus();
    } else {
      clients.openWindow(url);
    }
  });
}
```
