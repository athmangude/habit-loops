export type CellValue = 0 | 1 | 2 | 3 | 4 | null;

export interface HabitDay {
  day: number;
  values: CellValue[];
}

export interface MonthData {
  year: number;
  month: number; // 1-12
  habits: string[];
  days: HabitDay[];
}

export interface HabitState {
  currentMonth: number; // 1-12
  currentYear: number;
  monthData: MonthData | null;
  loading: boolean;
  error: string | null;
  spreadsheetId: string | null;
  folderId: string | null;
}

export interface HabitActions {
  setMonth: (month: number, year: number) => void;
  updateCell: (day: number, habitIndex: number, value: CellValue) => void;
  addHabit: (name: string) => Promise<void>;
  removeHabit: (habitIndex: number) => Promise<void>;
  reorderHabits: (oldIndex: number, newIndex: number) => Promise<void>;
  refreshData: () => Promise<void>;
}
