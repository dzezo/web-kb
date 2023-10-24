var dbPromise = idb.open("posts-store", 1, (db) => {
  if (!db.objectStoreNames.contains("posts")) {
    db.createObjectStore("posts", { keyPath: "id" });
  }
  if (!db.objectStoreNames.contains("sync-posts")) {
    db.createObjectStore("sync-posts", { keyPath: "id" });
  }
});

function writeAllData(store, data) {
  return dbPromise.then((db) => {
    // Start transaction
    const tx = db.transaction(store, "readwrite");
    // Open object store
    const st = tx.objectStore(store);
    // Insert object into object store
    Object.keys(data).forEach((key) => st.put(data[key]));
    // Commit transaction
    return tx.complete;
  });
}

function readAllData(store) {
  return dbPromise.then((db) => {
    const tx = db.transaction(store, "readonly");
    const st = tx.objectStore(store);
    return st.getAll();
  });
}

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
