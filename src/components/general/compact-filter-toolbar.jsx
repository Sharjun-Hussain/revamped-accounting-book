import { cn } from "@/lib/utils";

/** Wrapper for compact filter rows (search, selects, actions). */
export function CompactFilterToolbar({ children, className, end }) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2",
        className,
      )}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2 min-w-0">
        {children}
      </div>
      {end != null ? end : null}
    </div>
  );
}
