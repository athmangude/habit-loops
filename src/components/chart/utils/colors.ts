import type { CellValue } from '../../../types/habit';

const COLOR_MAP: Record<number, string> = {
  0: '#ef4444', // red
  1: '#f97316', // orange
  2: '#eab308', // yellow
  3: '#86efac', // light green
  4: '#22c55e', // green
};

const EMPTY_COLOR = '#e5e7eb'; // gray-200

export function getCellColor(value: CellValue): string {
  if (value === null || value === undefined) return EMPTY_COLOR;
  return COLOR_MAP[value] || EMPTY_COLOR;
}

export function getHoverColor(value: CellValue): string {
  if (value === null || value === undefined) return '#d1d5db'; // gray-300
  // Slightly darker version
  const darkerMap: Record<number, string> = {
    0: '#dc2626',
    1: '#ea580c',
    2: '#ca8a04',
    3: '#4ade80',
    4: '#16a34a',
  };
  return darkerMap[value] || '#d1d5db';
}

export function cycleValue(current: CellValue): CellValue {
  if (current === null) return 0;
  if (current === 4) return null;
  return (current + 1) as CellValue;
}

export const LEGEND_ITEMS = [
  { value: null as CellValue, label: 'Not tracked', color: EMPTY_COLOR },
  { value: 0 as CellValue, label: 'Not done', color: COLOR_MAP[0] },
  { value: 1 as CellValue, label: 'Poor', color: COLOR_MAP[1] },
  { value: 2 as CellValue, label: 'Fair', color: COLOR_MAP[2] },
  { value: 3 as CellValue, label: 'Good', color: COLOR_MAP[3] },
  { value: 4 as CellValue, label: 'Great', color: COLOR_MAP[4] },
];
