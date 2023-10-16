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
<meta name="apple-touch-icon" href="/src/images/icons/apple-icon-144x144.png" size="144x144" />
<meta name="apple-touch-icon" href="/src/images/icons/apple-icon-512x512.png" size="512x512" />
```

## The Service Workers

Service worker run on **additional single thread**, and are **decoupled** from HTML document! Once registered service worker is available on all your pages, and **they live even after pages have been closed**. Since they have these properties they are good for reacting to events, either from your app or some external server (push notifications).

Service workers are special type of web workers. Web workers also run on a background thread, decoupled from the DOM, but **they don't keep on living** after page is closed! They can communicate with _"normal"_ JS code using messages like web workers.

There can be multiple service workers **but only with different scopes**. The more specific service worker overwrites the other one for its scope (like css selectors).

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
