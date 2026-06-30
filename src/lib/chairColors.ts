// Subtle, consistent per-chair palette used across the system.
// Indexed primarily by `display_order` so chairs keep the same colour everywhere.
// Colours intentionally avoid emerald (used for "Confirmed" badges) and clinical reds/oranges.

export interface ChairColor {
  /** Small dot / swatch */
  dot: string;
  /** Subtle background tint for badges / column headers */
  bg: string;
  /** Border accent (e.g. left bar on columns) */
  border: string;
  /** Foreground text colour that pairs with bg */
  text: string;
  /** Hex used for inline styles where Tailwind classes aren't practical */
  hex: string;
}

const PALETTE: ChairColor[] = [
  { dot: "bg-sky-500",     bg: "bg-sky-50",     border: "border-sky-300",     text: "text-sky-800",     hex: "#0ea5e9" },
  { dot: "bg-violet-500",  bg: "bg-violet-50",  border: "border-violet-300",  text: "text-violet-800",  hex: "#8b5cf6" },
  { dot: "bg-amber-500",   bg: "bg-amber-50",   border: "border-amber-300",   text: "text-amber-800",   hex: "#f59e0b" },
  { dot: "bg-teal-500",    bg: "bg-teal-50",    border: "border-teal-300",    text: "text-teal-800",    hex: "#14b8a6" },
  { dot: "bg-rose-500",    bg: "bg-rose-50",    border: "border-rose-300",    text: "text-rose-800",    hex: "#f43f5e" },
  { dot: "bg-indigo-500",  bg: "bg-indigo-50",  border: "border-indigo-300",  text: "text-indigo-800",  hex: "#6366f1" },
  { dot: "bg-fuchsia-500", bg: "bg-fuchsia-50", border: "border-fuchsia-300", text: "text-fuchsia-800", hex: "#d946ef" },
  { dot: "bg-cyan-500",    bg: "bg-cyan-50",    border: "border-cyan-300",    text: "text-cyan-800",    hex: "#06b6d4" },
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function getChairColor(input: {
  id?: string | null;
  display_order?: number | null;
}): ChairColor {
  if (typeof input.display_order === "number" && input.display_order >= 0) {
    return PALETTE[input.display_order % PALETTE.length];
  }
  if (input.id) {
    return PALETTE[hashString(input.id) % PALETTE.length];
  }
  return PALETTE[0];
}