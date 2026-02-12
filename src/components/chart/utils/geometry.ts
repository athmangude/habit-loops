export const ARC_START_DEG = 270; // 9 o'clock position
export const ARC_SWEEP_DEG = 270; // 270 degrees clockwise
export const GAP_CENTER_DEG = ARC_START_DEG + ARC_SWEEP_DEG + 45; // 225 deg = center of gap

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

function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);
  let sweep = endAngle - startAngle;
  if (sweep < 0) sweep += 360;
  const largeArc = sweep > 180 ? 1 : 0;
  return `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
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
  const innerEnd = polarToCartesian(cx, cy, innerRadius, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerRadius, startAngle);

  // Reverse arc for inner (counter-clockwise)
  let innerSweep = startAngle - endAngle;
  if (innerSweep < 0) innerSweep += 360;
  const innerLargeArc = innerSweep > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    describeArc(cx, cy, outerRadius, startAngle, endAngle),
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${innerLargeArc} 0 ${innerStart.x} ${innerStart.y}`,
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
  const cellGap = 0.5; // small gap between segments
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
  // Labels placed at the center of the gap (225 degrees, bottom-left)
  const labelAngle = 225; // Center of the 90-degree gap (180-270)

  return habits.map((text, i) => {
    const r = innerRadius + i * (ringWidth + ringGap) + ringWidth / 2;
    const pos = polarToCartesian(cx, cy, r, labelAngle);
    return { x: pos.x, y: pos.y, text };
  });
}

export function computeDayLabelPositions(
  cx: number,
  cy: number,
  outerRadius: number,
  days: number,
): Array<{ x: number; y: number; day: number; angle: number }> {
  const segmentAngle = ARC_SWEEP_DEG / days;
  const labelRadius = outerRadius + 12;

  return Array.from({ length: days }, (_, d) => {
    const angle = ARC_START_DEG + (d + 0.5) * segmentAngle;
    const pos = polarToCartesian(cx, cy, labelRadius, angle);
    return { x: pos.x, y: pos.y, day: d + 1, angle };
  });
}

export function computeChartDimensions(
  size: number,
  habitCount: number,
) {
  const cx = size / 2;
  const cy = size / 2;
  const innerRadius = 60;
  const maxOuterRadius = size / 2 - 20; // Leave margin for labels
  const totalRingSpace = maxOuterRadius - innerRadius;
  const ringGap = habitCount > 1 ? 2 : 0;
  const totalGaps = (habitCount - 1) * ringGap;
  const ringWidth = habitCount > 0
    ? Math.min(30, (totalRingSpace - totalGaps) / habitCount)
    : 30;
  const outerRadius = innerRadius + habitCount * ringWidth + (habitCount - 1) * ringGap;

  return { cx, cy, innerRadius, ringWidth, ringGap, outerRadius };
}
