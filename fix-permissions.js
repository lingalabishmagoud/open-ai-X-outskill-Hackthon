const sdk = require('node-appwrite');

const client = new sdk.Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('6a15e01e003b014edc62')
  .setKey('standard_8dd00cf9c7ed0486896bbe5cfd829564d5754228084ef851fe88823b459b4190da513dc160f216ce49eb7edd5eb7ed099a12decc6092e7ec267ae427470b3d3e93fee5073c06efc904aa21e73c393a6d3cb48c60d997730b4614817bd74210a7a809b9bf5f5bd0cc9652f6275417d666e923bb42ae312066ba6e4e51621902d3');

const databases = new sdk.Databases(client);
const DB_ID = 'main_store';

async function fixPermissions() {
  try {
    console.log('Fixing Products collection permissions...');
    // Products: any logged-in user can READ, only server (admin) can write
    await databases.updateCollection(
      DB_ID,
      'products',
      'Products',
      [
        sdk.Permission.read(sdk.Role.users()),   // any logged-in user can read
        sdk.Permission.read(sdk.Role.any()),     // even guests can read (for browsing)
      ]
    );
    console.log('✅ Products collection: read = anyone');

    console.log('Fixing Orders collection permissions...');
    // Orders: logged-in user can create + read their own orders
    await databases.updateCollection(
      DB_ID,
      'orders',
      'Orders',
      [
        sdk.Permission.create(sdk.Role.users()),     // any logged-in user can create an order
        sdk.Permission.read(sdk.Role.users()),       // any logged-in user can read orders
        sdk.Permission.update(sdk.Role.users()),     // for status updates
      ]
    );
    console.log('✅ Orders collection: create/read/update = logged-in users');

    console.log('\nAll permissions fixed!');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

fixPermissions();
