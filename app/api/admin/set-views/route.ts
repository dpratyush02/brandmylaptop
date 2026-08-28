import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin_brandmylaptop_2026';

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  const searchParams = request.nextUrl.searchParams;
  const key = searchParams.get('key');
  return token === ADMIN_PASSWORD || key === ADMIN_PASSWORD;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized. Admin key required.' }, { status: 401 });
  }

  const countParam = request.nextUrl.searchParams.get('count');
  const count = countParam ? parseInt(countParam, 10) : 210;

  if (isNaN(count) || count < 0) {
    return NextResponse.json({ error: 'Invalid count parameter' }, { status: 400 });
  }

  try {
    const config = await db.adminConfig.upsert({
      where: { id: 'default_config' },
      update: { pageViews: count },
      create: { id: 'default_config', pageViews: count },
    });

    return NextResponse.json({
      success: true,
      message: `Total views updated to ${config.pageViews}`,
      pageViews: config.pageViews,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
