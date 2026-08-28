import { PrismaClient } from '@prisma/client';

export const INITIAL_SPOTS_CATALOG = [
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

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  dbInitialized: boolean | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

let initPromise: Promise<void> | null = null;

export async function ensureDatabase(): Promise<void> {
  if (globalForPrisma.dbInitialized) {
    return;
  }
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      // Ensure initial Auction and 10 spots exist
      let auction = await db.auction.findFirst();
      if (!auction) {
        auction = await db.auction.create({
          data: {
            title: 'BrandMyLaptop Launch Auction',
            status: 'PENDING_FIRST_BID',
            totalRaised: 0,
            endTime: new Date(Date.now() + 72 * 60 * 60 * 1000),
          },
        });
      }

      for (const s of INITIAL_SPOTS_CATALOG) {
        const existing = await db.spot.findUnique({
          where: { number: s.number },
        });

        if (!existing) {
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
              status: 'AVAILABLE',
              bidCount: 0,
              clicksCount: 0,
              stickerStatus: 'PENDING',
            },
          });
        } else if (existing.currentBid === 0 && existing.startingPrice !== s.startingPrice) {
          await db.spot.update({
            where: { id: existing.id },
            data: { startingPrice: s.startingPrice },
          });
        }
      }

      globalForPrisma.dbInitialized = true;
    } catch (err) {
      console.warn('ensureDatabase note:', err);
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}
