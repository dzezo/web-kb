importScripts("/src/js/idb.js");
importScripts("/src/js/utils.js");
importScripts("/src/js/consts.js");

const CACHE_STATIC_NAME = "static-v1";
const CACHE_DYNAMIC_NAME = "dynamic-v1";
const STATIC_FILES = [
  "/",
  "/index.html",
  "/offline.html",
  "/src/js/app.js",
  "/src/js/feed.js",
  "/src/js/idb.js",
  "/src/js/promise.js",
  "/src/js/fetch.js",
  "/src/js/material.min.js",
  "/src/css/app.css",
  "/src/css/feed.css",
  "/src/images/main-image.jpg",
  "https://fonts.googleapis.com/css?family=Roboto:400,700",
  "https://fonts.googleapis.com/icon?family=Material+Icons",
  "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME).then((cache) => {
      cache.addAll(STATIC_FILES);
    })
  );
});

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

self.addEventListener("fetch", function (event) {
  if (event.request.url.indexOf(apiURL) > -1) {
    event.respondWith(
      fetch(event.request).then((res) => {
        const _res = res.clone();

        _res.json().then((data) => {
          clearAllData("posts").then(writeAllData("posts", data));
        });

        return res;
      })
    );
  }
});

self.addEventListener("sync", function (event) {
  if (event.tag === "sync-new-posts") {
    console.log("Syncing new posts");
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
