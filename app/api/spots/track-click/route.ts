import { NextRequest, NextResponse } from 'next/server';
import { db, ensureDatabase } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    await ensureDatabase();
    const body = await request.json();
    const { spotId, spotNumber } = body;

    if (!spotId && !spotNumber) {
      return NextResponse.json({ success: false, error: 'Missing spotId or spotNumber' }, { status: 400 });
    }

    const where = spotId ? { id: spotId } : { number: parseInt(spotNumber, 10) };

    const updated = await db.spot.update({
      where,
      data: {
        clicksCount: {
          increment: 1,
        },
      },
      select: {
        id: true,
        number: true,
        clicksCount: true,
        currentBrandName: true,
        currentWebsite: true,
      },
    });

    return NextResponse.json({
      success: true,
      spotId: updated.id,
      clicksCount: updated.clicksCount,
      website: updated.currentWebsite,
    });
  } catch (error) {
    console.error('Error tracking spot click:', error);
    return NextResponse.json({ success: false, error: 'Failed to record click' }, { status: 500 });
  }
}
