// Creates the index needed to query orders by user_id
const sdk = require('node-appwrite');

const client = new sdk.Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('6a15e01e003b014edc62')
  .setKey('standard_8dd00cf9c7ed0486896bbe5cfd829564d5754228084ef851fe88823b459b4190da513dc160f216ce49eb7edd5eb7ed099a12decc6092e7ec267ae427470b3d3e93fee5073c06efc904aa21e73c393a6d3cb48c60d997730b4614817bd74210a7a809b9bf5f5bd0cc9652f6275417d666e923bb42ae312066ba6e4e51621902d3');

const databases = new sdk.Databases(client);

async function createIndex() {
  try {
    await databases.createIndex('main_store', 'orders', 'user_id_idx', 'key', ['user_id']);
    console.log('✅ Index created on orders.user_id');
  } catch (e) {
    console.log('Index may already exist:', e.message);
  }
}

createIndex();
