interface DayLabelPos {
  x: number;
  y: number;
  day: number;
  angle: number;
}

interface DayLabelsProps {
  labels: DayLabelPos[];
}

export function DayLabels({ labels }: DayLabelsProps) {
  // Only show some labels to avoid crowding (every 5th day + first and last)
  const filtered = labels.filter(
    (l) => l.day === 1 || l.day === labels.length || l.day % 5 === 0,
  );

  return (
    <g>
      {filtered.map((label) => (
        <text
          key={label.day}
          x={label.x}
          y={label.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={8}
          fill="#6b7280"
          className="select-none pointer-events-none"
        >
          {label.day}
        </text>
      ))}
    </g>
  );
}
