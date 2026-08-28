import { NextRequest, NextResponse } from 'next/server';
import { db, ensureDatabase } from '@/lib/db';
import { verifyWebhookSignature } from '@/lib/dodo';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await ensureDatabase();
    const rawBody = await request.text();
    const headersList: Record<string, string | string[] | undefined> = {};
    
    request.headers.forEach((value, key) => {
      headersList[key.toLowerCase()] = value;
    });

    // 1. Verify webhook signature
    const isValid = await verifyWebhookSignature(rawBody, headersList);
    if (!isValid) {
      console.error('[Webhook Error] Invalid signature on Dodo webhook payload');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Malformed JSON' }, { status: 400 });
    }

    const eventType = payload.type || payload.event || '';
    console.log(`[Dodo Webhook Received] Event: ${eventType}`);

    // Handle payment.succeeded event
    if (eventType === 'payment.succeeded' || eventType === 'checkout.session.completed') {
      const paymentData = payload.data || payload;
      const metadata = paymentData.metadata || {};
      const bidId = metadata.bid_id || metadata.bidId;
      const dodoPaymentId = paymentData.payment_id || paymentData.id || `pay_${Date.now()}`;

      if (!bidId) {
        console.warn('[Webhook] No bid_id in metadata, attempting session lookup');
        const sessionId = paymentData.session_id || paymentData.checkout_session_id;
        if (!sessionId) {
          return NextResponse.json({ received: true, note: 'No bid identifier found' });
        }
      }

      // Look up the pending bid
      const bid = await db.bid.findFirst({
        where: bidId ? { id: bidId } : { dodoSessionId: paymentData.session_id },
        include: { spot: { include: { auction: true } } },
      });

      if (!bid) {
        console.error(`[Webhook] Bid not found for ID: ${bidId}`);
        return NextResponse.json({ error: 'Bid not found' }, { status: 404 });
      }

      // Check idempotency: If already confirmed, return 200
      if (bid.status === 'CONFIRMED' || bid.status === 'WON') {
        return NextResponse.json({ received: true, message: 'Bid already confirmed' });
      }

      // Update payment record
      await db.payment.upsert({
        where: { bidId: bid.id },
        update: {
          status: 'SUCCEEDED',
          dodoPaymentId,
          metadata: JSON.stringify(payload),
        },
        create: {
          bidId: bid.id,
          dodoSessionId: bid.dodoSessionId,
          dodoPaymentId,
          amount: bid.amount,
          currency: (payload.data?.currency || payload.currency || 'USD') as string,
          status: 'SUCCEEDED',
          metadata: JSON.stringify(payload),
        },
      });

      // Update previously active confirmed bids on this spot to OUTBID
      await db.bid.updateMany({
        where: {
          spotId: bid.spotId,
          id: { not: bid.id },
          status: 'CONFIRMED',
        },
        data: { status: 'OUTBID' },
      });

      // Activate new bid as CONFIRMED highest bidder
      await db.bid.update({
        where: { id: bid.id },
        data: {
          status: 'CONFIRMED',
          dodoPaymentId,
        },
      });

      // Update the spot with the new winning highest bidder logo & brand details
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

      // Recalculate and update total raised across all spots
      const allSpots = await db.spot.findMany({
        where: { auctionId: bid.spot.auctionId },
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

      // Start the 72-hour countdown on the very first confirmed bid
      if (bid.spot.auction.status === 'PENDING_FIRST_BID' || !bid.spot.auction.startTime) {
        const now = new Date();
        auctionUpdates.status = 'ACTIVE';
        auctionUpdates.startTime = now;
        auctionUpdates.endTime = new Date(now.getTime() + 72 * 60 * 60 * 1000);
      }

      await db.auction.update({
        where: { id: bid.spot.auctionId },
        data: auctionUpdates,
      });

      console.log(`[Bid Activated] Spot #${bid.spot.number} is now held by ${bid.brandName} at $${bid.amount}`);
    }

    return NextResponse.json({ received: true, success: true });
  } catch (error: any) {
    console.error('[Webhook Processing Error]:', error);
    return NextResponse.json({ error: error.message || 'Webhook processing failed' }, { status: 500 });
  }
}
