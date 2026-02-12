import { useMemo } from 'react';
import type { MonthData } from '../../types/habit';
import { cycleValue } from './utils/colors';
import {
  computeChartPaths,
  computeChartDimensions,
  computeLabelPositions,
  computeDayLabelPositions,
} from './utils/geometry';
import { ArcSegment } from './ArcSegment';
import { HabitLabels } from './HabitLabels';
import { DayLabels } from './DayLabels';
import { ChartLegend } from './ChartLegend';

const CHART_SIZE = 500;

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface PolarChartProps {
  data: MonthData;
  onCellClick: (day: number, habitIndex: number) => void;
  showLegend?: boolean;
  compact?: boolean;
}

export function PolarChart({ data, onCellClick, showLegend = true, compact = false }: PolarChartProps) {
  const { habits, days } = data;
  const habitCount = habits.length;
  const dayCount = days.length;

  const dims = useMemo(
    () => computeChartDimensions(CHART_SIZE, habitCount),
    [habitCount],
  );

  const cellPaths = useMemo(
    () => computeChartPaths(dims.cx, dims.cy, dims.innerRadius, dims.ringWidth, dims.ringGap, dayCount, habitCount),
    [dims, dayCount, habitCount],
  );

  const habitLabels = useMemo(
    () => computeLabelPositions(dims.cx, dims.cy, dims.innerRadius, dims.ringWidth, dims.ringGap, habits),
    [dims, habits],
  );

  const dayLabels = useMemo(
    () => computeDayLabelPositions(dims.cx, dims.cy, dims.outerRadius, dayCount),
    [dims, dayCount],
  );

  if (habitCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <svg viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`} className="w-full max-w-md">
          <circle cx={dims.cx} cy={dims.cy} r={80} fill="none" stroke="#e5e7eb" strokeWidth={2} strokeDasharray="8 4" />
          <text x={dims.cx} y={dims.cy} textAnchor="middle" dominantBaseline="middle" fontSize={14} fill="#9ca3af">
            No habits yet
          </text>
        </svg>
        <p className="mt-2 text-sm">Add habits in settings to start tracking</p>
      </div>
    );
  }

  return (
    <div className={compact ? '' : 'flex flex-col items-center'}>
      <svg
        viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}
        className={compact ? 'w-full' : 'w-full max-w-lg'}
      >
        {/* Center text */}
        <text
          x={dims.cx}
          y={dims.cy - 8}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={compact ? 12 : 16}
          fontWeight="bold"
          fill="#111827"
        >
          {MONTH_NAMES[data.month]}
        </text>
        <text
          x={dims.cx}
          y={dims.cy + 12}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={compact ? 10 : 13}
          fill="#6b7280"
        >
          {data.year}
        </text>

        {/* Arc segments */}
        {cellPaths.map((cell) => {
          const dayData = days[cell.day - 1];
          const value = dayData?.values[cell.habitIndex] ?? null;
          return (
            <ArcSegment
              key={`${cell.day}-${cell.habitIndex}`}
              path={cell.path}
              value={value}
              day={cell.day}
              habitName={habits[cell.habitIndex]}
              onClick={() => onCellClick(cell.day, cell.habitIndex)}
            />
          );
        })}

        {/* Labels */}
        {!compact && <HabitLabels labels={habitLabels} />}
        {!compact && <DayLabels labels={dayLabels} />}
      </svg>

      {showLegend && !compact && <ChartLegend />}
    </div>
  );
}

export { cycleValue };
