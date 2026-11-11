import fs from "node:fs/promises";
const filename = "client.config.json";
const config = JSON.parse(await fs.readFile(filename, "utf8"));
Object.assign(config.business, {
  name: "CI Demo Mobile Mechanic",
  legalName: "CI Demo Mobile Mechanic LLC",
  ownerName: "CI Owner",
  phone: "(555) 015-0101",
  email: "hello@ci-demo.example",
  domain: "ci-demo.example",
  www: true,
  city: "Test City",
  region: "Test Region",
  state: "Florida",
  stateCode: "FL",
  zip: "00000",
  address: "100 Test Street"
});
config.integrations.googleTagManagerId = "GTM-CI1234";
config.serviceAreas = [{name:"Test City",slug:"test-city",description:"Service availability is confirmed by the owner.",zipCodes:[]}];
await fs.writeFile(filename, JSON.stringify(config, null, 2) + "\n");
console.log("Prepared isolated CI-only example business; no secrets or production connection configured.");
