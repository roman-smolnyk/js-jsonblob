const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

jsonBlob = new JSONBlobClient();

await jsonBlob.init();
let i = 0;
while (true) {
  console.log(i);
  i++;
  success = await jsonBlob.set("zebra", { hello: "world" });
  data = await jsonBlob.get("zebra");
  console.log(data);
  await sleep(100);
}
