import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createCheckoutSession } from '@/lib/dodo';
import { formatMoney, minNextBid } from '@/lib/currency';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      spotId,
      spotNumber,
      bidAmount,
      name,
      email,
      companyName,
      website = '',
      logoUrl = '',
    } = body;

    if (!spotId || !spotNumber || !bidAmount || !name || !email || !companyName) {
      return NextResponse.json(
        { success: false, error: 'Missing required bid details (Spot, Amount, Name, Email, Brand Name)' },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(bidAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid bid amount entered.' },
        { status: 400 }
      );
    }

    const spot = await db.spot.findUnique({
      where: { id: spotId },
      include: { auction: true },
    });

    if (!spot) {
      return NextResponse.json(
        { success: false, error: `Spot #${spotNumber} not found.` },
        { status: 404 }
      );
    }

    if (spot.auction.status !== 'ACTIVE' || new Date(spot.auction.endTime).getTime() <= Date.now()) {
      return NextResponse.json(
        { success: false, error: 'This auction has ended. No further bids are accepted.' },
        { status: 400 }
      );
    }

    const minRequiredBid = minNextBid(spot);

    if (parsedAmount + 0.01 < minRequiredBid) {
      return NextResponse.json(
        {
          success: false,
          error: `Bid must be at least ${formatMoney(minRequiredBid)}. Current highest is ${formatMoney(spot.currentBid)}.`,
        },
        { status: 400 }
      );
    }

    const pendingBid = await db.bid.create({
      data: {
        spotId: spot.id,
        bidderName: name,
        bidderEmail: email,
        brandName: companyName,
        website: website || null,
        logoUrl: logoUrl || null,
        amount: parsedAmount,
        status: 'PENDING',
      },
    });

    const checkoutResult = await createCheckoutSession({
      spotId: spot.id,
      spotNumber: spot.number,
      bidId: pendingBid.id,
      bidAmount: parsedAmount,
      chargeAmount: parsedAmount,
      currency: 'USD',
      bidderName: name,
      bidderEmail: email,
      brandName: companyName,
      website,
      logoUrl,
    });

    await db.bid.update({
      where: { id: pendingBid.id },
      data: { dodoSessionId: checkoutResult.sessionId },
    });

    await db.payment.create({
      data: {
        bidId: pendingBid.id,
        dodoSessionId: checkoutResult.sessionId,
        amount: parsedAmount,
        currency: 'USD',
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutResult.checkoutUrl,
      sessionId: checkoutResult.sessionId,
      bidId: pendingBid.id,
      isSimulator: checkoutResult.isSimulator,
    });
  } catch (error: unknown) {
    console.error('Error creating bid checkout:', error);
    const message = error instanceof Error ? error.message : 'Internal server error processing bid.';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
