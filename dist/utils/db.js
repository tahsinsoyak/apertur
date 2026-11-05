/**
 * IndexedDB helper for storing and retrieving high-definition video recordings.
 */
const DB_NAME = 'TabRecorderDB';
const DB_VERSION = 1;
const STORE_NAME = 'recordings';

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

/**
 * Saves a recording blob and metadata to IndexedDB.
 * Waits for transaction.oncomplete so large video Blobs are 100% flushed to disk
 * before the Offscreen Document is closed.
 */
async function saveRecording(recordingData) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(recordingData);

    transaction.oncomplete = () => {
      db.close();
      resolve(recordingData.id);
    };

    transaction.onerror = (e) => {
      db.close();
      reject(e.target.error || new Error('IndexedDB transaction failed'));
    };

    transaction.onabort = (e) => {
      db.close();
      reject(e.target.error || new Error('IndexedDB transaction aborted'));
    };
  });
}

/**
 * Retrieves a recording by ID
 */
async function getRecording(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    let result = null;

    request.onsuccess = (e) => {
      result = e.target.result;
    };

    transaction.oncomplete = () => {
      db.close();
      resolve(result);
    };

    transaction.onerror = (e) => {
      db.close();
      reject(e.target.error);
    };
  });
}

/**
 * Deletes a recording by ID
 */
async function deleteRecording(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(id);

    transaction.oncomplete = () => {
      db.close();
      resolve(true);
    };

    transaction.onerror = (e) => {
      db.close();
      reject(e.target.error);
    };
  });
}

/**
 * Lists all recordings
 */
async function getAllRecordings() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    let result = [];

    request.onsuccess = (e) => {
      result = e.target.result || [];
    };

    transaction.oncomplete = () => {
      db.close();
      resolve(result);
    };

    transaction.onerror = (e) => {
      db.close();
      reject(e.target.error);
    };
  });
}

/**
 * Saves a screenshot (Blob or DataURL) and metadata to IndexedDB.
 */
async function saveScreenshot(screenshotData) {
  const item = {
    ...screenshotData,
    type: 'screenshot',
    timestamp: screenshotData.timestamp || Date.now(),
    id: screenshotData.id || `snip-${Date.now()}`
  };
  return saveRecording(item);
}

/**
 * Lists all screenshots only
 */
async function getAllScreenshots() {
  const all = await getAllRecordings();
  return all.filter((item) => item.type === 'screenshot');
}

/**
 * Lists all videos only
 */
async function getAllVideos() {
  const all = await getAllRecordings();
  return all.filter((item) => item.type !== 'screenshot');
}

// Make accessible for both module & non-module scripts (Window and ServiceWorker / Worker)
const dbExport = {
  saveRecording,
  saveScreenshot,
  getRecording,
  deleteRecording,
  getAllRecordings,
  getAllScreenshots,
  getAllVideos
};

if (typeof window !== 'undefined') {
  window.RecorderDB = dbExport;
}
if (typeof self !== 'undefined') {
  self.RecorderDB = dbExport;
}
