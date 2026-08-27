import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const customReadable = new ReadableStream({
    async start(controller) {
      // Send initial keep-alive comment
      controller.enqueue(encoder.encode(': keep-alive\n\n'));

      // Function to send current auction snapshot
      const sendSnapshot = async () => {
        try {
          const auction = await db.auction.findFirst({
            include: {
              spots: {
                orderBy: { number: 'asc' },
                include: {
                  bids: {
                    where: { status: { in: ['CONFIRMED', 'OUTBID', 'WON'] } },
                    orderBy: { amount: 'desc' },
                    take: 10,
                  },
                },
              },
            },
          });

          if (auction) {
            const data = JSON.stringify({
              type: 'AUCTION_UPDATE',
              auction,
              serverTime: new Date().toISOString(),
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        } catch (err) {
          console.error('SSE snapshot error:', err);
        }
      };

      // Send initial snapshot
      await sendSnapshot();

      // Poll interval for updates every 3 seconds to push to client
      const interval = setInterval(async () => {
        try {
          await sendSnapshot();
        } catch (e) {
          clearInterval(interval);
        }
      }, 3000);

      // Clean up on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
      });
    },
  });

  return new Response(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
