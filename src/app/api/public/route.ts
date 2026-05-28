import { adminDB, DB_ID, CITIES_COL, APARTMENTS_COL, BANNERS_COL } from '@/lib/appwrite-admin';
import { NextRequest, NextResponse } from 'next/server';
import { Query } from 'node-appwrite';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const resource = searchParams.get('resource');

  try {
    if (resource === 'cities') {
      const res = await adminDB.listDocuments(DB_ID, CITIES_COL, [Query.limit(100)]);
      return NextResponse.json(res);
    }
    
    if (resource === 'apartments') {
      const cityId = searchParams.get('cityId');
      const queries = [Query.limit(200)];
      if (cityId) queries.push(Query.equal('cityId', cityId));
      
      const res = await adminDB.listDocuments(DB_ID, APARTMENTS_COL, queries);
      return NextResponse.json(res);
    }

    if (resource === 'banners') {
      const res = await adminDB.listDocuments(DB_ID, BANNERS_COL, [Query.limit(50)]);
      return NextResponse.json(res);
    }

    if (resource === 'vendors') {
      const res = await adminDB.listDocuments(DB_ID, 'vendors', [Query.limit(100)]);
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: 'Unknown resource' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
