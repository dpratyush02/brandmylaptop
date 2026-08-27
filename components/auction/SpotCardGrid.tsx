'use client';

import React, { useEffect, useState } from 'react';
import { SpotData } from '../laptop/LaptopSpotZone';
import { SpotCard } from './SpotCard';

interface SpotCardGridProps {
  spots: SpotData[];
  onBidClick: (spot: SpotData) => void;
  auctionClosed?: boolean;
}

type ViewerState = 'winning' | 'outbid' | null;

export const SpotCardGrid: React.FC<SpotCardGridProps> = ({
  spots,
  onBidClick,
  auctionClosed = false,
}) => {
  const [viewerMap, setViewerMap] = useState<Record<number, ViewerState>>({});

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('bml_my_bids') || '[]');
      if (!Array.isArray(stored)) return;
      const next: Record<number, ViewerState> = {};
      for (const myBid of stored) {
        const spot = spots.find((s) => s.number === myBid.spotNumber);
        if (!spot || !myBid.amount) continue;
        if (spot.currentBid > myBid.amount) next[spot.number] = 'outbid';
        else if (
          spot.currentBid > 0 &&
          (spot.currentBrandName === myBid.brandName || spot.currentBidderEmail === myBid.email)
        ) {
          next[spot.number] = 'winning';
        }
      }
      setViewerMap(next);
    } catch {
      // ignore
    }
  }, [spots]);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
        {spots.map((spot) => (
          <SpotCard
            key={spot.id || spot.number}
            spot={spot}
            onBidClick={onBidClick}
            auctionClosed={auctionClosed}
            viewerState={viewerMap[spot.number] || null}
          />
        ))}
      </div>
    </div>
  );
};
