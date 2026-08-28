import { NextResponse } from 'next/server';
import { recordPageView } from '@/lib/presence';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const views = await recordPageView();
    return NextResponse.json({ success: true, views });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
