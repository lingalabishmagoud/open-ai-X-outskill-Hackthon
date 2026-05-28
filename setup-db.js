const { Client, Databases } = require('node-appwrite');

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('6a15e01e003b014edc62')
  .setKey('standard_8dd00cf9c7ed0486896bbe5cfd829564d5754228084ef851fe88823b459b4190da513dc160f216ce49eb7edd5eb7ed099a12decc6092e7ec267ae427470b3d3e93fee5073c06efc904aa21e73c393a6d3cb48c60d997730b4614817bd74210a7a809b9bf5f5bd0cc9652f6275417d666e923bb42ae312066ba6e4e51621902d3');

const db = new Databases(client);
const DB_ID = 'main_store';

async function createCollection(id, name) {
  try {
    const col = await db.createCollection(DB_ID, id, name);
    console.log(`Created collection: ${name} (${id})`);
    return col;
  } catch (err) {
    if (err.code === 409) {
      console.log(`Collection ${name} (${id}) already exists.`);
    } else {
      console.error(`Error creating ${name}:`, err.message);
    }
  }
}

async function setup() {
  try {
    console.log("Setting up new collections...");

    // 1. Cities
    await createCollection('cities', 'Cities');
    try {
      await db.createStringAttribute(DB_ID, 'cities', 'name', 100, true);
    } catch(e) { if(e.code !== 409) console.log(e.message); }

    // 2. Apartments
    await createCollection('apartments', 'Apartments');
    try {
      await db.createStringAttribute(DB_ID, 'apartments', 'cityId', 50, true);
      await db.createStringAttribute(DB_ID, 'apartments', 'name', 200, true);
      await db.createStringAttribute(DB_ID, 'apartments', 'imageUrl', 1000, false);
      await db.createStringAttribute(DB_ID, 'apartments', 'mapsUrl', 1000, false);
    } catch(e) { if(e.code !== 409) console.log(e.message); }

    // 3. Banners
    await createCollection('banners', 'Banners');
    try {
      await db.createStringAttribute(DB_ID, 'banners', 'imageUrl', 1000, true);
      await db.createStringAttribute(DB_ID, 'banners', 'title', 200, true);
      await db.createStringAttribute(DB_ID, 'banners', 'targetCityId', 50, true);
      await db.createStringAttribute(DB_ID, 'banners', 'targetApartmentId', 50, true);
      await db.createBooleanAttribute(DB_ID, 'banners', 'active', true, true);
    } catch(e) { if(e.code !== 409) console.log(e.message); }

    // 4. Intakes (Vendor Barcode Scans)
    await createCollection('intakes', 'Intakes');
    try {
      await db.createStringAttribute(DB_ID, 'intakes', 'barcode', 100, true);
      await db.createStringAttribute(DB_ID, 'intakes', 'productName', 200, true);
      await db.createIntegerAttribute(DB_ID, 'intakes', 'quantity', true);
      await db.createStringAttribute(DB_ID, 'intakes', 'status', 50, true); // 'pending' | 'approved'
    } catch(e) { if(e.code !== 409) console.log(e.message); }

    console.log("Database setup commands sent. Please allow a few moments for attributes to initialize on Appwrite.");
  } catch (err) {
    console.error("Setup failed:", err);
  }
}

setup();
