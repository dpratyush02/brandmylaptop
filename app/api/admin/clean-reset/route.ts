import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { INITIAL_SPOTS_CATALOG } from '@/lib/db';

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

  try {
    // 1. Delete all existing test bids, payments, winners, and installations
    await db.payment.deleteMany({});
    await db.winner.deleteMany({});
    await db.stickerInstallation.deleteMany({});
    await db.bid.deleteMany({});
    await db.spot.deleteMany({});
    await db.auction.deleteMany({});

    // 2. Create clean launch auction
    const auction = await db.auction.create({
      data: {
        title: 'BrandMyLaptop Launch Auction',
        status: 'PENDING_FIRST_BID',
        totalRaised: 0,
        endTime: new Date(Date.now() + 72 * 60 * 60 * 1000),
      },
    });

    // 3. Create all 10 spots with fresh pricing (Spot #1 = $5, Spot #2 = $10, etc.)
    for (const s of INITIAL_SPOTS_CATALOG) {
      await db.spot.create({
        data: {
          auctionId: auction.id,
          number: s.number,
          position: s.position,
          size: s.size,
          dimensions: s.dimensions,
          startingPrice: s.startingPrice,
          currentBid: 0,
          minBidIncrement: s.minBidIncrement || 1,
          currentBidderName: null,
          currentBidderEmail: null,
          currentBrandName: null,
          currentLogoUrl: null,
          currentWebsite: null,
          status: 'AVAILABLE',
          bidCount: 0,
          clicksCount: 0,
          stickerStatus: 'PENDING',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Clean launch slate successfully created! All test bids wiped, Spot #1 set to $5.',
      spotsCount: 10,
    });
  } catch (error: any) {
    console.error('Clean reset error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
