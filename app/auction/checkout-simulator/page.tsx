'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { formatMoney } from '@/lib/currency';
import { ShieldCheck, Lock, Laptop, AlertCircle } from 'lucide-react';

function SimulatorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const bidId = searchParams.get('bidId');
  const spotNumber = searchParams.get('spotNumber');
  const amount = searchParams.get('amount');
  const brand = searchParams.get('brand');
  const email = searchParams.get('email');
  const sessionId = searchParams.get('sessionId');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSimulateSuccess = async () => {
    if (!bidId) {
      setError('Missing bid identifier.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/bids/simulate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bidId,
          simulateSuccess: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to simulate payment confirmation');
      }

      router.push(`/auction/success?bidId=${bidId}&spotNumber=${spotNumber}&amount=${amount}&brand=${encodeURIComponent(brand || '')}`);
    } catch (err: any) {
      setError(err.message || 'Payment simulation error');
      setLoading(false);
    }
  };

  const handleSimulateCancel = async () => {
    if (bidId) {
      await fetch('/api/bids/simulate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bidId, simulateSuccess: false }),
      });
    }
    router.push('/#auction');
  };

  return (
    <div className="min-h-screen bg-black text-zinc-200 flex flex-col justify-center items-center p-4 sm:p-6">
      
      {/* Dev Simulator Notice */}
      <div className="w-full max-w-md mb-4 p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs text-center font-mono">
        <strong>Dodo Payments Test Checkout Session</strong>
      </div>

      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white">
              <Laptop className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                Dodo Payments Checkout
              </h3>
              <p className="text-[10px] font-mono text-zinc-500">
                Session: {sessionId?.substring(0, 16)}...
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono font-bold text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
            TEST MODE
          </span>
        </div>

        {/* Order Summary */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Item:</span>
            <span className="font-bold text-white">
              Spot #{spotNumber?.padStart(2, '0')} Lid Advertising Bid
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Brand:</span>
            <span className="font-semibold text-zinc-200">
              {brand}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Email:</span>
            <span className="font-mono text-zinc-400">
              {email}
            </span>
          </div>

          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-300">Total Amount:</span>
            <span className="font-mono text-xl font-bold text-white">
              {formatMoney(parseFloat(amount || '0'))}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-zinc-900 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={handleSimulateSuccess}
            disabled={loading}
            className="w-full py-3.5 px-5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-sm flex items-center justify-center gap-2 shadow active:scale-[0.98] transition disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Processing Webhook...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Authorize & Complete Bid Payment →
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={handleSimulateCancel}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-medium text-xs border border-zinc-800 transition"
          >
            Cancel & Return to Auction
          </button>
        </div>

        <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-500 font-mono">
          <Lock className="w-3 h-3" />
          <span>Simulated Dodo Payments 256-bit Encrypted Session</span>
        </div>

      </div>
    </div>
  );
}

export default function CheckoutSimulatorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center font-mono text-xs">Loading checkout session...</div>}>
      <SimulatorContent />
    </Suspense>
  );
}
