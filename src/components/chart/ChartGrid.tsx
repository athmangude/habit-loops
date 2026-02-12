import { polarToCartesian, ARC_START_DEG, ARC_SWEEP_DEG, TOTAL_DAYS } from './utils/geometry';

interface ChartGridProps {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  ringWidth: number;
  ringGap: number;
  habitCount: number;
}

export function ChartGrid({
  cx,
  cy,
  innerRadius,
  outerRadius,
  ringWidth,
  ringGap,
  habitCount,
}: ChartGridProps) {
  if (habitCount === 0) return null;

  const segmentAngle = ARC_SWEEP_DEG / TOTAL_DAYS;
  const gridColor = '#e5e7eb';
  const gridStroke = 0.5;

  // Radial lines from center outward for each day boundary
  const radialLines = [];
  for (let d = 0; d <= TOTAL_DAYS; d++) {
    const angle = ARC_START_DEG + d * segmentAngle;
    const inner = polarToCartesian(cx, cy, innerRadius, angle);
    const outer = polarToCartesian(cx, cy, outerRadius, angle);
    radialLines.push(
      <line
        key={`radial-${d}`}
        x1={inner.x}
        y1={inner.y}
        x2={outer.x}
        y2={outer.y}
        stroke={gridColor}
        strokeWidth={gridStroke}
      />,
    );
  }

  // Concentric ring arcs for each habit boundary
  const concentricArcs = [];
  for (let h = 0; h <= habitCount; h++) {
    const r = innerRadius + h * (ringWidth + ringGap) - (h > 0 ? ringGap : 0);
    const startAngle = ARC_START_DEG;
    const endAngle = ARC_START_DEG + ARC_SWEEP_DEG;
    const start = polarToCartesian(cx, cy, r, startAngle);
    const end = polarToCartesian(cx, cy, r, endAngle);
    const largeArc = ARC_SWEEP_DEG > 180 ? 1 : 0;

    concentricArcs.push(
      <path
        key={`ring-${h}`}
        d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`}
        fill="none"
        stroke={gridColor}
        strokeWidth={gridStroke}
      />,
    );
  }

  return (
    <g className="pointer-events-none">
      {concentricArcs}
      {radialLines}
    </g>
  );
}
