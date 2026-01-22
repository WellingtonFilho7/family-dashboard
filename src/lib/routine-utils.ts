import type { KidRoutineCheck } from '@/lib/types';

type ToggleResult = {
  nextCompleted: boolean;
  updatedChecks: KidRoutineCheck[];
};

type IdFactory = () => string;

export const computeRoutineToggle = (
  checks: KidRoutineCheck[],
  templateId: string,
  dateKey: string,
  createId: IdFactory
): ToggleResult => {
  const existing = checks.find(
    (check) => check.templateId === templateId && check.date === dateKey
  );
  const nextCompleted = existing ? !existing.completed : true;
  if (existing) {
    return {
      nextCompleted,
      updatedChecks: checks.map((check) =>
        check.id === existing.id ? { ...check, completed: nextCompleted } : check
      ),
    };
  }
  const newCheck: KidRoutineCheck = {
    id: createId(),
    templateId,
    date: dateKey,
    completed: nextCompleted,
  };
  return { nextCompleted, updatedChecks: [...checks, newCheck] };
};
