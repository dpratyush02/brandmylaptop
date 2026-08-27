import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.payment.deleteMany({});
  await prisma.winner.deleteMany({});
  await prisma.stickerInstallation.deleteMany({});
  await prisma.bid.deleteMany({});
  await prisma.spot.updateMany({
    data: {
      currentBid: 0,
      currentBidderName: null,
      currentBidderEmail: null,
      currentBrandName: null,
      currentLogoUrl: null,
      currentWebsite: null,
      status: 'AVAILABLE',
      bidCount: 0,
      stickerStatus: 'PENDING',
      proofImageUrl: null,
    },
  });
  await prisma.auction.updateMany({
    data: { totalRaised: 0, status: 'ACTIVE' },
  });
  console.log('Cleared demo brands. All 10 spots are OPEN.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
