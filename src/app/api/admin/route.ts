import { adminDB, adminUsers, DB_ID, ORDERS_COL, PRODUCTS_COL } from '@/lib/appwrite-admin';
import { NextRequest, NextResponse } from 'next/server';
import { Query, ID } from 'node-appwrite';

const ADMIN_SECRET = process.env.ADMIN_SECRET;

function checkAuth(req: NextRequest) {
  const auth = req.headers.get('x-admin-secret');
  return auth === ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const resource = searchParams.get('resource');

  try {
    if (resource === 'orders') {
      const res = await adminDB.listDocuments(DB_ID, ORDERS_COL, [Query.orderDesc('$createdAt'), Query.limit(200)]);
      return NextResponse.json(res);
    }

    if (resource === 'users') {
      const res = await adminUsers.list([Query.limit(100)]);
      return NextResponse.json(res);
    }

    if (resource === 'products') {
      const res = await adminDB.listDocuments(DB_ID, PRODUCTS_COL, [Query.limit(200)]);
      return NextResponse.json(res);
    }

    if (resource === 'intakes') {
      const res = await adminDB.listDocuments(DB_ID, 'intakes', [Query.orderDesc('$createdAt'), Query.limit(200)]);
      return NextResponse.json(res);
    }

    if (['cities', 'apartments', 'banners', 'vendors', 'master_catalog'].includes(resource || '')) {
      const res = await adminDB.listDocuments(DB_ID, resource as string, [Query.limit(200)]);
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: 'Unknown resource' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { action, resource, id, data } = body;

  try {
    // Add product
    if (action === 'create' && resource === 'product') {
      const doc = await adminDB.createDocument(DB_ID, PRODUCTS_COL, ID.unique(), data);
      return NextResponse.json(doc);
    }

    // Delete product
    if (action === 'delete' && resource === 'product') {
      await adminDB.deleteDocument(DB_ID, PRODUCTS_COL, id);
      return NextResponse.json({ success: true });
    }

    // Update product
    if (action === 'update' && resource === 'product') {
      const doc = await adminDB.updateDocument(DB_ID, PRODUCTS_COL, id, data);
      return NextResponse.json(doc);
    }

    // Update order status
    if (action === 'update' && resource === 'order') {
      const doc = await adminDB.updateDocument(DB_ID, ORDERS_COL, id, data);
      return NextResponse.json(doc);
    }

    // Generic create for new collections
    if (action === 'create' && ['cities', 'apartments', 'banners', 'intakes', 'vendors', 'master_catalog'].includes(resource)) {
      const doc = await adminDB.createDocument(DB_ID, resource, ID.unique(), data);
      return NextResponse.json(doc);
    }

    // Generic update for new collections
    if (action === 'update' && ['cities', 'apartments', 'banners', 'intakes', 'vendors', 'master_catalog'].includes(resource)) {
      const doc = await adminDB.updateDocument(DB_ID, resource, id, data);
      return NextResponse.json(doc);
    }

    // Generic delete for new collections
    if (action === 'delete' && ['cities', 'apartments', 'banners', 'intakes', 'vendors', 'master_catalog'].includes(resource)) {
      await adminDB.deleteDocument(DB_ID, resource, id);
      return NextResponse.json({ success: true });
    }

    // Delete user
    if (action === 'delete' && resource === 'user') {
      await adminUsers.delete(id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
