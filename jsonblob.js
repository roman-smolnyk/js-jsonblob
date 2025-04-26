//

class JSONBlobExpired extends Error {}

class JSONBlobKeyIsMissing extends Error {}

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
    if (!data) {
      data = {};
    }
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
        return false;
      }

      return true;
    } catch (error) {
      console.warn(error);
      return false;
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

  static isBlobExpired = async (blobId) => {
    return (await JSONBlobClient.getBlob(blobId)) ? false : true;
  };

  set = async (key, value) => {
    // TODO Check if expired and also return status
    let blobId = this.keys[key];
    if (!blobId) {
      blobId = await JSONBlobClient.createBlob(value);
      this.keys[key] = blobId;
      // Update keys
      await JSONBlobClient.updateBlob(this.keysBlobId, this.keys);
    } else {
      const success = await JSONBlobClient.updateBlob(blobId, value);
      if (!success) {
        blobId = await JSONBlobClient.createBlob(value);
        this.keys[key] = blobId;
        // Update keys
        await JSONBlobClient.updateBlob(this.keysBlobId, this.keys);
      }
    }
  };

  get = async (key) => {
    const logPrefix = `${this.constructor.name} -> get`;
    let blobId = this.keys[key];

    if (!blobId) throw new JSONBlobKeyIsMissing(`Key: '${key}' is missing`);

    return await JSONBlobClient.getBlob(blobId);
  };

  init = async (keysBlobId) => {
    // Returns this or throws JSONBlobExpired if keysBlobId is expired
    const logPrefix = `${this.constructor.name} -> init`;
    if (!keysBlobId) throw new Error(`${logPrefix} -> missing keysBlobId`);
    const keys = await JSONBlobClient.getBlob(keysBlobId);
    if (!keys) {
      throw new JSONBlobExpired(`BlobId: ${keysBlobId} is expired`);
    }

    this.keys = keys;
    this.keysBlobId = keysBlobId;
  };

  static buildClient = async (localStorageKey = JSONBlobClient.name) => {
    let keysBlobId = localStorage.getItem(localStorageKey) || (await JSONBlobClient.createBlob());
    if (await JSONBlobClient.isBlobExpired(keysBlobId)) {
      keysBlobId = await JSONBlobClient.createBlob();
    }
    localStorage.setItem(localStorageKey, keysBlobId);
    const jsonBlob = new JSONBlobClient();
    await jsonBlob.init(keysBlobId);
    return jsonBlob;
  };
}
