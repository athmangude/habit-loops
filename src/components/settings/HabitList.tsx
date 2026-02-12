import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { HabitItem } from './HabitItem';

interface HabitListProps {
  habits: string[];
  onReorder: (oldIndex: number, newIndex: number) => void;
  onRemove: (index: number) => void;
}

export function HabitList({ habits, onReorder, onRemove }: HabitListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const items = habits.map((name, i) => ({ id: `habit-${i}`, name, index: i }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    onReorder(oldIndex, newIndex);
  }

  if (habits.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-4">
        No habits added yet
      </p>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <HabitItem
              key={item.id}
              id={item.id}
              name={item.name}
              onRemove={() => onRemove(item.index)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
