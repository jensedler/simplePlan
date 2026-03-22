export const MONTH_NAMES = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
                             'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

export const MONTH_NAMES_LONG = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

/** Linear month index: Jan 2000 = 24000, Feb 2000 = 24001, ... */
export function monthIndex(year: number, month: number): number {
  return year * 12 + (month - 1);
}

export function fromMonthIndex(idx: number): { year: number; month: number } {
  const month = (idx % 12) + 1;
  const year = Math.floor(idx / 12);
  return { year, month };
}

export function quarterOf(month: number): number {
  return Math.ceil(month / 3);
}

export function quarterLabel(year: number, month: number): string {
  return `Q${quarterOf(month)} ${year}`;
}

/** Format a month/year for display */
export function formatMonth(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/** Duration in months (inclusive both ends) */
export function spanMonths(
  startYear: number, startMonth: number,
  endYear: number, endMonth: number,
): number {
  return monthIndex(endYear, endMonth) - monthIndex(startYear, startMonth) + 1;
}

/** Clamp a month index to a valid range */
export function clampMonthIdx(idx: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, idx));
}

/** Add N months to a year/month pair */
export function addMonths(year: number, month: number, n: number): { year: number; month: number } {
  return fromMonthIndex(monthIndex(year, month) + n);
}
