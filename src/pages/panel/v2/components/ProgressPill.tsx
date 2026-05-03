export function ProgressPill({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
      <div className="relative h-1.5 w-24 overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="tabular-nums">
        {done} de {total}
      </span>
    </div>
  );
}
