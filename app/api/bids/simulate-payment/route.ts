import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { bidId, simulateSuccess = true } = await request.json();

    if (!bidId) {
      return NextResponse.json({ success: false, error: 'Missing bidId' }, { status: 400 });
    }

    const bid = await db.bid.findUnique({
      where: { id: bidId },
      include: { spot: { include: { auction: true } } },
    });

    if (!bid) {
      return NextResponse.json({ success: false, error: 'Bid not found' }, { status: 404 });
    }

    if (!simulateSuccess) {
      await db.bid.update({
        where: { id: bidId },
        data: { status: 'CANCELLED' },
      });
      await db.payment.updateMany({
        where: { bidId },
        data: { status: 'FAILED' },
      });
      return NextResponse.json({ success: true, message: 'Payment marked as cancelled/failed.' });
    }

    // 1. Mark previous bids on this spot as OUTBID
    await db.bid.updateMany({
      where: {
        spotId: bid.spotId,
        id: { not: bid.id },
        status: 'CONFIRMED',
      },
      data: { status: 'OUTBID' },
    });

    // 2. Confirm current bid
    const simulatedPaymentId = `sim_pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await db.bid.update({
      where: { id: bid.id },
      data: {
        status: 'CONFIRMED',
        dodoPaymentId: simulatedPaymentId,
      },
    });

    // 3. Update payment record
    await db.payment.upsert({
      where: { bidId: bid.id },
      update: {
        status: 'SUCCEEDED',
        dodoPaymentId: simulatedPaymentId,
      },
      create: {
        bidId: bid.id,
        dodoSessionId: bid.dodoSessionId,
        dodoPaymentId: simulatedPaymentId,
        amount: bid.amount,
        currency: 'USD',
        status: 'SUCCEEDED',
      },
    });

    // 4. Update spot details
    await db.spot.update({
      where: { id: bid.spotId },
      data: {
        currentBid: bid.amount,
        currentBidderName: bid.bidderName,
        currentBidderEmail: bid.bidderEmail,
        currentBrandName: bid.brandName,
        currentLogoUrl: bid.logoUrl,
        currentWebsite: bid.website,
        status: 'OCCUPIED',
        bidCount: { increment: 1 },
      },
    });

    // 5. Update auction total raised
    const allSpots = await db.spot.findMany({
      where: { auctionId: bid.spot.auctionId },
    });
    const newTotalRaised = allSpots.reduce((sum, s) => sum + (s.currentBid > 0 ? s.currentBid : 0), 0);

    await db.auction.update({
      where: { id: bid.spot.auctionId },
      data: { totalRaised: newTotalRaised },
    });

    return NextResponse.json({
      success: true,
      spotNumber: bid.spot.number,
      amount: bid.amount,
      brandName: bid.brandName,
      message: `Payment confirmed! Spot #${bid.spot.number} is now held by ${bid.brandName}.`,
    });
  } catch (error: any) {
    console.error('Error simulating payment:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
