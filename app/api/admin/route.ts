import { NextRequest, NextResponse } from 'next/server';
import { db, ensureDatabase } from '@/lib/db';
import { INITIAL_SPOTS } from '@/lib/demo-data';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin_brandmylaptop_2026';

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  return token === ADMIN_PASSWORD;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureDatabase();
    const auction = await db.auction.findFirst({
      include: {
        spots: {
          orderBy: { number: 'asc' },
          include: {
            bids: {
              orderBy: { createdAt: 'desc' },
              include: { payment: true },
            },
            winners: true,
            installations: true,
          },
        },
      },
    });

    const allBids = await db.bid.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        spot: true,
        payment: true,
      },
    });

    const allPayments = await db.payment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        bid: {
          include: { spot: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      auction,
      bids: allBids,
      payments: allPayments,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'EXTEND_AUCTION') {
      const { hours = 24 } = body;
      const auction = await db.auction.findFirst();
      if (!auction) return NextResponse.json({ error: 'No auction found' }, { status: 404 });

      const newEndTime = new Date(new Date(auction.endTime).getTime() + hours * 60 * 60 * 1000);
      await db.auction.update({
        where: { id: auction.id },
        data: { endTime: newEndTime, status: 'ACTIVE' },
      });

      return NextResponse.json({ success: true, message: `Auction extended by ${hours} hours` });
    }

    if (action === 'CLOSE_AUCTION') {
      const auction = await db.auction.findFirst();
      if (!auction) return NextResponse.json({ error: 'No auction found' }, { status: 404 });

      await db.auction.update({
        where: { id: auction.id },
        data: { status: 'CLOSED', endTime: new Date() },
      });

      // Finalize winners
      const spots = await db.spot.findMany({ where: { auctionId: auction.id } });
      for (const spot of spots) {
        if (spot.currentBid > 0 && spot.currentBrandName) {
          const topBid = await db.bid.findFirst({
            where: { spotId: spot.id, status: 'CONFIRMED' },
            orderBy: { amount: 'desc' },
          });

          if (topBid) {
            await db.bid.update({
              where: { id: topBid.id },
              data: { status: 'WON' },
            });

            await db.spot.update({
              where: { id: spot.id },
              data: { status: 'WON', stickerStatus: 'WINNER_CONFIRMED' },
            });

            await db.winner.upsert({
              where: { spotId: spot.id },
              update: {
                brandName: topBid.brandName,
                bidderName: topBid.bidderName,
                bidderEmail: topBid.bidderEmail,
                website: topBid.website,
                logoUrl: topBid.logoUrl,
                winningAmount: topBid.amount,
                status: 'CONFIRMED',
                stickerStatus: 'WINNER_CONFIRMED',
              },
              create: {
                spotId: spot.id,
                bidId: topBid.id,
                brandName: topBid.brandName,
                bidderName: topBid.bidderName,
                bidderEmail: topBid.bidderEmail,
                website: topBid.website,
                logoUrl: topBid.logoUrl,
                winningAmount: topBid.amount,
                status: 'CONFIRMED',
                stickerStatus: 'WINNER_CONFIRMED',
              },
            });
          }
        }
      }

      return NextResponse.json({ success: true, message: 'Auction closed and winners finalized!' });
    }

    if (action === 'UPDATE_STICKER_STATUS') {
      const { spotId, stickerStatus, proofImageUrl, notes } = body;
      
      const spot = await db.spot.update({
        where: { id: spotId },
        data: {
          stickerStatus,
          proofImageUrl: proofImageUrl || undefined,
        },
      });

      await db.winner.updateMany({
        where: { spotId },
        data: {
          stickerStatus,
          proofImageUrl: proofImageUrl || undefined,
        },
      });

      await db.stickerInstallation.upsert({
        where: { id: `install_${spotId}` },
        update: {
          stickerStatus,
          proofImageUrl: proofImageUrl || undefined,
          notes: notes || undefined,
        },
        create: {
          id: `install_${spotId}`,
          spotId,
          brandName: spot.currentBrandName || `Spot #${spot.number}`,
          stickerStatus,
          proofImageUrl: proofImageUrl || undefined,
          notes: notes || undefined,
        },
      });

      return NextResponse.json({ success: true, message: `Updated sticker status to ${stickerStatus}` });
    }

    if (action === 'UPDATE_SPOT_CONFIG') {
      const { spotId, startingPrice, minBidIncrement } = body;
      await db.spot.update({
        where: { id: spotId },
        data: {
          startingPrice: parseFloat(startingPrice),
          minBidIncrement: parseFloat(minBidIncrement),
        },
      });
      return NextResponse.json({ success: true, message: 'Spot configuration updated.' });
    }

    if (action === 'RESET_DEMO_DATA') {
      // Clear and reseed demo data
      await db.payment.deleteMany({});
      await db.winner.deleteMany({});
      await db.stickerInstallation.deleteMany({});
      await db.bid.deleteMany({});
      await db.spot.deleteMany({});
      await db.auction.deleteMany({});

      const startTime = new Date();
      const endTime = new Date(Date.now() + 72 * 60 * 60 * 1000);

      const auction = await db.auction.create({
        data: {
          title: 'BrandMyLaptop.space Launch Auction',
          status: 'ACTIVE',
          startTime,
          endTime,
          totalRaised: 0,
        },
      });

      for (const s of INITIAL_SPOTS) {
        const spot = await db.spot.create({
          data: {
            auctionId: auction.id,
            number: s.number,
            position: s.position,
            size: s.size,
            dimensions: s.dimensions,
            startingPrice: s.startingPrice,
            currentBid: s.currentBid,
            minBidIncrement: s.minBidIncrement,
            currentBidderName: s.currentBidderName || null,
            currentBrandName: s.currentBrandName || null,
            currentLogoUrl: s.currentLogoUrl || null,
            currentWebsite: s.currentWebsite || null,
            status: s.status,
            bidCount: s.bidCount,
          },
        });

        if (s.currentBid > 0 && s.currentBrandName) {
          await db.bid.create({
            data: {
              spotId: spot.id,
              bidderName: s.currentBidderName || 'Early Sponsor',
              bidderEmail: `sponsor_${s.number}@example.com`,
              brandName: s.currentBrandName,
              website: s.currentWebsite,
              logoUrl: s.currentLogoUrl,
              amount: s.currentBid,
              status: 'CONFIRMED',
            },
          });
        }
      }

      return NextResponse.json({ success: true, message: 'Reset to fresh demo data!' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
