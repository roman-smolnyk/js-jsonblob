/*
response = await fetch("https://jsonblob.com/api/jsonBlob", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({"zebra": 12}),
      });

response.status // 201

blobUrl = response.headers.get("Location"); // Be aware of the http
data = await response.json(); // Returns my payload

blobId = "1365939953321828352"
response = await fetch(`https://jsonblob.com/api/jsonBlob/${blobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({"love": 500}),
      });

response.status // 200
data = await response.json(); // Returns my payload

blobId = "1365939953321828352"
response = await fetch(`https://jsonblob.com/api/jsonBlob/${blobId}`);

response.status // 404

data = await response.json(); {"message": "Error message"}

*/

// TODO: Delete request

class JSONBlobClient {
  // Blob will be removed after 30 days of inactivity
  static API_URL = "https://jsonblob.com/api/jsonBlob";
  // Approximately
  static CONTENT_LENGTH_LIMIT = 1500503; // response.headers.get("Content-Length")

  static _parseBlobId(blobUrl) {
    const logPrefix = `${this.name}.${this._parseBlobId.name}`;
    const match = blobUrl.match(/jsonblob.com\/api\/jsonBlob\/(\d+)/);
    if (!match) throw new Error(`${logPrefix} -> No match for blobId`);
    return match[1];
  }

  static async createBlob(jsonObj) {
    const logPrefix = `${this.name}.${this.createBlob.name}`;
    const response = await fetch(this.API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jsonObj),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`${logPrefix} -> ${response.status} -> ${data}`);
    }

    const newBlobId = this._parseBlobId(response.headers.get("Location"));
    return newBlobId;
  }

  static async updateBlob(blobId, jsonObj) {
    const logPrefix = `${this.name}.${this.updateBlob.name}`;
    const response = await fetch(`${this.API_URL}/${blobId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jsonObj),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`${logPrefix} -> ${response.status} -> ${data}`);
    }
  }

  static async getBlob(blobId) {
    const logPrefix = `${this.name}.${this.getBlob.name}`;
    const response = await fetch(`${this.API_URL}/${blobId}`);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`${logPrefix} -> ${response.status} -> ${data}`);
    }

    return data;
  }

  static isBlobExpired = async (blobId) => {
    return !(await JSONBlobClient.getBlob(blobId));
  };
}

// #########################################################################

class JSONBlobKeyIsMissing extends Error {}

class JSONBlobStorage {
  static DEFAULT_LOCAL_STORAGE_KEY = JSONBlobStorage.name;
  constructor() {
    this.keysBlobId = null;
    this.keys = new Map();
  }

  async set(key, value) {
    const logPrefix = `${this.constructor.name}.${this.set.name}`;
    let isNewKey = false;
    if (this.keys.has(key)) {
      await JSONBlobClient.updateBlob(this.keys.get(key), value);
    } else {
      const blobId = await JSONBlobClient.createBlob(value);
      this.keys.set(key, blobId);
      // Update keys
      await JSONBlobClient.updateBlob(this.keysBlobId, Object.fromEntries(this.keys));
      isNewKey = true;
    }
    return isNewKey;
  }

  async get(key) {
    const logPrefix = `${this.constructor.name}.${this.get.name}`;
    if (!this.keys.has(key)) throw new JSONBlobKeyIsMissing(`${logPrefix} -> '${key}' is missing`);

    return await JSONBlobClient.getBlob(this.keys.get(key));
  }

  async init(keysBlobId) {
    const logPrefix = `${this.constructor.name}.${this.init.name}`;
    if (!keysBlobId) throw new Error(`${logPrefix} -> missing keysBlobId`);
    const keys = await JSONBlobClient.getBlob(keysBlobId);
    this.keys = new Map(Object.entries(keys));
    this.keysBlobId = keysBlobId;
  }

  async updateKeys(keys) {
    if (keys) this.keys = keys;
    await JSONBlobClient.updateBlob(this.keysBlobId, Object.fromEntries(this.keys));
  }

  async __keepAlive() {
    // * Update this key on every creation to keep keysBlobId alive even if no new keys created
    this.keys.set("__lifekeeper", new Date().toISOString());
    await this.updateKeys();
  }

  static async buildClient(localStorageKey) {
    const logPrefix = `${this.name}.${this.buildClient.name}`;
    localStorageKey = localStorageKey ? localStorageKey : JSONBlobStorage.DEFAULT_LOCAL_STORAGE_KEY;
    const keysBlobId = localStorage.getItem(localStorageKey) || (await JSONBlobClient.createBlob({}));
    localStorage.setItem(localStorageKey, keysBlobId);
    const jsonBlobStorage = new JSONBlobStorage();
    await jsonBlobStorage.init(keysBlobId);
    await jsonBlobStorage.__keepAlive();
    return jsonBlobStorage;
  }
}
