import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useHabits } from '../store/HabitContext';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { RangeSelector } from '../components/navigation/RangeSelector';
import { RangeGrid } from '../components/range/RangeGrid';
import { SettingsPanel } from '../components/settings/SettingsPanel';
import { ChartLegend } from '../components/chart/ChartLegend';
import { cycleValue } from '../components/chart/utils/colors';
import type { MonthData } from '../types/habit';
import { findOrCreateSpreadsheet } from '../services/driveService';
import { readMonthData } from '../services/sheetsService';

export function RangePage() {
  const { currentMonth, currentYear, folderId, updateCell } = useHabits();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fromMonth, setFromMonth] = useState(Math.max(1, currentMonth - 2));
  const [fromYear, setFromYear] = useState(currentYear);
  const [toMonth, setToMonth] = useState(currentMonth);
  const [toYear, setToYear] = useState(currentYear);
  const [rangeData, setRangeData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!folderId) return;
    
    let cancelled = false;
    const currentFolderId = folderId; // Capture for closure
    
    async function loadRange() {
      setLoading(true);

      const months: MonthData[] = [];
      let y = fromYear;
      let m = fromMonth;

      while (y < toYear || (y === toYear && m <= toMonth)) {
        const ssId = await findOrCreateSpreadsheet(currentFolderId, y);
        const data = await readMonthData(ssId, y, m);
        months.push(data);

        m++;
        if (m > 12) {
          m = 1;
          y++;
        }
      }

      if (!cancelled) {
        setRangeData(months);
        setLoading(false);
      }
    }
    
    loadRange();
    
    return () => {
      cancelled = true;
    };
  }, [folderId, fromMonth, fromYear, toMonth, toYear]);

  const handleCellClick = (_monthIndex: number, day: number, habitIndex: number) => {
    const data = rangeData[_monthIndex];
    if (!data) return;
    const currentValue = data.days[day - 1]?.values[habitIndex] ?? null;
    updateCell(day, habitIndex, cycleValue(currentValue));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onSettingsClick={() => setSettingsOpen(true)} />
      <PageContainer>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <Link
            to="/"
            className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            &larr; Dashboard
          </Link>
          <RangeSelector
            fromMonth={fromMonth}
            fromYear={fromYear}
            toMonth={toMonth}
            toYear={toYear}
            onFromChange={(m, y) => { setFromMonth(m); setFromYear(y); }}
            onToChange={(m, y) => { setToMonth(m); setToYear(y); }}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-gray-300 border-t-green-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <RangeGrid months={rangeData} onCellClick={handleCellClick} />
            {rangeData.length > 0 && <ChartLegend />}
          </>
        )}
      </PageContainer>

      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
