import { PrismaClient } from '@prisma/client';
import { INITIAL_SPOTS } from '../lib/demo-data';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding BrandMyLaptop database...');

  // 1. Create or ensure active 72-hour auction
  const existingAuction = await prisma.auction.findFirst();
  let auction = existingAuction;

  if (!auction) {
    const startTime = new Date();
    const endTime = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours from now

    auction = await prisma.auction.create({
      data: {
        title: 'BrandMyLaptop.space Launch Auction',
        status: 'ACTIVE',
        startTime,
        endTime,
        totalRaised: 0,
      },
    });
    console.log(`Created auction with ID: ${auction.id}`);
  } else {
    console.log(`Using existing auction: ${auction.id}`);
  }

  // 2. Upsert the 10 spots
  for (const s of INITIAL_SPOTS) {
    const spot = await prisma.spot.upsert({
      where: { number: s.number },
      update: {
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
      create: {
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

    // Create demo bids for occupied spots so bid history is realistic
    if (s.currentBid > 0 && s.currentBrandName) {
      const existingBid = await prisma.bid.findFirst({
        where: { spotId: spot.id },
      });

      if (!existingBid) {
        // Base bid
        await prisma.bid.create({
          data: {
            spotId: spot.id,
            bidderName: s.currentBidderName || 'Early Sponsor',
            bidderEmail: `sponsor_${s.number}@example.com`,
            brandName: s.currentBrandName,
            website: s.currentWebsite,
            logoUrl: s.currentLogoUrl,
            amount: s.currentBid,
            status: 'CONFIRMED',
            createdAt: new Date(Date.now() - (s.number * 4200000)),
          },
        });
      }
    }
  }

  console.log('Seeding completed successfully! 10 spots initialized.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
