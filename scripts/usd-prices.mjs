import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const prices = { 1: 30, 2: 40, 3: 40, 4: 25, 5: 25, 6: 25, 7: 50, 8: 25, 9: 20, 10: 20 };

async function main() {
  for (const [n, price] of Object.entries(prices)) {
    await prisma.spot.updateMany({
      where: { number: Number(n) },
      data: {
        startingPrice: price,
        minBidIncrement: 5,
        currentBid: 0,
        currentBrandName: null,
        currentBidderName: null,
        currentBidderEmail: null,
        currentLogoUrl: null,
        currentWebsite: null,
        status: 'AVAILABLE',
        bidCount: 0,
      },
    });
  }
  await prisma.auction.updateMany({ data: { totalRaised: 0 } });
  console.log('USD prices applied to all 10 spots.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
