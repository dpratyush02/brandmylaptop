export type CurrencyCode = 'USD';

export const SITE_CURRENCY: CurrencyCode = 'USD';

export function formatMoney(amountUsd: number): string {
  const value = Math.round(Number.isFinite(amountUsd) ? amountUsd : 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDisplayAmount(displayAmount: number): string {
  return formatMoney(displayAmount);
}

export function minNextBid(spot: { currentBid: number; startingPrice: number; minBidIncrement?: number }): number {
  if (spot.currentBid > 0) return spot.currentBid + (spot.minBidIncrement ?? 1);
  return spot.startingPrice;
}
