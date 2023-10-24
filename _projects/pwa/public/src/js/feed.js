var shareImageButton = document.querySelector("#share-image-button");
var createPostArea = document.querySelector("#create-post");
var closeCreatePostModalButton = document.querySelector(
  "#close-create-post-modal-btn"
);
var sharedMomentsArea = document.querySelector("#shared-moments");
var form = document.querySelector("form");
var formTitle = document.querySelector("#title");
var formLocation = document.querySelector("#location");

function isServiceWorkerAvailable() {
  return "serviceWorker" in navigator;
}
function isSyncManagerAvailable() {
  return "SyncManager" in window;
}
function isCacheAvailable() {
  return "caches" in window;
}

function openCreatePostModal() {
  createPostArea.style.display = "block";
  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then(function (choiceResult) {
      console.log(choiceResult.outcome);

      if (choiceResult.outcome === "dismissed") {
        console.log("User cancelled installation");
      } else {
        console.log("User added to home screen");
      }
    });

    deferredPrompt = null;
  }
}

function closeCreatePostModal() {
  createPostArea.style.display = "none";
}

shareImageButton.addEventListener("click", openCreatePostModal);

closeCreatePostModalButton.addEventListener("click", closeCreatePostModal);

// Not in use currently, allows to save assets in cache on demand otherwise
function onSaveButtonClicked(event) {
  if (!isCacheAvailable()) return;

  caches.open("user-requested").then((cache) => {
    cache.add("https://httpbin.org/get");
    cache.add("/src/images/sf-boat.jpg");
  });
}

function updateFeed(data) {
  sharedMomentsArea.innerHTML = "";
  data.forEach((data) => {
    createCard(data);
  });
}

function createCard(data) {
  var cardWrapper = document.createElement("div");
  cardWrapper.className = "shared-moment-card mdl-card mdl-shadow--2dp";
  var cardTitle = document.createElement("div");
  cardTitle.className = "mdl-card__title";
  cardTitle.style.backgroundImage = `url(${data.image})`;
  cardTitle.style.backgroundSize = "cover";
  cardTitle.style.height = "180px";
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement("h2");
  cardTitleTextElement.className = "mdl-card__title-text";
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement("div");
  cardSupportingText.className = "mdl-card__supporting-text";
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = "center";
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

var networkDataReceived = false;

fetch(postsURL)
  .then(function (res) {
    return res.json();
  })
  .then(function (data) {
    networkDataReceived = true;
    updateFeed(Object.values(data));
  });

if ("indexedDB" in window) {
  readAllData("posts").then((data) => {
    if (networkDataReceived) return;
    updateFeed(data);
  });
}

form.addEventListener("submit", function (event) {
  event.preventDefault();

  if (formTitle.value.trim() === "" || formLocation.value.trim() === "") {
    alert("Please enter valid data!");
    return;
  }

  closeCreatePostModal();

  const post = {
    id: new Date().toISOString(),
    title: formTitle.value,
    location: formLocation.value,
  };

  if (!isServiceWorkerAvailable() || !isSyncManagerAvailable()) {
    // If sw and sync manager are available fetch will happen in sw
    fetch(postsURL, {
      method: "POST",
      body: JSON.stringify(post),
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    return;
  }

  // ready - sw installed and activated
  // we can't listen to form submission in sw since its decouple from DOM
  // this is how we can communicate with sw
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
});
