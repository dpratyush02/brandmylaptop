import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { recordHeartbeat, removeHeartbeat, getRealMetrics } from '@/lib/presence';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const customReadable = new ReadableStream({
    async start(controller) {
      recordHeartbeat(clientId);

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
            recordHeartbeat(clientId);
            const metrics = await getRealMetrics();
            const data = JSON.stringify({
              type: 'AUCTION_UPDATE',
              auction,
              stats: {
                liveVisitors: metrics.liveVisitors,
                totalViews: metrics.totalViews,
              },
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
        removeHeartbeat(clientId);
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
