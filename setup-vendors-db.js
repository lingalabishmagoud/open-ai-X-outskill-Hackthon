const { Client, Databases } = require('node-appwrite');

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('6a15e01e003b014edc62')
  .setKey('standard_8dd00cf9c7ed0486896bbe5cfd829564d5754228084ef851fe88823b459b4190da513dc160f216ce49eb7edd5eb7ed099a12decc6092e7ec267ae427470b3d3e93fee5073c06efc904aa21e73c393a6d3cb48c60d997730b4614817bd74210a7a809b9bf5f5bd0cc9652f6275417d666e923bb42ae312066ba6e4e51621902d3');

const db = new Databases(client);
const DB_ID = 'main_store';

async function setup() {
  try {
    console.log("Setting up Vendors collection...");
    try {
      await db.createCollection(DB_ID, 'vendors', 'Vendors');
      console.log("Created collection: Vendors");
    } catch(e) { if(e.code !== 409) console.log(e.message); }

    try {
      await db.createStringAttribute(DB_ID, 'vendors', 'name', 200, true);
      await db.createStringAttribute(DB_ID, 'vendors', 'phone', 20, true);
      await db.createStringAttribute(DB_ID, 'vendors', 'cityId', 100, true);
      await db.createStringAttribute(DB_ID, 'vendors', 'mapsUrl', 1000, true);
      await db.createStringAttribute(DB_ID, 'vendors', 'pin', 10, true);
    } catch(e) { if(e.code !== 409) console.log(e.message); }

    console.log("Updating Products collection with vendorId...");
    try {
      await db.createStringAttribute(DB_ID, 'products', 'vendorId', 100, false);
    } catch(e) { if(e.code !== 409) console.log(e.message); }
    
    console.log("Updating Intakes collection with vendorId...");
    try {
      await db.createStringAttribute(DB_ID, 'intakes', 'vendorId', 100, false);
    } catch(e) { if(e.code !== 409) console.log(e.message); }

    console.log("Database update commands sent.");
  } catch (err) {
    console.error("Setup failed:", err);
  }
}

setup();
