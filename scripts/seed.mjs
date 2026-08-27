import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CLEAN_SPOTS = [
  { number: 1, position: 'Top Left', size: 'Medium', dimensions: '8.0cm × 5.0cm', startingPrice: 5, minBidIncrement: 1 },
  { number: 2, position: 'Top Center', size: 'Large', dimensions: '9.5cm × 5.5cm', startingPrice: 10, minBidIncrement: 1 },
  { number: 3, position: 'Top Right', size: 'Large', dimensions: '9.5cm × 5.5cm', startingPrice: 30, minBidIncrement: 1 },
  { number: 4, position: 'Middle Left', size: 'Standard', dimensions: '7.0cm × 4.5cm', startingPrice: 20, minBidIncrement: 1 },
  { number: 5, position: 'Middle Right', size: 'Standard', dimensions: '7.0cm × 4.5cm', startingPrice: 20, minBidIncrement: 1 },
  { number: 6, position: 'Lower Left', size: 'Standard', dimensions: '7.5cm × 4.5cm', startingPrice: 25, minBidIncrement: 1 },
  { number: 7, position: 'Lower Center', size: 'Premium Wide', dimensions: '10.0cm × 5.0cm', startingPrice: 35, minBidIncrement: 1 },
  { number: 8, position: 'Lower Right', size: 'Standard', dimensions: '7.5cm × 4.5cm', startingPrice: 25, minBidIncrement: 1 },
  { number: 9, position: 'Bottom Left', size: 'Compact', dimensions: '6.5cm × 4.0cm', startingPrice: 15, minBidIncrement: 1 },
  { number: 10, position: 'Bottom Right', size: 'Compact', dimensions: '6.5cm × 4.0cm', startingPrice: 15, minBidIncrement: 1 },
];

async function main() {
  console.log('Resetting database to 10 clean real spots (0 mock data)...');

  await prisma.payment.deleteMany({});
  await prisma.winner.deleteMany({});
  await prisma.stickerInstallation.deleteMany({});
  await prisma.bid.deleteMany({});
  await prisma.spot.deleteMany({});
  await prisma.auction.deleteMany({});

  const startTime = new Date();
  const endTime = new Date(Date.now() + 72 * 60 * 60 * 1000);

  const auction = await prisma.auction.create({
    data: {
      title: 'BrandMyLaptop Launch Auction',
      status: 'ACTIVE',
      startTime,
      endTime,
      totalRaised: 0,
    },
  });

  for (const s of CLEAN_SPOTS) {
    await prisma.spot.create({
      data: {
        auctionId: auction.id,
        number: s.number,
        position: s.position,
        size: s.size,
        dimensions: s.dimensions,
        startingPrice: s.startingPrice,
        currentBid: 0,
        minBidIncrement: s.minBidIncrement,
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

  console.log('Clean slate initialized! 10 spots ready for real live bids.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
