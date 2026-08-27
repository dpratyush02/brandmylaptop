'use client';

import React from 'react';
import { LaptopSpotZone, SpotData } from './LaptopSpotZone';
import { SPOT_BOXES } from '@/lib/demo-data';

interface HPLaptopMockupProps {
  spots: SpotData[];
  selectedSpot: SpotData | null;
  onSelectSpot: (spot: SpotData) => void;
  auctionClosed?: boolean;
}

function fallbackSpot(num: number): SpotData {
  return {
    id: `spot_${num}`,
    number: num,
    position: `Spot #${num}`,
    size: 'Standard',
    dimensions: '7.5cm × 4.5cm',
    startingPrice: 25,
    currentBid: 0,
    minBidIncrement: 5,
    status: 'AVAILABLE',
    bidCount: 0,
  };
}

export const HPLaptopMockup: React.FC<HPLaptopMockupProps> = ({
  spots,
  selectedSpot,
  onSelectSpot,
  auctionClosed = false,
}) => {
  const spotMap = new Map<number, SpotData>();
  spots.forEach((s) => spotMap.set(s.number, s));
  const getSpot = (num: number) => spotMap.get(num) || fallbackSpot(num);
  const highestBid = Math.max(0, ...spots.map((s) => s.currentBid || 0));

  return (
    <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center">
      
      {/* Subtle top indicator */}
      <div className="mb-3 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono text-[#8a8a84] bg-[#0d0d0d] border border-[#222]">
          <span className="w-2 h-2 rounded-full bg-[#c8f542] animate-pulse" />
          Click any of the 10 marked positions on the lid to bid
        </span>
      </div>

      {/* Laptop Lid Showcase with Edge Blending Glow & Mask */}
      <div className="relative w-full flex items-center justify-center">
        
        {/* Soft ambient background blend glow */}
        <div 
          className="absolute inset-0 -m-8 pointer-events-none -z-10"
          style={{
            background: 'radial-gradient(ellipse 75% 65% at 50% 50%, rgba(255, 255, 255, 0.02) 0%, rgba(0, 0, 0, 0.8) 70%, transparent 100%)',
          }}
        />

        {/* Laptop Container with Soft Edge Feather / Vignette */}
        <div
          className="relative w-full overflow-hidden"
          style={{
            maskImage: 'radial-gradient(ellipse 96% 92% at 50% 50%, black 75%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 96% 92% at 50% 50%, black 75%, transparent 100%)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/laptop/hp-space.jpeg"
            alt="My HP laptop — 10 advertising spots marked on the lid"
            className="block w-full h-auto select-none pointer-events-none"
            draggable={false}
          />

          {/* Interactive Spot Zones */}
          {Object.entries(SPOT_BOXES).map(([key, box]) => {
            const num = Number(key);
            const spot = getSpot(num);
            return (
              <LaptopSpotZone
                key={num}
                spot={spot}
                isSelected={selectedSpot?.number === num}
                onSelect={onSelectSpot}
                auctionClosed={auctionClosed}
                isHighest={spot.currentBid > 0 && spot.currentBid === highestBid}
                style={{
                  left: `${box.left}%`,
                  top: `${box.top}%`,
                  width: `${box.width}%`,
                  height: `${box.height}%`,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
