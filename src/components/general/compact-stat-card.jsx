import { cn } from "@/lib/utils";

export function CompactStatCard({
  label,
  value,
  sublabel,
  icon: Icon,
  iconClassName = "text-emerald-600",
  iconBgClassName = "bg-emerald-50",
  className,
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm",
        className,
      )}
    >
      {Icon && (
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
            iconBgClassName,
          )}
        >
          <Icon className={cn("h-4 w-4", iconClassName)} />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-base font-bold text-slate-900 leading-tight truncate">
          {value}
        </p>
        {sublabel != null && sublabel !== "" && (
          <p className="text-xs text-slate-500 truncate">{sublabel}</p>
        )}
      </div>
    </div>
  );
}

export function CompactStatsGrid({ children, className, cols = 3 }) {
  const colClass =
    cols === 4
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : cols === 2
        ? "sm:grid-cols-2"
        : "sm:grid-cols-3";

  return (
    <div className={cn("grid grid-cols-1 gap-3", colClass, className)}>
      {children}
    </div>
  );
}
