'use client';

import React from 'react';

interface FooterProps {
  onBidClick?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onBidClick }) => {
  return (
    <footer className="w-full pt-16 pb-20 md:pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center py-16 border-y border-[#1a1a1a]">
          <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-white">
            Want your logo on my laptop?
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#8a8a84]">
            10 spots.<br className="sm:hidden" /> 72 hours.<br className="sm:hidden" /> One laptop.
          </p>
          <button
            type="button"
            onClick={onBidClick}
            className="mt-8 px-6 py-3 bg-[#c8f542] hover:bg-[#d6ff63] text-[#111] text-sm font-semibold tracking-tight transition"
          >
            Bid for a spot →
          </button>
          <p className="mt-10 text-[13px] text-[#5c5c56] tracking-tight font-mono">
            BrandMyLaptop
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 text-[12px] text-[#5c5c56]">
          <span>© {new Date().getFullYear()} BrandMyLaptop</span>

          <div className="flex items-center gap-1 text-[#8a8a84]">
            <span>Built with ❤️ by</span>
            <a
              href="https://x.com/dpratyush02"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#c8f542] hover:text-[#d6ff63] font-medium transition"
            >
              @dpratyush02
            </a>
          </div>

          <div className="flex items-center gap-5">
            <a href="#auction" className="hover:text-white transition">Auction</a>
            <a href="#how-it-works" className="hover:text-white transition">How it works</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
            <a
              href="https://x.com/dpratyush02"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8a8a84] hover:text-white transition"
            >
              𝕏 / @dpratyush02
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
