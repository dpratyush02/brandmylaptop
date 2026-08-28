'use client';

import React, { useEffect, useState } from 'react';
import { formatTimeRemaining } from '@/lib/utils';

interface LiveAuctionSectionProps {
  endTime: string | Date;
  occupiedCount: number;
  totalSpots?: number;
  auctionClosed?: boolean;
  hasStarted?: boolean;
}

export const LiveAuctionSection: React.FC<LiveAuctionSectionProps> = ({
  endTime,
  occupiedCount,
  totalSpots = 10,
  auctionClosed = false,
  hasStarted = false,
}) => {
  const isStarted = hasStarted || occupiedCount > 0;
  const [timeLeft, setTimeLeft] = useState(formatTimeRemaining(endTime));

  useEffect(() => {
    if (!isStarted) return;
    const timer = setInterval(() => {
      setTimeLeft(formatTimeRemaining(endTime));
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime, isStarted]);

  const isEnded = auctionClosed || (isStarted && timeLeft.isExpired);

  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-white">Live auction</h2>
        <p className="mt-1.5 flex items-center gap-2 text-[13px] text-[#8a8a84]">
          {!isEnded && <span className="live-dot" />}
          <span>
            {occupiedCount} of {totalSpots} spots taken
          </span>
        </p>
      </div>
      <div className="text-left sm:text-right">
        <div className="text-[11px] uppercase tracking-[0.16em] text-[#8a8a84]">
          {!isStarted ? 'Auction duration' : isEnded ? 'Auction ended' : 'Ends in'}
        </div>
        <div className="font-mono text-2xl sm:text-3xl text-[#c8f542] tabular-nums tracking-tight">
          {!isStarted ? '72:00:00' : isEnded ? '00:00:00' : timeLeft.formatted}
        </div>
        {!isStarted && (
          <div className="text-[11px] font-mono text-[#8a8a84] mt-0.5">
            Starts after 1st bid
          </div>
        )}
      </div>
    </div>
  );
};
