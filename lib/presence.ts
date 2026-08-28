import { db } from './db';

// Real-time visitor and page view tracker synced with Neon database

declare global {
  // eslint-disable-next-line no-var
  var __recentHeartbeats: Map<string, number> | undefined;
  // eslint-disable-next-line no-var
  var __lastKnownViews: number | undefined;
}

if (typeof global.__recentHeartbeats === 'undefined') {
  global.__recentHeartbeats = new Map<string, number>();
}
if (typeof global.__lastKnownViews === 'undefined') {
  global.__lastKnownViews = 1;
}

export async function recordPageView(): Promise<number> {
  try {
    const config = await db.adminConfig.upsert({
      where: { id: 'default_config' },
      update: { pageViews: { increment: 1 } },
      create: { id: 'default_config', pageViews: 1 },
      select: { pageViews: true },
    });
    global.__lastKnownViews = config.pageViews;
    return config.pageViews;
  } catch {
    global.__lastKnownViews = (global.__lastKnownViews || 1) + 1;
    return global.__lastKnownViews;
  }
}

export function recordHeartbeat(clientId: string): number {
  const now = Date.now();
  if (!global.__recentHeartbeats) {
    global.__recentHeartbeats = new Map<string, number>();
  }
  global.__recentHeartbeats.set(clientId, now);

  // Clean stale heartbeats older than 45 seconds
  for (const [id, lastSeen] of global.__recentHeartbeats.entries()) {
    if (now - lastSeen > 45000) {
      global.__recentHeartbeats.delete(id);
    }
  }

  return Math.max(1, global.__recentHeartbeats.size);
}

export function removeHeartbeat(clientId: string): void {
  if (global.__recentHeartbeats) {
    global.__recentHeartbeats.delete(clientId);
  }
}

export async function getRealMetrics() {
  const now = Date.now();
  if (!global.__recentHeartbeats) {
    global.__recentHeartbeats = new Map<string, number>();
  }

  for (const [id, lastSeen] of global.__recentHeartbeats.entries()) {
    if (now - lastSeen > 45000) {
      global.__recentHeartbeats.delete(id);
    }
  }

  const live = Math.max(1, global.__recentHeartbeats.size);

  let views = global.__lastKnownViews || 1;
  try {
    const config = await db.adminConfig.findUnique({
      where: { id: 'default_config' },
      select: { pageViews: true },
    });
    if (config?.pageViews) {
      views = config.pageViews;
      global.__lastKnownViews = views;
    }
  } catch {
    // fallback to memory
  }

  return {
    liveVisitors: live,
    totalViews: Math.max(1, views),
  };
}
