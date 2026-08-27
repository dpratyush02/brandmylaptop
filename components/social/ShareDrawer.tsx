'use client';

import React, { useState } from 'react';
import { SpotData } from '../laptop/LaptopSpotZone';
import { formatMoney } from '@/lib/currency';
import { Share2, Check, Copy, MessageCircle } from 'lucide-react';

interface ShareDrawerProps {
  spot?: SpotData | null;
}

export const ShareDrawer: React.FC<ShareDrawerProps> = ({ spot }) => {
  const [copied, setCopied] = useState(false);

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://brandmylaptop.space';
  
  const shareText = spot
    ? `I'm bidding for Spot #${spot.number.toString().padStart(2, '0')} (${spot.position}) on BrandMyLaptop! Current bid: ${formatMoney(spot.currentBid > 0 ? spot.currentBid : spot.startingPrice)}. Your brand on a real HP laptop lid:`
    : `10 physical advertising spots on a real HP laptop lid. 72-hour live auction on BrandMyLaptop. Highest bidder gets the physical spot:`;

  const handleCopy = async () => {
    const fullText = `${shareText} ${siteUrl}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const shareToX = () => {
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(siteUrl)}`;
    window.open(tweetUrl, '_blank', 'noopener,noreferrer');
  };

  const shareToWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${siteUrl}`)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex items-center gap-2">
      {/* Share to X (Twitter) */}
      <button
        type="button"
        onClick={shareToX}
        className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
        title="Share to X"
      >
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 24.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        <span>Share to X</span>
      </button>

      {/* Share to WhatsApp */}
      <button
        type="button"
        onClick={shareToWhatsApp}
        className="px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
        title="Share to WhatsApp"
      >
        <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
        <span>WhatsApp</span>
      </button>

      {/* Copy Link */}
      <button
        type="button"
        onClick={handleCopy}
        className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
        title="Copy Link"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5 text-zinc-400" />
            <span>Copy Link</span>
          </>
        )}
      </button>
    </div>
  );
};
