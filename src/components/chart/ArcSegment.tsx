import { useState } from 'react';
import type { CellValue } from '../../types/habit';
import { getCellColor, getHoverColor } from './utils/colors';

interface ArcSegmentProps {
  path: string;
  value: CellValue;
  day: number;
  habitName: string;
  onClick?: () => void;
}

export function ArcSegment({ path, value, day, habitName, onClick }: ArcSegmentProps) {
  const [hovered, setHovered] = useState(false);
  const interactive = !!onClick;
  const color = hovered && interactive ? getHoverColor(value) : getCellColor(value);

  return (
    <path
      d={path}
      fill={color}
      stroke="#fff"
      strokeWidth={0.5}
      className={interactive ? 'cursor-pointer transition-colors' : 'transition-colors'}
      onClick={onClick}
      onMouseEnter={interactive ? () => setHovered(true) : undefined}
      onMouseLeave={interactive ? () => setHovered(false) : undefined}
    >
      <title>{`${habitName} - Day ${day}: ${value === null ? 'Not tracked' : value}`}</title>
    </path>
  );
}
