'use client';

import React, { useEffect, useState } from 'react';
import { SpotData } from '../laptop/LaptopSpotZone';
import { useCurrency } from '../currency/CurrencyProvider';

interface OutbidBannerProps {
  spots: SpotData[];
  onBidAgain: (spot: SpotData) => void;
}

export const OutbidBanner: React.FC<OutbidBannerProps> = ({ spots, onBidAgain }) => {
  const { format } = useCurrency();
  const [outbidSpot, setOutbidSpot] = useState<{
    spot: SpotData;
    myOldBid: number;
  } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const storedBids = JSON.parse(localStorage.getItem('bml_my_bids') || '[]');
      if (!Array.isArray(storedBids) || storedBids.length === 0) return;

      for (const myBid of storedBids) {
        const matchingSpot = spots.find((s) => s.number === myBid.spotNumber);
        if (matchingSpot && matchingSpot.currentBid > myBid.amount) {
          setOutbidSpot({
            spot: matchingSpot,
            myOldBid: myBid.amount,
          });
          break;
        }
      }
    } catch {
      // ignore
    }
  }, [spots]);

  if (!outbidSpot || dismissed) return null;

  return (
    <div className="w-full bg-[#111] border-b border-[#c8f542]/30 px-4 py-2.5 sticky top-14 z-40">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-[#c8c8c0]">
          <span className="text-white font-medium">Outbid</span>
          {' on Spot #'}
          {outbidSpot.spot.number.toString().padStart(2, '0')}
          <span className="text-[#8a8a84]">
            {' · '}your bid {format(outbidSpot.myOldBid)}
            {' · now '}
            <span className="text-[#c8f542]">{format(outbidSpot.spot.currentBid)}</span>
          </span>
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onBidAgain(outbidSpot.spot)}
            className="text-[13px] font-semibold text-[#c8f542] hover:text-white transition"
          >
            Bid again →
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-[#6d6d68] hover:text-white text-sm"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};
