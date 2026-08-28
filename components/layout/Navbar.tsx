'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, ArrowRight, Menu, X } from 'lucide-react';

interface NavbarProps {
  onBidClick?: () => void;
  auctionClosed?: boolean;
  liveVisitors?: number;
  totalViews?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onBidClick,
  auctionClosed = false,
  liveVisitors = 1,
  totalViews,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const displayViews = typeof totalViews === 'number' && totalViews > 0 ? totalViews : 1;
  const formattedViews = displayViews >= 1000
    ? `${(displayViews / 1000).toFixed(1)}k`
    : displayViews.toString();

  const navLinks = [
    { name: 'Auction', href: '#auction' },
    { name: 'How it works', href: '#how-it-works' },
    { name: 'FAQ', href: '#faq' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-black/92 backdrop-blur-md border-b border-[#1c1c1c]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          
          {/* Left Brand & Visitor Metrics */}
          <div className="flex items-center gap-3.5 min-w-0">
            <Link href="/" className="text-[15px] font-bold tracking-tight text-white truncate">
              BrandMyLaptop
            </Link>

            {/* Live Visitors Badge */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[#111] border border-[#262626] text-[#c8f542]">
              <span className={`inline-block w-2 h-2 rounded-full ${auctionClosed ? 'bg-zinc-500' : 'bg-[#c8f542] animate-pulse'}`} />
              <span>{liveVisitors} online</span>
            </div>

            {/* Total Views Badge */}
            <div className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono text-[#8a8a84] bg-[#0c0c0c] px-2 py-0.5 rounded border border-[#1f1f1f]">
              <Eye className="w-3 h-3 text-zinc-500" />
              <span>{formattedViews} views</span>
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-[13px] text-[#8a8a84] hover:text-white transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Right Action Button */}
          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={onBidClick}
              className="px-3.5 py-1.5 bg-[#c8f542] hover:bg-[#d6ff63] text-[#111] text-[13px] font-bold tracking-tight rounded transition flex items-center gap-1 active:scale-95"
            >
              <span>Bid for a spot</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Right Bar */}
          <div className="flex md:hidden items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#c8f542] bg-[#111] px-2 py-0.5 rounded border border-[#262626]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c8f542] animate-pulse" />
              {liveVisitors} live
            </span>

            <button
              type="button"
              onClick={onBidClick}
              className="px-2.5 py-1 bg-[#c8f542] text-[#111] text-[12px] font-bold rounded"
            >
              Bid
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-[#c8c8c0] rounded bg-[#111] border border-[#222]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4 text-white" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pb-4 pt-2 border-t border-[#1a1a1a] bg-black space-y-3">
            <div className="flex items-center gap-3 py-1 text-xs font-mono text-[#8a8a84]">
              <span>Live Visitors: <strong className="text-[#c8f542]">{liveVisitors}</strong></span>
              <span>•</span>
              <span>Total Views: <strong className="text-white">{formattedViews}</strong></span>
            </div>

            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 text-sm text-[#c8c8c0] hover:text-white"
              >
                {link.name}
              </a>
            ))}
          </div>
        )}
      </header>
    </>
  );
};
