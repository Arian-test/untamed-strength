"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import type { ExerciseEntry } from "@/lib/types";
import { EditExerciseCard, LogExerciseCard } from "./exercise-cards";

export function ExerciseList({
  blockId,
  dayId,
  exercises,
  mode,
  prevExercises,
}: {
  blockId: string;
  dayId: string;
  exercises: ExerciseEntry[];
  mode: "edit" | "log";
  prevExercises?: ExerciseEntry[];
}) {
  const reorderExercises = useAppStore((s) => s.reorderExercises);
  const addExercise = useAppStore((s) => s.addExercise);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (mode === "log") {
    return (
      <div className="flex flex-col gap-3">
        {exercises.map((ex, i) => (
          <LogExerciseCard
            key={ex.id}
            blockId={blockId}
            dayId={dayId}
            exercise={ex}
            prevExercise={prevExercises?.[i]}
          />
        ))}
      </div>
    );
  }

  const ids = exercises.map((e) => e.id);

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    reorderExercises(blockId, dayId, arrayMove(ids, oldIndex, newIndex));
  };

  return (
    <div className="flex flex-col gap-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3">
            {exercises.map((ex) => (
              <EditExerciseCard key={ex.id} blockId={blockId} dayId={dayId} exercise={ex} dragId={ex.id} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button variant="outline" className="h-11" onClick={() => addExercise(blockId, dayId)}>
        <Plus className="size-4" /> Oefening toevoegen
      </Button>
    </div>
  );
}
