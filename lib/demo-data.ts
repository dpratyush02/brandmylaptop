export interface DemoSpot {
  number: number;
  position: string;
  size: string;
  dimensions: string;
  startingPrice: number;
  currentBid: number;
  minBidIncrement: number;
  currentBidderName?: string;
  currentBrandName?: string;
  currentLogoUrl?: string;
  currentWebsite?: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'WON';
  bidCount: number;
  clicksCount?: number;
}

/** Starting prices (USD) and $1 minimum outbid increment. */
export const SPOT_CATALOG: Array<
  Pick<DemoSpot, 'number' | 'position' | 'size' | 'dimensions' | 'startingPrice' | 'minBidIncrement'>
> = [
  { number: 1, position: 'Top Left', size: 'Medium', dimensions: '8.0cm × 5.0cm', startingPrice: 1, minBidIncrement: 1 },
  { number: 2, position: 'Top Center', size: 'Large', dimensions: '9.5cm × 5.5cm', startingPrice: 10, minBidIncrement: 1 },
  { number: 3, position: 'Top Right', size: 'Large', dimensions: '9.5cm × 5.5cm', startingPrice: 30, minBidIncrement: 1 },
  { number: 4, position: 'Middle Left', size: 'Standard', dimensions: '7.0cm × 4.5cm', startingPrice: 20, minBidIncrement: 1 },
  { number: 5, position: 'Middle Right', size: 'Standard', dimensions: '7.0cm × 4.5cm', startingPrice: 20, minBidIncrement: 1 },
  { number: 6, position: 'Lower Left', size: 'Standard', dimensions: '7.5cm × 4.5cm', startingPrice: 25, minBidIncrement: 1 },
  { number: 7, position: 'Lower Center', size: 'Premium Wide', dimensions: '10.0cm × 5.0cm', startingPrice: 35, minBidIncrement: 1 },
  { number: 8, position: 'Lower Right', size: 'Standard', dimensions: '7.5cm × 4.5cm', startingPrice: 25, minBidIncrement: 1 },
  { number: 9, position: 'Bottom Left', size: 'Compact', dimensions: '6.5cm × 4.0cm', startingPrice: 15, minBidIncrement: 1 },
  { number: 10, position: 'Bottom Right', size: 'Compact', dimensions: '6.5cm × 4.0cm', startingPrice: 15, minBidIncrement: 1 },
];

export function buildEmptySpots(): DemoSpot[] {
  return SPOT_CATALOG.map((s) => ({
    ...s,
    currentBid: 0,
    status: 'AVAILABLE' as const,
    bidCount: 0,
    clicksCount: 0,
  }));
}

export const INITIAL_SPOTS: DemoSpot[] = buildEmptySpots();

/**
 * Percentage boxes mapped to the marked zones on /laptop/hp-space.jpeg.
 * Layout on the lid:
 *   01  02  03
 *   04  HP  05
 *   06      08
 *   09  07  10
 */
export const SPOT_BOXES: Record<number, { left: number; top: number; width: number; height: number }> = {
  1: { left: 13.52, top: 16.06, width: 23.44, height: 14.77 },
  2: { left: 39.14, top: 16.06, width: 22.27, height: 14.77 },
  3: { left: 63.59, top: 16.06, width: 22.50, height: 14.77 },
  4: { left: 13.52, top: 34.00, width: 27.34, height: 14.18 },
  5: { left: 58.70, top: 34.00, width: 27.39, height: 14.18 },
  6: { left: 13.52, top: 51.23, width: 27.34, height: 13.25 },
  8: { left: 58.70, top: 51.23, width: 27.39, height: 13.25 },
  9: { left: 13.52, top: 67.64, width: 22.55, height: 15.48 },
  7: { left: 39.14, top: 67.64, width: 22.27, height: 15.48 },
  10: { left: 63.59, top: 67.64, width: 22.50, height: 15.48 },
};
