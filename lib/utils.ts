import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { formatMoney } from './currency';

export function formatINR(amount: number): string {
  return formatMoney(amount);
}

export function formatTimeRemaining(endTime: Date | string): {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalHours: number;
  isExpired: boolean;
  formatted: string;
} {
  const end = new Date(endTime).getTime();
  const now = Date.now();
  const totalMs = Math.max(0, end - now);
  const isExpired = totalMs <= 0;

  const seconds = Math.floor((totalMs / 1000) % 60);
  const minutes = Math.floor((totalMs / 1000 / 60) % 60);
  const hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24);
  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));

  const pad = (n: number) => n.toString().padStart(2, '0');
  const totalHours = days * 24 + hours;
  const clock = `${totalHours}:${pad(minutes)}:${pad(seconds)}`;
  const formatted = isExpired
    ? '00:00:00'
    : clock;

  return { totalMs, days, hours, minutes, seconds, totalHours, isExpired, formatted };
}
