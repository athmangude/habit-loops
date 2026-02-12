export const ARC_START_DEG = 270; // 12 o'clock in SVG coords
export const ARC_SWEEP_DEG = 270; // 270 degrees clockwise
export const TOTAL_DAYS = 31; // always 31 segments for consistent layout

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number,
): { x: number; y: number } {
  const rad = degToRad(angleDeg);
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

export function computeArcPath(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
): string {
  const outerStart = polarToCartesian(cx, cy, outerRadius, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerRadius, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerRadius, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerRadius, startAngle);

  // Angular span of this segment
  let sweep = endAngle - startAngle;
  if (sweep < 0) sweep += 360;
  const largeArc = sweep > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    // Outer arc: clockwise (sweep-flag = 1)
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    // Radial line inward at end angle
    `L ${innerEnd.x} ${innerEnd.y}`,
    // Inner arc: counter-clockwise (sweep-flag = 0), same angular span
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

export interface CellPath {
  day: number;
  habitIndex: number;
  path: string;
}

export function computeChartPaths(
  cx: number,
  cy: number,
  innerRadius: number,
  ringWidth: number,
  ringGap: number,
  days: number,
  habitCount: number,
): CellPath[] {
  if (habitCount === 0 || days === 0) return [];

  const segmentAngle = ARC_SWEEP_DEG / days;
  const cellGap = 0.5;
  const paths: CellPath[] = [];

  for (let h = 0; h < habitCount; h++) {
    const rInner = innerRadius + h * (ringWidth + ringGap);
    const rOuter = rInner + ringWidth;

    for (let d = 0; d < days; d++) {
      const startAngle = ARC_START_DEG + d * segmentAngle + cellGap / 2;
      const endAngle = ARC_START_DEG + (d + 1) * segmentAngle - cellGap / 2;

      paths.push({
        day: d + 1,
        habitIndex: h,
        path: computeArcPath(cx, cy, rInner, rOuter, startAngle, endAngle),
      });
    }
  }

  return paths;
}

export function computeLabelPositions(
  cx: number,
  cy: number,
  innerRadius: number,
  ringWidth: number,
  ringGap: number,
  habits: string[],
): Array<{ x: number; y: number; text: string }> {
  // Place labels in the 90-degree gap, hugging the edge of day 1.
  // Day 1 starts at ARC_START_DEG (270° = 12 o'clock). Position labels just
  // inside the gap from that edge, with textAnchor="end" so text extends left.
  const labelAngle = 260; // just into the gap from day 1's edge

  return habits.map((text, i) => {
    const r = innerRadius + i * (ringWidth + ringGap) + ringWidth / 2;
    const pos = polarToCartesian(cx, cy, r, labelAngle);
    return { x: pos.x - 4, y: pos.y, text };
  });
}

export function computeDayLabelPositions(
  cx: number,
  cy: number,
  outerRadius: number,
): Array<{ x: number; y: number; day: number; angle: number }> {
  const segmentAngle = ARC_SWEEP_DEG / TOTAL_DAYS;
  const labelRadius = outerRadius + 14;

  return Array.from({ length: TOTAL_DAYS }, (_, d) => {
    const angle = ARC_START_DEG + (d + 0.5) * segmentAngle;
    const pos = polarToCartesian(cx, cy, labelRadius, angle);
    return { x: pos.x, y: pos.y, day: d + 1, angle };
  });
}

export function computeDayOfWeekLabelPositions(
  cx: number,
  cy: number,
  innerRadius: number,
  month: number,
  year: number,
): Array<{ x: number; y: number; letter: string; day: number; angle: number }> {
  const segmentAngle = ARC_SWEEP_DEG / TOTAL_DAYS;
  const labelRadius = innerRadius - 10;
  const dayLetters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return Array.from({ length: TOTAL_DAYS }, (_, d) => {
    const angle = ARC_START_DEG + (d + 0.5) * segmentAngle;
    const pos = polarToCartesian(cx, cy, labelRadius, angle);
    // Get day-of-week: 0=Sunday through 6=Saturday
    const dow = new Date(year, month - 1, d + 1).getDay();
    return { x: pos.x, y: pos.y, letter: dayLetters[dow], day: d + 1, angle };
  });
}

export function computeChartDimensions(
  size: number,
  habitCount: number,
) {
  const cx = size / 2;
  const cy = size / 2;
  const innerRadius = 60;
  const maxOuterRadius = size / 2 - 25; // margin for day labels
  const totalRingSpace = maxOuterRadius - innerRadius;
  const ringGap = habitCount > 1 ? 2 : 0;
  const totalGaps = (habitCount - 1) * ringGap;
  const ringWidth = habitCount > 0
    ? Math.min(30, (totalRingSpace - totalGaps) / habitCount)
    : 30;
  const outerRadius = innerRadius + habitCount * ringWidth + (habitCount - 1) * ringGap;

  return { cx, cy, innerRadius, ringWidth, ringGap, outerRadius };
}
