import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Table card with a slim filter toolbar bar (no extra vertical padding). */
export function CompactTableCard({ toolbar, children, className }) {
  return (
    <Card
      className={cn(
        "rounded-xl border-slate-200 shadow-sm bg-white overflow-hidden gap-0 py-0",
        className,
      )}
    >
      {toolbar != null && (
        <div className="border-b border-slate-100 px-3 py-2">{toolbar}</div>
      )}
      {children}
    </Card>
  );
}
