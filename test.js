const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const jsonBlob = await JSONBlobClient.simple();

let i = 0;
while (true) {
  console.log(i);
  i++;
  await jsonBlob.set("zebra", { hello: "world" });
  data = await jsonBlob.get("zebra");
  console.log(data);
  await sleep(100);
}
