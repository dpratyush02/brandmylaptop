import { PrismaClient } from '@prisma/client';

const INITIAL_SPOTS_CATALOG = [
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

// On Vercel, ensure SQLite database is stored in writable /tmp directory
if (process.env.VERCEL) {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('./dev.db') || process.env.DATABASE_URL === 'file:./dev.db') {
    process.env.DATABASE_URL = 'file:/tmp/dev.db';
  }
}

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
      // 1. Create tables if they do not exist
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Auction" (
          "id" TEXT PRIMARY KEY,
          "title" TEXT NOT NULL DEFAULT 'BrandMyLaptop Launch Auction',
          "status" TEXT NOT NULL DEFAULT 'PENDING_FIRST_BID',
          "startTime" DATETIME,
          "endTime" DATETIME,
          "totalRaised" REAL NOT NULL DEFAULT 0,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Spot" (
          "id" TEXT PRIMARY KEY,
          "auctionId" TEXT NOT NULL,
          "number" INTEGER NOT NULL UNIQUE,
          "position" TEXT NOT NULL,
          "size" TEXT NOT NULL,
          "dimensions" TEXT NOT NULL,
          "startingPrice" REAL NOT NULL DEFAULT 25,
          "currentBid" REAL NOT NULL DEFAULT 0,
          "minBidIncrement" REAL NOT NULL DEFAULT 1,
          "currentBidderName" TEXT,
          "currentBidderEmail" TEXT,
          "currentBrandName" TEXT,
          "currentLogoUrl" TEXT,
          "currentWebsite" TEXT,
          "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
          "bidCount" INTEGER NOT NULL DEFAULT 0,
          "clicksCount" INTEGER NOT NULL DEFAULT 0,
          "stickerStatus" TEXT NOT NULL DEFAULT 'PENDING',
          "proofImageUrl" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("auctionId") REFERENCES "Auction" ("id") ON DELETE CASCADE
        );
      `);

      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Bid" (
          "id" TEXT PRIMARY KEY,
          "spotId" TEXT NOT NULL,
          "bidderName" TEXT NOT NULL,
          "bidderEmail" TEXT NOT NULL,
          "brandName" TEXT NOT NULL,
          "website" TEXT,
          "logoUrl" TEXT,
          "amount" REAL NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'PENDING',
          "dodoSessionId" TEXT UNIQUE,
          "dodoPaymentId" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("spotId") REFERENCES "Spot" ("id") ON DELETE CASCADE
        );
      `);

      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Payment" (
          "id" TEXT PRIMARY KEY,
          "bidId" TEXT NOT NULL UNIQUE,
          "dodoSessionId" TEXT,
          "dodoPaymentId" TEXT,
          "status" TEXT NOT NULL DEFAULT 'PENDING',
          "amount" REAL NOT NULL,
          "currency" TEXT NOT NULL DEFAULT 'USD',
          "metadata" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("bidId") REFERENCES "Bid" ("id") ON DELETE CASCADE
        );
      `);

      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Winner" (
          "id" TEXT PRIMARY KEY,
          "spotId" TEXT NOT NULL UNIQUE,
          "bidId" TEXT NOT NULL UNIQUE,
          "brandName" TEXT NOT NULL,
          "bidderName" TEXT NOT NULL,
          "bidderEmail" TEXT NOT NULL,
          "website" TEXT,
          "logoUrl" TEXT,
          "winningAmount" REAL NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
          "stickerStatus" TEXT NOT NULL DEFAULT 'WINNER_CONFIRMED',
          "proofImageUrl" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("spotId") REFERENCES "Spot" ("id") ON DELETE CASCADE,
          FOREIGN KEY ("bidId") REFERENCES "Bid" ("id") ON DELETE CASCADE
        );
      `);

      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "StickerInstallation" (
          "id" TEXT PRIMARY KEY,
          "spotId" TEXT NOT NULL,
          "brandName" TEXT NOT NULL,
          "stickerStatus" TEXT NOT NULL DEFAULT 'WINNER_CONFIRMED',
          "proofImageUrl" TEXT,
          "notes" TEXT,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("spotId") REFERENCES "Spot" ("id") ON DELETE CASCADE
        );
      `);

      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "AdminConfig" (
          "id" TEXT PRIMARY KEY DEFAULT 'default_config',
          "outbidPolicy" TEXT NOT NULL DEFAULT 'V1_MANUAL_REVIEW',
          "siteActive" BOOLEAN NOT NULL DEFAULT 1,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 2. Ensure initial Auction and 10 spots exist
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
        }
      }

      globalForPrisma.dbInitialized = true;
    } catch (err) {
      console.error('Error in ensureDatabase():', err);
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}
