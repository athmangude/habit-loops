import { MonthYearPicker } from './MonthYearPicker';

interface RangeSelectorProps {
  fromMonth: number;
  fromYear: number;
  toMonth: number;
  toYear: number;
  onFromChange: (month: number, year: number) => void;
  onToChange: (month: number, year: number) => void;
}

export function RangeSelector({
  fromMonth, fromYear, toMonth, toYear,
  onFromChange, onToChange,
}: RangeSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-gray-500">From:</span>
      <MonthYearPicker month={fromMonth} year={fromYear} onChange={onFromChange} />
      <span className="text-sm text-gray-500">To:</span>
      <MonthYearPicker month={toMonth} year={toYear} onChange={onToChange} />
    </div>
  );
}
