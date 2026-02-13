import { useState, useEffect } from "react";

export function ElapsedTimer({ startedAt }: { startedAt: string | null }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!startedAt) return null;
  const elapsed = now - new Date(startedAt).getTime();
  const h = Math.floor(elapsed / 3600000);
  const m = Math.floor((elapsed % 3600000) / 60000);
  const s = Math.floor((elapsed % 60000) / 1000);

  return (
    <span className="text-[32px] font-mono font-bold text-foreground tabular-nums tracking-tight leading-none">
      {h > 0 ? `${h}:` : ""}{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}

/** Compute elapsed ms from startedAt */
export function getElapsedMs(startedAt: string | null): number {
  if (!startedAt) return 0;
  return Date.now() - new Date(startedAt).getTime();
}

/** Format ms to human-readable duration */
export function formatDuration(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}m`;
}
