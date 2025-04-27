const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

localStorage.removeItem(JSONBlobStorage.DEFAULT_LOCAL_STORAGE_KEY);

const jsonBlobStorage = await JSONBlobStorage.buildClient();

let i = 0;
while (true) {
  console.log(i);
  isNewKey = await jsonBlobStorage.set("zebra", { hello: "world" });
  console.log("isNewKey", isNewKey);
  data = await jsonBlobStorage.get("zebra");
  console.log(data);
  await sleep(1 * 1000);
  i++;
}
