const { Client, Databases } = require('node-appwrite');

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('6a15e01e003b014edc62')
  .setKey('standard_8dd00cf9c7ed0486896bbe5cfd829564d5754228084ef851fe88823b459b4190da513dc160f216ce49eb7edd5eb7ed099a12decc6092e7ec267ae427470b3d3e93fee5073c06efc904aa21e73c393a6d3cb48c60d997730b4614817bd74210a7a809b9bf5f5bd0cc9652f6275417d666e923bb42ae312066ba6e4e51621902d3');

const db = new Databases(client);
const DB_ID = 'main_store';

async function setup() {
  try {
    console.log("Creating master_catalog...");
    try {
      await db.createCollection(DB_ID, 'master_catalog', 'Master Catalog');
      await db.createStringAttribute(DB_ID, 'master_catalog', 'barcode', 100, true);
      await db.createStringAttribute(DB_ID, 'master_catalog', 'name', 255, true);
      await db.createStringAttribute(DB_ID, 'master_catalog', 'category', 100, false);
      await db.createFloatAttribute(DB_ID, 'master_catalog', 'mrp', false);
      await db.createFloatAttribute(DB_ID, 'master_catalog', 'wholesale_price', false);
      await db.createStringAttribute(DB_ID, 'master_catalog', 'image_url', 1000, false);
      console.log("master_catalog created.");
    } catch(e) { if(e.code !== 409) console.log(e.message); }
  } catch (err) {
    console.error("Setup failed:", err);
  }
}

setup();
