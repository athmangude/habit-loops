import { useState, useRef, useEffect } from 'react';

interface LabelPos {
  x: number;
  y: number;
  text: string;
}

interface HabitLabelsProps {
  labels: LabelPos[];
  onRename?: (habitIndex: number, newName: string) => void;
}

export function HabitLabels({ labels, onRename }: HabitLabelsProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingIndex !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingIndex]);

  const handleClick = (index: number, text: string) => {
    if (!onRename) return;
    setEditingIndex(index);
    setEditValue(text);
  };

  const commitEdit = () => {
    if (editingIndex !== null && onRename) {
      const trimmed = editValue.trim();
      if (trimmed && trimmed !== labels[editingIndex].text) {
        onRename(editingIndex, trimmed);
      }
    }
    setEditingIndex(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') setEditingIndex(null);
  };

  return (
    <g>
      {labels.map((label, i) => {
        if (editingIndex === i) {
          const inputWidth = 120;
          const inputHeight = 16;
          return (
            <foreignObject
              key={i}
              x={label.x - inputWidth - 4}
              y={label.y - inputHeight / 2}
              width={inputWidth}
              height={inputHeight}
            >
              <input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={handleKeyDown}
                style={{
                  width: '100%',
                  height: '100%',
                  fontSize: '9px',
                  padding: '0 2px',
                  border: '1px solid #6b7280',
                  borderRadius: '2px',
                  outline: 'none',
                  textAlign: 'right',
                  background: '#fff',
                }}
              />
            </foreignObject>
          );
        }

        return (
          <text
            key={i}
            x={label.x}
            y={label.y}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize={9}
            fill="#374151"
            className={onRename ? 'cursor-pointer select-none hover:fill-blue-600' : 'select-none pointer-events-none'}
            onClick={() => handleClick(i, label.text)}
          >
            {label.text}
          </text>
        );
      })}
    </g>
  );
}
