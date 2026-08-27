'use client';

import React from 'react';

interface HeroSectionProps {
  onBidClick: () => void;
  onExploreAuction: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onBidClick,
  onExploreAuction,
}) => {
  return (
    <section className="pt-10 sm:pt-16 pb-4 sm:pb-6 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-[2.6rem] leading-[0.95] sm:text-7xl md:text-8xl font-medium tracking-tight text-white">
          Your brand.
          <br />
          <span className="text-[#c8f542]">On my laptop.</span>
        </h1>

        <p className="mt-5 text-base sm:text-xl text-[#c8c8c0] tracking-tight">
          10 spots. 72 hours. One very visible laptop.
        </p>

        <p className="mt-3 max-w-xl text-sm sm:text-[15px] text-[#8a8a84] leading-relaxed">
          Bid for a spot. Your logo goes live here instantly. Highest bidder gets the sticker on my HP laptop.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onBidClick}
            className="px-5 py-2.5 bg-[#c8f542] hover:bg-[#d6ff63] text-[#111] text-sm font-semibold tracking-tight transition"
          >
            Bid for a spot →
          </button>
          <button
            type="button"
            onClick={onExploreAuction}
            className="px-5 py-2.5 text-sm text-[#c8c8c0] hover:text-white transition"
          >
            See the spots
          </button>
        </div>
      </div>
    </section>
  );
};
