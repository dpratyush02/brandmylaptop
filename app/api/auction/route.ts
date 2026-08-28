import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { INITIAL_SPOTS } from '@/lib/demo-data';
import { recordPageView, getRealMetrics } from '@/lib/presence';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let auction = await db.auction.findFirst({
      include: {
        spots: {
          orderBy: { number: 'asc' },
          include: {
            bids: {
              where: { status: { in: ['CONFIRMED', 'OUTBID', 'WON'] } },
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
            winners: true,
            installations: true,
          },
        },
      },
    });

    // Auto-bootstrap if database is empty
    if (!auction) {
      const startTime = new Date();
      const endTime = new Date(Date.now() + 72 * 60 * 60 * 1000);

      auction = await db.auction.create({
        data: {
          title: 'BrandMyLaptop Launch Auction',
          status: 'ACTIVE',
          startTime,
          endTime,
          totalRaised: 0,
        },
        include: {
          spots: {
            orderBy: { number: 'asc' },
            include: {
              bids: { orderBy: { createdAt: 'desc' }, take: 10 },
              winners: true,
              installations: true,
            },
          },
        },
      });

      for (const s of INITIAL_SPOTS) {
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

      auction = await db.auction.findFirst({
        include: {
          spots: {
            orderBy: { number: 'asc' },
            include: {
              bids: {
                where: { status: { in: ['CONFIRMED', 'OUTBID', 'WON'] } },
                orderBy: { createdAt: 'desc' },
                take: 10,
              },
              winners: true,
              installations: true,
            },
          },
        },
      });
    }

    // Auto-expire check
    if (auction && auction.status === 'ACTIVE' && new Date(auction.endTime).getTime() <= Date.now()) {
      await db.auction.update({
        where: { id: auction.id },
        data: { status: 'CLOSED' },
      });
      auction.status = 'CLOSED';
    }

    // Calculate aggregated live sales and visitor metrics
    const spots = auction?.spots || [];
    const totalSales = spots.reduce((sum, s) => sum + (s.currentBid > 0 ? s.currentBid : 0), 0);
    const occupiedCount = spots.filter((s) => s.currentBid > 0).length;
    const totalClicks = spots.reduce((sum, s) => sum + ((s as any).clicksCount || 0), 0);
    const totalBidsCount = spots.reduce((sum, s) => sum + (s.bidCount || 0), 0);
    const highestBidSpot = [...spots].sort((a, b) => b.currentBid - a.currentBid)[0];

    // Fetch recent bids across all spots
    const recentBids = await db.bid.findMany({
      where: { status: { in: ['CONFIRMED', 'WON', 'OUTBID'] } },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        spot: {
          select: { number: true, position: true },
        },
      },
    });

    // Track real visit and get live metrics
    recordPageView();
    const { liveVisitors, totalViews } = getRealMetrics();

    return NextResponse.json({
      success: true,
      auction,
      stats: {
        totalSales,
        occupiedCount,
        totalSpots: 10,
        totalClicks,
        totalBidsCount,
        liveVisitors,
        totalViews,
        highestBid: highestBidSpot ? {
          amount: highestBidSpot.currentBid,
          brandName: highestBidSpot.currentBrandName,
          spotNumber: highestBidSpot.number,
        } : null,
        recentBids: recentBids.map((b) => ({
          id: b.id,
          brandName: b.brandName,
          amount: b.amount,
          spotNumber: b.spot.number,
          position: b.spot.position,
          createdAt: b.createdAt,
        })),
      },
      serverTime: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching auction data:', error);
    return NextResponse.json({
      success: true,
      auction: {
        id: 'fallback_auction',
        title: 'BrandMyLaptop Launch Auction',
        status: 'ACTIVE',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        totalRaised: 0,
        spots: INITIAL_SPOTS.map((s) => ({
          ...s,
          id: `spot_${s.number}`,
          auctionId: 'fallback_auction',
          stickerStatus: 'PENDING',
          clicksCount: 0,
        })),
      },
      stats: {
        totalSales: 0,
        occupiedCount: 0,
        totalSpots: 10,
        totalClicks: 0,
        totalBidsCount: 0,
        liveVisitors: getRealMetrics().liveVisitors,
        totalViews: getRealMetrics().totalViews,
      },
      serverTime: new Date().toISOString(),
    });
  }
}
