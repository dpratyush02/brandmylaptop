'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SpotData } from '../laptop/LaptopSpotZone';
import { useCurrency } from '../currency/CurrencyProvider';
import { minNextBid } from '@/lib/currency';

interface BidModalProps {
  spot: SpotData | null;
  isOpen: boolean;
  onClose: () => void;
  auctionClosed?: boolean;
}

export const BidModal: React.FC<BidModalProps> = ({
  spot,
  isOpen,
  onClose,
  auctionClosed = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { format } = useCurrency();

  const [bidAmount, setBidAmount] = useState<string>('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const minRequired = spot ? minNextBid(spot) : 25;

  useEffect(() => {
    if (isOpen && spot) {
      setBidAmount(String(minRequired));
      setErrorMsg(null);
      setIsSubmitting(false);
    }
  }, [isOpen, spot, minRequired]);

  const presets = useMemo(() => {
    return [minRequired, minRequired + 1, minRequired + 5, minRequired + 10];
  }, [minRequired]);

  if (!isOpen || !spot) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setErrorMsg('Logo file size must be less than 3MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result as string);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numericAmount = parseFloat(bidAmount || String(minRequired));
    if (Number.isNaN(numericAmount) || numericAmount < minRequired) {
      setErrorMsg(`Minimum bid is ${format(minRequired)}`);
      return;
    }
    if (!email.trim() || !companyName.trim()) {
      setErrorMsg('Please complete company name and email.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/bids/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spotId: spot.id,
          spotNumber: spot.number,
          bidAmount: numericAmount,
          currency: 'USD',
          name: companyName.trim(),
          email: email.trim(),
          companyName: companyName.trim(),
          website: website.trim() || undefined,
          logoUrl: logoPreview || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize payment session.');
      }

      try {
        const myBids = JSON.parse(localStorage.getItem('bml_my_bids') || '[]');
        myBids.push({
          bidId: data.bidId,
          spotNumber: spot.number,
          amount: numericAmount,
          brandName: companyName.trim(),
          email: email.trim(),
        });
        localStorage.setItem('bml_my_bids', JSON.stringify(myBids));
      } catch {
        // ignore
      }

      window.location.href = data.checkoutUrl;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error placing bid. Please try again.';
      setErrorMsg(message);
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 bg-[#111] border border-[#2a2a2a] text-white text-sm placeholder-[#5c5c56] focus:outline-none focus:border-[#c8f542] rounded';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-[#0c0c0c] border border-[#242424] rounded-xl shadow-2xl my-6 overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1f1f1f] flex items-start justify-between bg-[#0e0e0e]">
          <div>
            <div className="font-mono text-[12px] font-bold text-[#c8f542]">
              Spot #{spot.number.toString().padStart(2, '0')}
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">{spot.position}</h3>
            <p className="text-[11px] font-mono text-[#8a8a84]">{spot.size} · {spot.dimensions}</p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="w-8 h-8 rounded-lg bg-[#181818] hover:bg-[#222] text-[#8a8a84] hover:text-white flex items-center justify-center text-lg leading-none transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmitBid} className="p-5 space-y-4">
          <div className="flex items-end justify-between gap-4 p-3 bg-[#141414] rounded-lg border border-[#222]">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#8a8a84]">
                {spot.currentBid > 0 ? 'Current bid' : 'Starting at'}
              </div>
              <div className="font-mono text-xl font-bold text-[#c8f542]">
                {format(spot.currentBid > 0 ? spot.currentBid : spot.startingPrice)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#8a8a84]">Min Next Bid</div>
              <div className="font-mono text-base font-bold text-white">{format(minRequired)}</div>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-mono text-[#8a8a84] mb-1">Your bid (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[#8a8a84]">$</span>
              <input
                type="number"
                min={minRequired}
                step={1}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className={`${inputClass} pl-7 font-mono text-base font-medium`}
                required
              />
            </div>
            <div className="flex gap-2 mt-2">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setBidAmount(String(preset))}
                  className="text-[11px] font-mono text-[#8a8a84] hover:text-white border border-[#2a2a2a] px-2.5 py-1 rounded bg-[#111] transition"
                >
                  {format(preset)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-mono text-[#8a8a84] mb-1">Company / Brand name</label>
            <input 
              type="text" 
              value={companyName} 
              onChange={(e) => setCompanyName(e.target.value)} 
              placeholder="e.g. Acme Corp" 
              className={inputClass} 
              required 
            />
          </div>

          <div>
            <label className="block text-[12px] font-mono text-[#8a8a84] mb-1">Email address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="you@company.com" 
              className={inputClass} 
              required 
            />
          </div>

          <div>
            <label className="block text-[12px] font-mono text-[#8a8a84] mb-1">Website URL</label>
            <input 
              type="url" 
              value={website} 
              onChange={(e) => setWebsite(e.target.value)} 
              placeholder="https://company.com" 
              className={inputClass} 
            />
          </div>

          <div>
            <label className="block text-[12px] font-mono text-[#8a8a84] mb-1">Brand Logo (PNG, JPG, SVG)</label>
            <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/png,image/jpeg,image/svg+xml" className="hidden" />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[12px] font-mono text-[#c8c8c0] border border-[#2a2a2a] px-3 py-1.5 rounded bg-[#111] hover:border-white transition"
              >
                {logoPreview ? 'Change logo' : 'Upload logo'}
              </button>
              {logoPreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoPreview} alt="Logo preview" className="h-8 object-contain rounded bg-white/10 p-0.5" />
              )}
            </div>
          </div>

          {/* Rule note */}
          <div className="p-2.5 rounded bg-[#111] border border-[#222] text-[11px] text-[#8a8a84] leading-relaxed font-mono">
            • <strong>Online:</strong> Visible on BrandMyLaptop immediately after payment.
            <br />
            • <strong>Physical:</strong> Highest bidder at 72h close gets the physical sticker on the laptop.
          </div>

          {errorMsg && <p className="text-[12px] text-red-400 font-mono">{errorMsg}</p>}

          <button
            type="submit"
            disabled={isSubmitting || auctionClosed}
            className="w-full py-3 bg-[#c8f542] hover:bg-[#d6ff63] text-[#111] text-sm font-bold rounded transition disabled:opacity-50"
          >
            {isSubmitting ? 'Creating checkout…' : `Continue to payment (${format(parseFloat(bidAmount) || minRequired)}) →`}
          </button>
          <p className="text-center text-[10px] font-mono text-[#5c5c56]">Charged via Dodo Payments Checkout Sessions</p>
        </form>
      </div>
    </div>
  );
};
