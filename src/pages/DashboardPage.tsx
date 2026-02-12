import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useHabits } from '../store/HabitContext';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { PolarChart, cycleValue } from '../components/chart/PolarChart';
import { MonthYearPicker } from '../components/navigation/MonthYearPicker';
import { SettingsPanel } from '../components/settings/SettingsPanel';

export function DashboardPage() {
  const { monthData, currentMonth, currentYear, setMonth, updateCell, renameHabit, loading, error } = useHabits();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleCellClick = (day: number, habitIndex: number) => {
    if (!monthData) return;
    const currentValue = monthData.days[day - 1]?.values[habitIndex] ?? null;
    updateCell(day, habitIndex, cycleValue(currentValue));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onSettingsClick={() => setSettingsOpen(true)} />
      <PageContainer>
        <div className="flex items-center justify-between mb-6">
          <MonthYearPicker
            month={currentMonth}
            year={currentYear}
            onChange={setMonth}
          />
          <Link
            to="/range"
            className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            Range view
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && !monthData ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-gray-300 border-t-green-500 rounded-full animate-spin" />
          </div>
        ) : monthData ? (
          <PolarChart data={monthData} onCellClick={handleCellClick} onRenameHabit={renameHabit} />
        ) : null}
      </PageContainer>

      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
