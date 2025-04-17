//
class JSONBlobClient {
  // Blob is removed after 30 days of inactivity
  static KEY = JSONBlobClient.name;
  // not presiece
  static CONTENT_LENGTH_LIMIT = 1500503; // response.headers.get("Content-Length")

  constructor(keysBlobId) {
    this.keysBlobId = keysBlobId;
    this.apiUrl = "https://jsonblob.com/api/jsonBlob";
    this.keys = {};
  }

  // Create a new JSON blob
  _create = async (data) => {
    const logPrefix = `${this.constructor.name} -> _create`;
    try {
      const response = await fetch(this.apiUrl, {
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
      console.error(error);
      // throw error;
    }
  };

  _update = async (blobId, data) => {
    const logPrefix = `${this.constructor.name} -> _update`;
    try {
      const response = await fetch(`${this.apiUrl}/${blobId}`, {
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
        console.error(`${logPrefix} : ${response.status}`);
        return;
      }

      return true;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  // Get the content of a JSON blob
  _get = async (blobId) => {
    const logPrefix = `${this.constructor.name} -> _get`;
    try {
      const response = await fetch(`${this.apiUrl}/${blobId}`);

      if (!response.ok) {
        console.error(`${logPrefix} : ${response.status}`);
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
      console.error(error);
      // throw error;
    }
  };

  init = async () => {
    const logPrefix = `${this.constructor.name} -> init`;
    this.keysBlobId = this.keysBlobId || localStorage.getItem(JSONBlobClient.KEY);
    if (this.keysBlobId) {
      this.keys = (await this._get(this.keysBlobId)) || {};
    } else {
      this.keysBlobId = await this._create({});
      if (!this.keysBlobId) throw new Error(`${logPrefix}`);
      localStorage.setItem(JSONBlobClient.KEY, this.keysBlobId);
    }
  };

  set = async (key, value) => {
    let blobId = this.keys[key];
    if (blobId) {
      return await this._update(blobId, value);
    } else {
      blobId = await this._create(value);
      if (blobId) {
        this.keys[key] = blobId;
        return await this._update(localStorage.getItem(JSONBlobClient.KEY), this.keys);
      }
    }
  };

  get = async (key) => {
    const logPrefix = `${this.constructor.name} -> get`;
    let blobId = this.keys[key];

    if (!blobId) return null;

    return await this._get(blobId);
  };
}
