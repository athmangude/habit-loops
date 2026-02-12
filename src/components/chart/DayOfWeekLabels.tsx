interface DayOfWeekLabelPos {
  x: number;
  y: number;
  letter: string;
  day: number;
  angle: number;
}

interface DayOfWeekLabelsProps {
  labels: DayOfWeekLabelPos[];
}

export function DayOfWeekLabels({ labels }: DayOfWeekLabelsProps) {
  return (
    <g>
      {labels.map((label) => (
        <text
          key={label.day}
          x={label.x}
          y={label.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={5.5}
          fill="#9ca3af"
          className="select-none pointer-events-none"
        >
          {label.letter}
        </text>
      ))}
    </g>
  );
}
