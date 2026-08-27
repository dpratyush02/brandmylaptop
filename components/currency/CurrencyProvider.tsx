'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { formatMoney, minNextBid } from '@/lib/currency';

interface CurrencyContextValue {
  currency: 'USD';
  format: (amountUsd: number) => string;
  formatDisplay: (displayAmount: number) => string;
  minBid: (amountUsd: number) => number;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency: 'USD',
      format: (amountUsd: number) => formatMoney(amountUsd),
      formatDisplay: (displayAmount: number) => formatMoney(displayAmount),
      minBid: (amountUsd: number) => Math.round(amountUsd),
    }),
    []
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return ctx;
}

export { minNextBid };
