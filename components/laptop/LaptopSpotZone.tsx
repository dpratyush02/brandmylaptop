'use client';

import React from 'react';
import { useCurrency } from '../currency/CurrencyProvider';

export interface SpotData {
  id: string;
  number: number;
  position: string;
  size: string;
  dimensions: string;
  startingPrice: number;
  currentBid: number;
  minBidIncrement: number;
  currentBidderName?: string | null;
  currentBidderEmail?: string | null;
  currentBrandName?: string | null;
  currentLogoUrl?: string | null;
  currentWebsite?: string | null;
  status: string;
  bidCount: number;
  stickerStatus?: string;
  proofImageUrl?: string | null;
}

interface LaptopSpotZoneProps {
  spot: SpotData;
  isSelected: boolean;
  onSelect: (spot: SpotData) => void;
  auctionClosed?: boolean;
  style: React.CSSProperties;
  isHighest?: boolean;
}

export const LaptopSpotZone: React.FC<LaptopSpotZoneProps> = ({
  spot,
  isSelected,
  onSelect,
  auctionClosed = false,
  style,
  isHighest = false,
}) => {
  const { format } = useCurrency();
  const isOccupied = (spot?.currentBid || 0) > 0 && !!spot?.currentBrandName;
  const isWon = auctionClosed || spot?.status === 'WON';
  const displayAmount = format(spot?.currentBid > 0 ? spot.currentBid : spot.startingPrice);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(spot);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      style={style}
      className={`group absolute z-20 box-border m-0 p-0 border-0 bg-transparent appearance-none cursor-pointer select-none text-left transition-transform active:scale-[0.97] focus:outline-none ${
        isSelected ? 'z-30' : 'hover:z-25'
      }`}
      aria-label={`Spot #${spot.number.toString().padStart(2, '0')} - ${spot.position}. Click to bid.`}
    >
      {/* Zone Interactive Box */}
      <div
        className={`relative w-full h-full rounded-md flex items-center justify-center transition-all duration-200 ${
          isSelected
            ? 'ring-2 ring-[#c8f542] bg-[#c8f542]/15 shadow-[0_0_15px_rgba(200,245,66,0.3)]'
            : isOccupied
            ? 'border border-white/20 bg-black/40 hover:border-[#c8f542] hover:bg-[#c8f542]/10 shadow-sm'
            : 'border border-dashed border-white/30 hover:border-[#c8f542] hover:bg-[#c8f542]/10'
        } ${isHighest && isOccupied && !isSelected ? 'ring-1 ring-[#c8f542]/70' : ''}`}
      >
        {/* Render Brand Logo or Name */}
        {isOccupied && spot.currentLogoUrl ? (
          <div className="w-[88%] h-[80%] bg-[#f4f4f0] shadow-md px-1 flex items-center justify-center rounded-[3px] pointer-events-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={spot.currentLogoUrl}
              alt={spot.currentBrandName || 'Brand'}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        ) : isOccupied && spot.currentBrandName ? (
          <div className="w-[88%] px-1 py-1 bg-[#f4f4f0] text-[#111] text-[10px] sm:text-xs font-bold text-center leading-tight shadow-md rounded-[3px] truncate pointer-events-none">
            {spot.currentBrandName}
          </div>
        ) : (
          /* Subtle Available indicator on hover */
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <span className="font-mono text-[9px] sm:text-[10px] font-bold text-[#c8f542] bg-black/80 px-1.5 py-0.5 rounded border border-[#c8f542]/40">
              BID →
            </span>
          </div>
        )}
      </div>

      {/* Floating Hover Tooltip */}
      <div className="pointer-events-none absolute left-1/2 bottom-full -translate-x-1/2 mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-40">
        <div className="whitespace-nowrap bg-[#0e0e0e] border border-[#2a2a2a] px-2.5 py-1 text-[11px] font-mono text-white shadow-2xl rounded flex items-center gap-1.5">
          <span className="text-[#8a8a84] font-bold">
            #{spot.number.toString().padStart(2, '0')}
          </span>
          <span className={isOccupied ? 'text-[#c8f542] font-semibold' : 'text-zinc-300'}>
            {isOccupied ? `${spot.currentBrandName} (${displayAmount})` : `Open (${displayAmount})`}
          </span>
          {!isWon && (
            <span className="text-[#c8f542] font-bold">
              {isOccupied ? '· Click to Outbid' : '· Click to Bid'}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};
