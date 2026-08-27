'use client';

import React from 'react';
import { SpotData } from '../laptop/LaptopSpotZone';
import { useCurrency } from '../currency/CurrencyProvider';
import { minNextBid } from '@/lib/currency';
import { ExternalLink, MousePointerClick } from 'lucide-react';

interface SpotCardProps {
  spot: SpotData;
  onBidClick: (spot: SpotData) => void;
  auctionClosed?: boolean;
  viewerState?: 'winning' | 'outbid' | null;
}

export const SpotCard: React.FC<SpotCardProps> = ({
  spot,
  onBidClick,
  auctionClosed = false,
  viewerState = null,
}) => {
  const { format } = useCurrency();
  const isOccupied = (spot?.currentBid || 0) > 0 && !!spot?.currentBrandName;
  const isWon = auctionClosed || spot?.status === 'WON';
  const pad = spot.number.toString().padStart(2, '0');
  const clicks = (spot as any).clicksCount || 0;

  const handleSponsorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      fetch('/api/spots/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spotId: spot.id, spotNumber: spot.number }),
      });
    } catch {
      // silent
    }
  };

  const handleClick = () => {
    if (!isWon) {
      onBidClick(spot);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`flex items-center gap-3 py-3.5 px-3 -mx-3 border-b border-[#1a1a1a] rounded-lg transition ${
        !isWon ? 'cursor-pointer hover:bg-[#0e0e0e]' : ''
      }`}
    >
      {/* Spot Number */}
      <div className="w-14 flex-shrink-0">
        <div className="font-mono text-[12px] font-bold text-white">#{pad}</div>
        <div className="text-[11px] text-[#8a8a84] leading-tight">{spot.position}</div>
      </div>

      {/* Brand & Clicks Info */}
      <div className="flex-1 min-w-0 flex items-center gap-3">
        {isOccupied ? (
          <>
            {spot.currentLogoUrl ? (
              <div className="w-9 h-9 flex-shrink-0 bg-[#f4f4f0] p-0.5 rounded flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={spot.currentLogoUrl}
                  alt={spot.currentBrandName || 'Brand'}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="w-9 h-9 flex-shrink-0 bg-[#161616] text-white text-xs font-semibold rounded flex items-center justify-center">
                {(spot.currentBrandName || '?')[0]}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-white truncate">
                  {spot.currentBrandName}
                </span>

                {spot.currentWebsite && (
                  <a
                    href={spot.currentWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleSponsorClick}
                    className="text-[#8a8a84] hover:text-white transition flex items-center gap-0.5 text-[11px]"
                    title={`Visit ${spot.currentBrandName}`}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2 text-[11px] font-mono text-[#8a8a84] mt-0.5">
                <span>{spot.bidCount} {spot.bidCount === 1 ? 'bid' : 'bids'}</span>
                <span>•</span>
                <span className="text-zinc-400 flex items-center gap-1">
                  <MousePointerClick className="w-3 h-3 text-[#c8f542]" />
                  {clicks} {clicks === 1 ? 'click' : 'clicks'}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div>
            <div className="text-[13px] text-[#c8c8c0]">No bids yet</div>
            <div className="text-[11px] font-mono text-[#8a8a84]">Starting at {format(spot.startingPrice)}</div>
          </div>
        )}
      </div>

      {/* Amount Display */}
      <div className="text-right flex-shrink-0">
        {isWon ? (
          <div>
            <div className="text-[10px] tracking-[0.14em] uppercase text-[#c8f542]">Won</div>
            <div className="font-mono text-sm text-[#c8f542]">{format(spot.currentBid)}</div>
          </div>
        ) : viewerState === 'winning' ? (
          <div>
            <div className="text-[10px] tracking-[0.12em] uppercase text-[#c8f542]">You&apos;re winning</div>
            <div className="font-mono text-sm text-[#c8f542]">{format(spot.currentBid)}</div>
          </div>
        ) : viewerState === 'outbid' ? (
          <div>
            <div className="text-[10px] tracking-[0.12em] uppercase text-white">Outbid</div>
            <div className="font-mono text-sm text-white">{format(spot.currentBid)}</div>
          </div>
        ) : isOccupied ? (
          <div>
            <div className="text-[10px] text-[#8a8a84]">Current bid</div>
            <div className="font-mono text-sm text-[#c8f542] font-semibold">{format(spot.currentBid)}</div>
          </div>
        ) : (
          <div>
            <div className="text-[10px] tracking-[0.14em] uppercase text-[#8a8a84]">Open</div>
            <div className="font-mono text-sm text-white font-medium">{format(spot.startingPrice)}</div>
          </div>
        )}
      </div>

      {/* CTA Button */}
      <div className="flex-shrink-0">
        {isWon ? (
          <span className="text-[12px] text-[#8a8a84]">—</span>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBidClick(spot);
            }}
            className="text-[12px] font-bold font-mono text-[#c8f542] hover:text-[#d6ff63] bg-[#c8f542]/10 hover:bg-[#c8f542]/20 px-2.5 py-1 rounded border border-[#c8f542]/30 transition whitespace-nowrap"
          >
            {viewerState === 'outbid' ? 'Bid again →' : 'Bid →'}
          </button>
        )}
      </div>
    </div>
  );
};
