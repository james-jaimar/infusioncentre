import { cn } from "@/lib/utils";

interface TreatmentCourseChipProps {
  typeName: string;
  color?: string | null;
  sessionsCompleted?: number | null;
  totalSessions?: number | null;
  status?: string | null;
  className?: string;
  size?: "sm" | "md";
}

/**
 * Hex color → inline style with low-opacity background, full-color border/text.
 * Falls back to neutral semantic tokens if no color provided.
 */
export function TreatmentCourseChip({
  typeName,
  color,
  sessionsCompleted,
  totalSessions,
  status,
  className,
  size = "sm",
}: TreatmentCourseChipProps) {
  const safeColor = color && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#3E5B84";

  const style = {
    backgroundColor: `${safeColor}1A`, // ~10% opacity
    borderColor: `${safeColor}66`,     // ~40% opacity
    color: safeColor,
  };

  const showProgress =
    typeof sessionsCompleted === "number" && typeof totalSessions === "number" && totalSessions > 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        className
      )}
      style={style}
      title={status ? `${typeName} · ${status}` : typeName}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: safeColor }}
        aria-hidden
      />
      <span className="truncate max-w-[140px]">{typeName}</span>
      {showProgress && (
        <span
          className="ml-0.5 rounded-full px-1.5 py-px text-[10px] tabular-nums"
          style={{ backgroundColor: `${safeColor}26`, color: safeColor }}
        >
          {sessionsCompleted}/{totalSessions}
        </span>
      )}
    </span>
  );
}
