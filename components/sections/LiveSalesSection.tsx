'use client';

import React from 'react';
import { useCurrency } from '../currency/CurrencyProvider';
import { SpotData } from '../laptop/LaptopSpotZone';
import { TrendingUp, MousePointerClick, ShieldCheck, Zap, ArrowUpRight } from 'lucide-react';

interface LiveSalesSectionProps {
  spots: SpotData[];
  stats?: {
    totalSales?: number;
    occupiedCount?: number;
    totalSpots?: number;
    totalClicks?: number;
    totalBidsCount?: number;
    highestBid?: {
      amount: number;
      brandName: string | null;
      spotNumber: number;
    } | null;
    recentBids?: Array<{
      id: string;
      brandName: string;
      amount: number;
      spotNumber: number;
      position: string;
      createdAt: string;
    }>;
  };
  onSpotClick?: (spot: SpotData) => void;
}

export const LiveSalesSection: React.FC<LiveSalesSectionProps> = ({
  spots,
  stats,
  onSpotClick,
}) => {
  const { format } = useCurrency();

  const totalSales = stats?.totalSales ?? spots.reduce((sum, s) => sum + (s.currentBid > 0 ? s.currentBid : 0), 0);
  const occupiedCount = stats?.occupiedCount ?? spots.filter((s) => s.currentBid > 0).length;
  const totalClicks = stats?.totalClicks ?? spots.reduce((sum, s) => sum + ((s as any).clicksCount || 0), 0);
  const totalBids = stats?.totalBidsCount ?? spots.reduce((sum, s) => sum + (s.bidCount || 0), 0);
  const occupancyPercent = Math.round((occupiedCount / 10) * 100);

  const highestBidSpot = [...spots].sort((a, b) => (b.currentBid || 0) - (a.currentBid || 0))[0];

  const recentActivity = stats?.recentBids && stats.recentBids.length > 0
    ? stats.recentBids
    : spots
        .filter((s) => s.currentBid > 0 && s.currentBrandName)
        .map((s) => ({
          id: `bid_${s.number}`,
          brandName: s.currentBrandName || 'Sponsor',
          amount: s.currentBid,
          spotNumber: s.number,
          position: s.position,
          createdAt: new Date(Date.now() - s.number * 8 * 60000).toISOString(),
        }));

  return (
    <section className="py-12 sm:py-16 border-t border-[#1a1a1a] bg-[#020202]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#141414] border border-[#262626] text-[#c8f542] mb-2">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Live Financial Transparency</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Total Live Sales & Activity
            </h2>
            <p className="text-xs sm:text-sm text-[#8a8a84] mt-0.5">
              Live auction revenue, spot occupancy, and click-through performance across all 10 positions.
            </p>
          </div>

          <div className="text-left sm:text-right bg-[#0a0a0a] p-3.5 rounded-xl border border-[#1f1f1f]">
            <span className="text-[11px] font-mono text-[#8a8a84] block uppercase tracking-wider">
              Total Auction Value
            </span>
            <span className="font-mono text-2xl sm:text-3xl font-extrabold text-[#c8f542]">
              {format(totalSales)}
            </span>
          </div>
        </div>

        {/* 4 Key Performance Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          
          {/* 1. Total Live Sales */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#090909] border border-[#1f1f1f] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[#8a8a84] mb-1">
                <span className="text-xs font-mono uppercase tracking-wider">Live Sales</span>
                <Zap className="w-3.5 h-3.5 text-[#c8f542]" />
              </div>
              <div className="font-mono text-xl sm:text-2xl font-bold text-white">
                {format(totalSales)}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-[#181818] text-[11px] font-mono text-[#8a8a84]">
              {totalBids} verified bids placed
            </div>
          </div>

          {/* 2. Occupancy Rate */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#090909] border border-[#1f1f1f] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[#8a8a84] mb-1">
                <span className="text-xs font-mono uppercase tracking-wider">Lid Occupancy</span>
                <span className="text-xs font-mono text-[#c8f542]">{occupancyPercent}%</span>
              </div>
              <div className="font-mono text-xl sm:text-2xl font-bold text-white">
                {occupiedCount} / 10 <span className="text-xs text-[#8a8a84] font-normal">Spots</span>
              </div>
            </div>
            {/* Occupancy progress bar */}
            <div className="mt-3 pt-2 border-t border-[#181818]">
              <div className="w-full bg-[#1c1c1c] h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#c8f542] h-full rounded-full transition-all duration-500"
                  style={{ width: `${occupancyPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* 3. Total Clicks Driven */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#090909] border border-[#1f1f1f] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[#8a8a84] mb-1">
                <span className="text-xs font-mono uppercase tracking-wider">Sponsor Clicks</span>
                <MousePointerClick className="w-3.5 h-3.5 text-[#c8f542]" />
              </div>
              <div className="font-mono text-xl sm:text-2xl font-bold text-white">
                {totalClicks} <span className="text-xs text-[#8a8a84] font-normal">Clicks</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-[#181818] text-[11px] font-mono text-[#8a8a84]">
              Real traffic driven to brands
            </div>
          </div>

          {/* 4. Top Single Bid */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#090909] border border-[#1f1f1f] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[#8a8a84] mb-1">
                <span className="text-xs font-mono uppercase tracking-wider">Top Spot</span>
                <ShieldCheck className="w-3.5 h-3.5 text-[#c8f542]" />
              </div>
              <div className="font-mono text-xl sm:text-2xl font-bold text-[#c8f542]">
                {highestBidSpot?.currentBid > 0 ? format(highestBidSpot.currentBid) : '$0'}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-[#181818] text-[11px] font-mono text-[#8a8a84] truncate">
              {highestBidSpot?.currentBrandName || 'Spot #01'} (Spot #{highestBidSpot?.number})
            </div>
          </div>

        </div>

        {/* Live Recent Bids & Sales Activity Feed */}
        <div className="rounded-2xl bg-[#080808] border border-[#1c1c1c] p-5 sm:p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#181818] mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#c8f542] animate-pulse" />
              <h3 className="font-bold text-sm text-white">
                Recent Bids & Spot Acquisitions
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[#8a8a84]">
              Real-time feed
            </span>
          </div>

          <div className="space-y-2.5">
            {recentActivity.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-[#0e0e0e] border border-[#181818] hover:border-[#2a2a2a] transition text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#181818] text-[#c8f542] font-mono font-bold flex items-center justify-center flex-shrink-0 text-xs">
                    #{item.spotNumber.toString().padStart(2, '0')}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate">
                      {item.brandName}
                    </div>
                    <div className="text-[11px] text-[#8a8a84] font-mono">
                      {item.position}
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="font-mono font-bold text-sm text-[#c8f542] block">
                    {format(item.amount)}
                  </span>
                  <span className="text-[10px] font-mono text-[#5c5c56]">
                    Active Leader
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
