interface LabelPos {
  x: number;
  y: number;
  text: string;
}

interface HabitLabelsProps {
  labels: LabelPos[];
}

export function HabitLabels({ labels }: HabitLabelsProps) {
  return (
    <g>
      {labels.map((label, i) => (
        <text
          key={i}
          x={label.x}
          y={label.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={9}
          fill="#374151"
          className="select-none pointer-events-none"
        >
          {label.text.length > 12 ? label.text.slice(0, 11) + '...' : label.text}
        </text>
      ))}
    </g>
  );
}
