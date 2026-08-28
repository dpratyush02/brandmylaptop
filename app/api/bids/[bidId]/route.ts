import { NextRequest, NextResponse } from 'next/server';
import { db, ensureDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  context: { params: { bidId: string } | Promise<{ bidId: string }> }
) {
  try {
    await ensureDatabase();
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

    let currentBid = bid;

    // If still pending, check directly with Dodo API as backup to webhook
    if (currentBid.status === 'PENDING' && currentBid.dodoSessionId) {
      try {
        const { getDodoClient } = await import('@/lib/dodo');
        const client = getDodoClient();
        if (client) {
          const payments = await client.payments.list({ page_size: 10 });
          for (const pay of payments.getPaginatedItems()) {
            const match = pay.metadata?.bid_id === currentBid.id || pay.metadata?.bidId === currentBid.id || pay.metadata?.session_id === currentBid.dodoSessionId;
            if (match && (pay.status === 'succeeded' || pay.status === 'successful')) {
              // 1. Mark previous bids on this spot as OUTBID
              await db.bid.updateMany({
                where: {
                  spotId: currentBid.spotId,
                  id: { not: currentBid.id },
                  status: 'CONFIRMED',
                },
                data: { status: 'OUTBID' },
              });

              // 2. Confirm current bid
              currentBid = await db.bid.update({
                where: { id: currentBid.id },
                data: {
                  status: 'CONFIRMED',
                  dodoPaymentId: pay.payment_id,
                },
                include: { spot: { include: { auction: true } }, payment: true },
              });

              // 3. Update spot
              await db.spot.update({
                where: { id: currentBid.spotId },
                data: {
                  currentBid: currentBid.amount,
                  currentBidderName: currentBid.bidderName,
                  currentBidderEmail: currentBid.bidderEmail,
                  currentBrandName: currentBid.brandName,
                  currentLogoUrl: currentBid.logoUrl,
                  currentWebsite: currentBid.website,
                  status: 'OCCUPIED',
                  bidCount: { increment: 1 },
                },
              });

              // 4. Update auction & activate 72h timer if 1st bid
              const allSpots = await db.spot.findMany({
                where: { auctionId: currentBid.spot.auctionId },
              });
              const newTotalRaised = allSpots.reduce((sum, s) => sum + (s.currentBid > 0 ? s.currentBid : 0), 0);

              const auctionUpdates: {
                totalRaised: number;
                status?: string;
                startTime?: Date;
                endTime?: Date;
              } = {
                totalRaised: newTotalRaised,
              };

              if (currentBid.spot.auction.status === 'PENDING_FIRST_BID' || !currentBid.spot.auction.startTime) {
                const now = new Date();
                auctionUpdates.status = 'ACTIVE';
                auctionUpdates.startTime = now;
                auctionUpdates.endTime = new Date(now.getTime() + 72 * 60 * 60 * 1000);
              }

              await db.auction.update({
                where: { id: currentBid.spot.auctionId },
                data: auctionUpdates,
              });

              break;
            }
          }
        }
      } catch (err) {
        console.warn('[Dodo Direct Check]:', err);
      }
    }

    return NextResponse.json({
      success: true,
      bid: {
        id: currentBid.id,
        status: currentBid.status,
        amount: currentBid.amount,
        brandName: currentBid.brandName,
        bidderName: currentBid.bidderName,
        spotNumber: currentBid.spot.number,
        position: currentBid.spot.position,
        paymentStatus: currentBid.payment?.status || 'PENDING',
        currency: currentBid.payment?.currency || 'USD',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load bid';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
