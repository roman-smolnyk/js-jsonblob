//

class JSONBlobExpired extends Error {}

class JSONBlobClient {
  // Blob is removed after 30 days of inactivity
  static API_URL = "https://jsonblob.com/api/jsonBlob";
  static KEY = JSONBlobClient.name;
  // Approximately
  static CONTENT_LENGTH_LIMIT = 1500503; // response.headers.get("Content-Length")

  constructor() {
    this.keysBlobId = null;
    this.keys = {};
  }

  static createBlob = async (data) => {
    const logPrefix = `${this.name} -> createBlob`;
    try {
      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error(`${logPrefix} : ${response.status}`);
        return;
      }

      // const headers = {};
      // response.headers.forEach((value, name) => {
      //   headers[name] = value;
      // });
      // console.log(headers);

      const location = response.headers.get("Location");

      const blobId = new URL(location).pathname.split("/").pop();
      return blobId;
    } catch (error) {
      console.warn(error);
      // throw error;
    }
  };

  static updateBlob = async (blobId, data) => {
    const logPrefix = `${this.name} -> updateBlob`;
    try {
      const response = await fetch(`${this.API_URL}/${blobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      // const headers = {};
      // response.headers.forEach((value, name) => {
      //   headers[name] = value;
      // });
      // console.log(headers);

      if (!response.ok) {
        console.warn(`${logPrefix} : ${response.status}`);
        return;
      }

      return true;
    } catch (error) {
      console.warn(error);
      return;
    }
  };

  // Get the content of a JSON blob
  static getBlob = async (blobId) => {
    const logPrefix = `${this.name} -> getBlob`;
    try {
      const response = await fetch(`${this.API_URL}/${blobId}`);

      if (!response.ok) {
        console.warn(`${logPrefix} : ${response.status}`);
        return;
      }

      //   const headers = {};
      //   response.headers.forEach((value, name) => {
      //     headers[name] = value;
      //   });
      //   console.log(headers);

      const data = await response.json();
      return data;
    } catch (error) {
      console.warn(error);
      // throw error;
    }
  };

  set = async (key, value) => {
    let blobId = this.keys[key];
    if (blobId) {
      return await JSONBlobClient.updateBlob(blobId, value);
    } else {
      blobId = await JSONBlobClient.createBlob(value);
      if (blobId) {
        this.keys[key] = blobId;
        return await JSONBlobClient.updateBlob(this.keysBlobId, this.keys);
      }
    }
  };

  get = async (key) => {
    const logPrefix = `${this.constructor.name} -> get`;
    let blobId = this.keys[key];

    if (!blobId) return null;

    return await JSONBlobClient.getBlob(blobId);
  };

  getKeysFromKeysBlob = async () => {
    let keys = await JSONBlobClient.getBlob(this.keysBlobId);
    if (keys !== null && !Array.isArray(keys) && typeof keys === "object") {
      return keys;
    }
    return null;
  };

  createKeysBlob = async () => {
    const logPrefix = `${this.constructor.name} -> createKeysBlob`;
    const keysBlobId = await JSONBlobClient.createBlob({});
    if (!keysBlobId) throw new Error(`${logPrefix}`);
    this.keysBlobId = keysBlobId;
    this.keys = {};
    localStorage.setItem(JSONBlobClient.KEY, this.keysBlobId);
    return this.keysBlobId;
  };

  refreshKeysBlob = async () => {
    const logPrefix = `${this.constructor.name} -> refreshKeysBlob`;
    const keys = this.getKeysFromKeysBlob(this.keysBlobId) || this.keys;
    const keysBlobId = await JSONBlobClient.createBlob(keys);
    if (!keysBlobId) throw new Error(`${logPrefix}`);
    this.keysBlobId = keysBlobId;
    this.keys = keys;
    localStorage.setItem(JSONBlobClient.KEY, this.keysBlobId);
    return this.keysBlobId;
  };

  init = async (keysBlobId, { refreshIfExpired = false } = {}) => {
    // Returns this or throws JSONBlobExpired if keysBlobId is expired
    const logPrefix = `${this.constructor.name} -> init`;
    this.keysBlobId = keysBlobId; // Set this.keysBlobId
    localStorage.setItem(JSONBlobClient.KEY, this.keysBlobId);
    let expired = false;
    if (this.keysBlobId) {
      let keys = this.getKeysFromKeysBlob();
      if (keys) {
        this.keys = keys;
      } else {
        expired = true;
      }
    } else {
      this.keysBlobId = localStorage.getItem(JSONBlobClient.KEY);
      if (keysBlobId) {
        let keys = this.getKeysFromKeysBlob();
        if (keys) {
          this.keys = keys;
        } else {
          expired = true;
        }
      } else {
        // If no keysBlobId passed and no keysBlobId in localStorage - create new
        this.createKeysBlob();
      }
    }

    if (expired === true && refreshIfExpired == true) {
      this.refreshKeysBlob();
    } else {
      throw new JSONBlobExpired(`BlobId: ${this.keysBlobId} is expired`);
    }
    return this;
  };
}
