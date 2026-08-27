'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCurrency } from '@/components/currency/CurrencyProvider';

function SuccessContent() {
  const searchParams = useSearchParams();
  const { format } = useCurrency();
  const bidId = searchParams.get('bidId');

  const [state, setState] = useState<'loading' | 'confirmed' | 'pending' | 'failed'>('loading');
  const [bid, setBid] = useState<{
    spotNumber: number;
    brandName: string;
    amount: number;
    status: string;
  } | null>(null);

  useEffect(() => {
    if (!bidId) {
      setState('failed');
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/bids/${bidId}`, { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok || !data.success || !data.bid) {
          if (!cancelled) setState('failed');
          return;
        }
        if (cancelled) return;
        setBid(data.bid);
        if (data.bid.status === 'CONFIRMED' || data.bid.status === 'WON') {
          setState('confirmed');
        } else if (data.bid.status === 'PENDING') {
          setState('pending');
        } else {
          setState('failed');
        }
      } catch {
        if (!cancelled) setState('failed');
      }
    };

    load();
    const interval = setInterval(load, 2500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [bidId]);

  return (
    <div className="min-h-screen bg-[#070707] text-[#f3f3ee] flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md text-center space-y-6">
        {state === 'loading' && (
          <>
            <p className="font-mono text-[12px] text-[#8a8a84] uppercase tracking-widest">Checking payment</p>
            <h1 className="text-3xl font-medium tracking-tight">Confirming your bid…</h1>
          </>
        )}

        {state === 'pending' && (
          <>
            <p className="font-mono text-[12px] text-[#c8f542] uppercase tracking-widest">Payment pending</p>
            <h1 className="text-3xl font-medium tracking-tight">Waiting for confirmation</h1>
            <p className="text-sm text-[#8a8a84]">
              We don&apos;t mark a bid live until Dodo confirms payment. This page will update automatically.
            </p>
          </>
        )}

        {state === 'failed' && (
          <>
            <p className="font-mono text-[12px] text-[#8a8a84] uppercase tracking-widest">Not confirmed</p>
            <h1 className="text-3xl font-medium tracking-tight">Bid not live yet</h1>
            <p className="text-sm text-[#8a8a84]">
              We couldn&apos;t verify this payment. If you were charged, wait a moment and refresh — logos only appear after a confirmed webhook.
            </p>
          </>
        )}

        {state === 'confirmed' && bid && (
          <>
            <p className="font-mono text-[12px] text-[#c8f542] uppercase tracking-widest">You&apos;re live</p>
            <h1 className="text-4xl font-medium tracking-tight">You&apos;re live.</h1>
            <p className="text-sm text-[#8a8a84]">
              {bid.brandName} is on Spot #{bid.spotNumber.toString().padStart(2, '0')} at {format(bid.amount)}.
            </p>
          </>
        )}

        <Link
          href="/#auction"
          className="inline-block mt-4 px-5 py-2.5 bg-[#c8f542] text-[#111] text-sm font-semibold"
        >
          View on the laptop →
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070707] text-[#8a8a84] flex items-center justify-center text-sm">Loading…</div>}>
      <SuccessContent />
    </Suspense>
  );
}
