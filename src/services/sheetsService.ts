import type { CellValue, MonthData, HabitDay } from '../types/habit';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export async function ensureMonthTab(
  spreadsheetId: string,
  month: number,
): Promise<void> {
  const sheetName = MONTH_NAMES[month];

  try {
    const spreadsheet = await gapi.client.sheets.spreadsheets.get({
      spreadsheetId,
    }) as { result: { sheets?: Array<{ properties: { title: string } }> } };

    const sheets = spreadsheet.result.sheets || [];
    const exists = sheets.some(
      (s) => s.properties.title === sheetName,
    );

    if (!exists) {
      await gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: [
            {
              addSheet: {
                properties: { title: sheetName },
              },
            },
          ],
        },
      } as unknown);

      // Add header row with just "Day"
      await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${sheetName}'!A1`,
        valueInputOption: 'RAW',
        resource: {
          values: [['Day']],
        },
      } as unknown);
    }
  } catch {
    // If get fails, the spreadsheet might not have any sheets yet
  }
}

export async function readMonthData(
  spreadsheetId: string,
  year: number,
  month: number,
): Promise<MonthData> {
  const sheetName = MONTH_NAMES[month];
  await ensureMonthTab(spreadsheetId, month);

  const daysInMonth = getDaysInMonth(year, month);

  try {
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetName}'!A1:ZZ${daysInMonth + 1}`,
    });

    const rows = response.result.values || [['Day']];
    const headers = rows[0] || ['Day'];
    const habits = headers.slice(1); // Everything after "Day"

    const days: HabitDay[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const row = rows[d]; // Row index d corresponds to day d (row 0 is headers)
      const values: CellValue[] = habits.map((_, i) => {
        if (!row || !row[i + 1] || row[i + 1] === '') return null;
        const num = parseInt(row[i + 1], 10);
        if (num >= 0 && num <= 4) return num as CellValue;
        return null;
      });
      days.push({ day: d, values });
    }

    return { year, month, habits, days };
  } catch {
    return { year, month, habits: [], days: Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, values: [] })) };
  }
}

export async function writeCell(
  spreadsheetId: string,
  month: number,
  day: number,
  habitIndex: number,
  value: CellValue,
): Promise<void> {
  const sheetName = MONTH_NAMES[month];
  const col = String.fromCharCode(66 + habitIndex); // B=0, C=1, etc.
  const row = day + 1; // Row 1 is headers, row 2 = day 1
  const range = `'${sheetName}'!${col}${row}`;

  await gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    resource: {
      values: [[value === null ? '' : value.toString()]],
    },
  } as unknown);
}

export async function batchWriteCells(
  spreadsheetId: string,
  month: number,
  updates: Array<{ day: number; habitIndex: number; value: CellValue }>,
): Promise<void> {
  const sheetName = MONTH_NAMES[month];

  const data = updates.map(({ day, habitIndex, value }) => {
    const col = String.fromCharCode(66 + habitIndex);
    const row = day + 1;
    return {
      range: `'${sheetName}'!${col}${row}`,
      values: [[value === null ? '' : value.toString()]],
    };
  });

  await gapi.client.sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    resource: {
      valueInputOption: 'RAW',
      data,
    },
  } as unknown);
}

export async function addHabitColumn(
  spreadsheetId: string,
  month: number,
  habitName: string,
  year: number,
): Promise<void> {
  const sheetName = MONTH_NAMES[month];
  await ensureMonthTab(spreadsheetId, month);

  // Read current headers
  const response = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetName}'!1:1`,
  });
  const headers = response.result.values?.[0] || ['Day'];
  const newCol = String.fromCharCode(65 + headers.length); // Next column

  // Write new header
  await gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${sheetName}'!${newCol}1`,
    valueInputOption: 'RAW',
    resource: {
      values: [[habitName]],
    },
  } as unknown);

  // Fill empty cells for existing days
  const daysInMonth = getDaysInMonth(year, month);
  const emptyValues = Array.from({ length: daysInMonth }, () => ['']);
  await gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${sheetName}'!${newCol}2:${newCol}${daysInMonth + 1}`,
    valueInputOption: 'RAW',
    resource: { values: emptyValues },
  } as unknown);
}

export async function removeHabitColumn(
  spreadsheetId: string,
  month: number,
  habitIndex: number,
  year: number,
): Promise<void> {
  const sheetName = MONTH_NAMES[month];

  // Get sheet ID
  const spreadsheet = await gapi.client.sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties',
  }) as { result: { sheets: Array<{ properties: { sheetId: number; title: string } }> } };

  const sheet = spreadsheet.result.sheets.find(
    (s) => s.properties.title === sheetName,
  );
  if (!sheet) return;

  const colIndex = habitIndex + 1; // +1 because column A is "Day"

  await gapi.client.sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    resource: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheet.properties.sheetId,
              dimension: 'COLUMNS',
              startIndex: colIndex,
              endIndex: colIndex + 1,
            },
          },
        },
      ],
    },
  } as unknown);

  void year; // used by caller context
}

export async function reorderHabitColumns(
  spreadsheetId: string,
  month: number,
  oldIndex: number,
  newIndex: number,
  year: number,
): Promise<void> {
  const sheetName = MONTH_NAMES[month];

  // Read all data
  const daysInMonth = getDaysInMonth(year, month);
  const response = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetName}'!A1:ZZ${daysInMonth + 1}`,
  });

  const rows = response.result.values || [['Day']];

  // Reorder columns in each row
  const reordered = rows.map((row) => {
    const dayCol = row[0];
    const habitCols = row.slice(1);
    const [moved] = habitCols.splice(oldIndex, 1);
    habitCols.splice(newIndex, 0, moved || '');
    return [dayCol, ...habitCols];
  });

  // Write back
  await gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${sheetName}'!A1:ZZ${daysInMonth + 1}`,
    valueInputOption: 'RAW',
    resource: { values: reordered },
  } as unknown);
}
