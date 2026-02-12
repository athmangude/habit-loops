import type { MonthData } from '../../types/habit';
import { PolarChart } from '../chart/PolarChart';

interface RangeGridProps {
  months: MonthData[];
  onCellClick: (monthIndex: number, day: number, habitIndex: number) => void;
}

export function RangeGrid({ months, onCellClick }: RangeGridProps) {
  if (months.length === 0) {
    return (
      <p className="text-center text-gray-400 py-8">
        Select a date range to view charts
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {months.map((data, i) => (
        <div key={`${data.year}-${data.month}`} className="bg-white rounded-xl border border-gray-200 p-4">
          <PolarChart
            data={data}
            onCellClick={(day, habitIndex) => onCellClick(i, day, habitIndex)}
            showLegend={false}
            compact
          />
        </div>
      ))}
    </div>
  );
}
