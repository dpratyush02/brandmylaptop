import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  context: { params: { bidId: string } | Promise<{ bidId: string }> }
) {
  try {
    const { bidId } = await context.params;
    if (!bidId) {
      return NextResponse.json({ success: false, error: 'Missing bid id' }, { status: 400 });
    }

    const bid = await db.bid.findUnique({
      where: { id: bidId },
      include: {
        spot: true,
        payment: true,
      },
    });

    if (!bid) {
      return NextResponse.json({ success: false, error: 'Bid not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      bid: {
        id: bid.id,
        status: bid.status,
        amount: bid.amount,
        brandName: bid.brandName,
        bidderName: bid.bidderName,
        spotNumber: bid.spot.number,
        position: bid.spot.position,
        paymentStatus: bid.payment?.status || 'PENDING',
        currency: bid.payment?.currency || 'USD',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load bid';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
