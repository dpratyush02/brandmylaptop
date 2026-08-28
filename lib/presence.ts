// Real-time visitor and page view tracker

declare global {
  // eslint-disable-next-line no-var
  var __realPageViews: number | undefined;
  // eslint-disable-next-line no-var
  var __recentHeartbeats: Map<string, number> | undefined;
}

if (typeof global.__realPageViews === 'undefined') {
  global.__realPageViews = 0;
}
if (typeof global.__recentHeartbeats === 'undefined') {
  global.__recentHeartbeats = new Map<string, number>();
}

export function recordPageView(): number {
  global.__realPageViews = (global.__realPageViews || 0) + 1;
  return global.__realPageViews;
}

export function recordHeartbeat(clientId: string): number {
  const now = Date.now();
  if (!global.__recentHeartbeats) {
    global.__recentHeartbeats = new Map<string, number>();
  }
  global.__recentHeartbeats.set(clientId, now);

  // Clean stale heartbeats older than 30 seconds
  for (const [id, lastSeen] of global.__recentHeartbeats.entries()) {
    if (now - lastSeen > 30000) {
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

export function getRealMetrics() {
  const now = Date.now();
  if (!global.__recentHeartbeats) {
    global.__recentHeartbeats = new Map<string, number>();
  }
  
  for (const [id, lastSeen] of global.__recentHeartbeats.entries()) {
    if (now - lastSeen > 30000) {
      global.__recentHeartbeats.delete(id);
    }
  }

  const live = Math.max(1, global.__recentHeartbeats.size);
  const views = Math.max(1, global.__realPageViews || 1);

  return {
    liveVisitors: live,
    totalViews: views,
  };
}
