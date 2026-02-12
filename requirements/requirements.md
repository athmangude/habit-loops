# Technical Requirements: HabitLoops Web App

## 1. Project Overview

HabitLoops is a digital habit tracker inspired by polar charts. Users track habits in concentric circles where each ring is a habit and each segment is a day. The app is a "No-Backend" architecture, utilizing Google Drive/Sheets as the database and Google OAuth for authentication.

## 2. Core Tech Stack

* **Frontend:** React (preferred) or Vanilla JS/Tailwind CSS.

* **Charts:** SVG-based custom polar coordinate rendering (270-degree arc).

* **Authentication:** Google Identity Services (GIS) for OAuth2.

* **Database:** Google Sheets API v4 & Google Drive API v3.

## 3. Authentication & Data Privacy

* **Client-Side Only:** No external backend. All logic resides in the browser.

* **Scopes:** `https://www.googleapis.com/auth/drive.file` and `https://www.googleapis.com/auth/spreadsheets`.

* **Flow:** 1. User logs in via Google.
  2. App checks for a folder named `HabitLoops` in the user’s root Drive.
  3. If not found, create it.
  4. Inside `HabitLoops`, look for/create a spreadsheet for the current year (e.g., `HabitLoops_2026`).

## 4. Data Schema (Google Sheets)

Data is organized to handle month-specific habit lists and high-performance range retrieval.

* **Files:** One spreadsheet file per Year (e.g., `HabitLoops_2026.xlsx`).

* **Sheets (Tabs):** One sheet per Month (e.g., "January", "February").

* **Columns:**

  * `Day` (Integer 1-31).

  * Habit Names as subsequent headers (e.g., `Workout`, `Meditate`). Note: Habits can vary month-to-month based on the sheet's headers.

* **Rows:** One row per calendar day of that specific month.

* **Cell Values:** Integers 0 through 4 (representing the 5 states).

## 5. The "Habit Loop" Chart Logic

### Geometry

* **270-Degree Arc:** The habit segments occupy a 270-degree (3/4) arc of the circle.

* **Label Area:** The remaining 90-degree (1/4) opening is reserved for habit labels (text) aligned with their respective rings.

* **Radial Segments:** Total segments = number of days in the selected month (28-31).

* **Concentric Rings:** Inner-most ring is the first habit in the sheet; outer-most is the last.

* **Interactive Cells:** Each segment-ring intersection is a clickable SVG `<path>`.

### State & Color Gradient (5-Point Scale)

1. **Excellent (Value 4):** Green (`#22c55e`)

2. **Good (Value 3):** 50/50 mix of Green and Yellow (`#86efac`)

3. **Average (Value 2):** Yellow (`#eab308`)

4. **Fair (Value 1):** 50/50 mix of Yellow and Red (`#f97316`)

5. **Poor (Value 0):** Red (`#ef4444`)
   *Empty: Light Grey/Transparent.*

## 6. Functional Requirements

### Management

* **Habit Config:** Settings panel to add/remove/reorder habit rings for the *current* month. Adding a habit adds a column to the current month's sheet.

* **Navigation:** Month/Year picker. Changing the year requires switching the active Google Spreadsheet file.

* **Range View:** Ability to select a range (e.g., Jan - March). Render multiple 270-degree Loop charts in a responsive grid.

### Interaction

* **Click-to-Toggle:** Clicking a segment cycles through states or opens a selector.

* **Optimistic Updates:** Update UI immediately and sync to Google Sheets in the background with a "Syncing..." status.

## 7. UI/UX Requirements

* **Responsive SVG:** Scale based on container width.

* **Minimalist Theme:** Focus on the vibrant colors of the progress segments.

* **Auth Guard:** Require login before showing any tracking data.

## 8. Implementation Milestones

1. **Auth & Drive Init:** Google Login and `HabitLoops` folder/year-file verification.

2. **Monthly Sheet Logic:** Logic to generate a new tab for a month if it doesn't exist, initializing rows for the correct number of days.

3. **270-Degree SVG Generator:** Calculate polar coordinates for the 3/4 circle and the 1/4 label gap.

4. **Data Sync:** Bind SVG click events to Google Sheets cell updates.

5. **Range Rendering:** Support fetching data across multiple tabs (months) for the grid view.