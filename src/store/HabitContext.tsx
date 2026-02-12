import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { CellValue, MonthData, HabitState, HabitActions } from '../types/habit';
import { findOrCreateFolder, findOrCreateSpreadsheet } from '../services/driveService';
import { readMonthData, addHabitColumn, removeHabitColumn, renameHabitColumn, reorderHabitColumns } from '../services/sheetsService';
import { syncQueue } from '../services/syncQueue';
import { useAuth } from './AuthContext';

type HabitContextValue = HabitState & HabitActions;

const HabitContext = createContext<HabitContextValue | null>(null);

const dataCache = new Map<string, MonthData>();

export function HabitProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [monthData, setMonthData] = useState<MonthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [folderId, setFolderId] = useState<string | null>(null);

  const loadData = useCallback(async (month: number, year: number, ssId?: string) => {
    const sid = ssId || spreadsheetId;
    if (!sid) return;

    const cacheKey = `${year}-${month}`;
    const cached = dataCache.get(cacheKey);
    if (cached) {
      setMonthData(cached);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await readMonthData(sid, year, month);
      dataCache.set(cacheKey, data);
      setMonthData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [spreadsheetId]);

  // Initialize Drive on auth
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    async function init() {
      setLoading(true);
      try {
        const fId = await findOrCreateFolder();
        if (cancelled) return;
        setFolderId(fId);

        const ssId = await findOrCreateSpreadsheet(fId, currentYear);
        if (cancelled) return;
        setSpreadsheetId(ssId);

        await loadData(currentMonth, currentYear, ssId);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to initialize');
          setLoading(false);
        }
      }
    }

    init();
    return () => { cancelled = true; };
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update sync queue context
  useEffect(() => {
    if (spreadsheetId) {
      syncQueue.setContext(spreadsheetId, currentMonth);
    }
  }, [spreadsheetId, currentMonth]);

  const setMonth = useCallback(async (month: number, year: number) => {
    setCurrentMonth(month);
    setCurrentYear(year);

    if (!folderId) return;

    let ssId = spreadsheetId;
    if (year !== currentYear || !ssId) {
      ssId = await findOrCreateSpreadsheet(folderId, year);
      setSpreadsheetId(ssId);
    }

    await loadData(month, year, ssId!);
  }, [folderId, spreadsheetId, currentYear, loadData]);

  const updateCell = useCallback((day: number, habitIndex: number, value: CellValue) => {
    // Optimistic update
    setMonthData(prev => {
      if (!prev) return prev;
      const newDays = prev.days.map(d => {
        if (d.day !== day) return d;
        const newValues = [...d.values];
        newValues[habitIndex] = value;
        return { ...d, values: newValues };
      });
      const newData = { ...prev, days: newDays };
      dataCache.set(`${prev.year}-${prev.month}`, newData);
      return newData;
    });

    syncQueue.enqueue(day, habitIndex, value);
  }, []);

  const addHabit = useCallback(async (name: string) => {
    if (!spreadsheetId) return;
    setLoading(true);
    try {
      await addHabitColumn(spreadsheetId, currentMonth, name, currentYear);
      dataCache.delete(`${currentYear}-${currentMonth}`);
      await loadData(currentMonth, currentYear);
    } finally {
      setLoading(false);
    }
  }, [spreadsheetId, currentMonth, currentYear, loadData]);

  const removeHabit = useCallback(async (habitIndex: number) => {
    if (!spreadsheetId) return;
    setLoading(true);
    try {
      await removeHabitColumn(spreadsheetId, currentMonth, habitIndex, currentYear);
      dataCache.delete(`${currentYear}-${currentMonth}`);
      await loadData(currentMonth, currentYear);
    } finally {
      setLoading(false);
    }
  }, [spreadsheetId, currentMonth, currentYear, loadData]);

  const renameHabit = useCallback(async (habitIndex: number, newName: string) => {
    if (!spreadsheetId) return;
    // Optimistic update
    setMonthData(prev => {
      if (!prev) return prev;
      const newHabits = [...prev.habits];
      newHabits[habitIndex] = newName;
      const newData = { ...prev, habits: newHabits };
      dataCache.set(`${prev.year}-${prev.month}`, newData);
      return newData;
    });
    try {
      await renameHabitColumn(spreadsheetId, currentMonth, habitIndex, newName);
    } catch {
      // Revert on failure
      dataCache.delete(`${currentYear}-${currentMonth}`);
      await loadData(currentMonth, currentYear);
    }
  }, [spreadsheetId, currentMonth, currentYear, loadData]);

  const reorderHabits = useCallback(async (oldIndex: number, newIndex: number) => {
    if (!spreadsheetId) return;
    setLoading(true);
    try {
      await reorderHabitColumns(spreadsheetId, currentMonth, oldIndex, newIndex, currentYear);
      dataCache.delete(`${currentYear}-${currentMonth}`);
      await loadData(currentMonth, currentYear);
    } finally {
      setLoading(false);
    }
  }, [spreadsheetId, currentMonth, currentYear, loadData]);

  const refreshData = useCallback(async () => {
    dataCache.delete(`${currentYear}-${currentMonth}`);
    await loadData(currentMonth, currentYear);
  }, [currentYear, currentMonth, loadData]);

  return (
    <HabitContext.Provider
      value={{
        currentMonth, currentYear, monthData, loading, error,
        spreadsheetId, folderId,
        setMonth, updateCell, addHabit, removeHabit, renameHabit, reorderHabits, refreshData,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
}

export function useHabits() {
  const context = useContext(HabitContext);
  if (!context) throw new Error('useHabits must be used within HabitProvider');
  return context;
}
