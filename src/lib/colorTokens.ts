// Theme token utilities: hex <-> HSL string, defaults, and UI metadata.

export type TokenKey =
  | "primary"
  | "primary_foreground"
  | "button_primary"
  | "button_primary_foreground"
  | "secondary"
  | "secondary_foreground"
  | "accent"
  | "link"
  | "background"
  | "card"
  | "muted"
  | "border"
  | "ring"
  | "foreground"
  | "muted_foreground"
  | "success"
  | "success_foreground"
  | "warning"
  | "warning_foreground"
  | "danger"
  | "danger_foreground"
  | "info"
  | "info_foreground";

// CSS variable name each token maps to (without leading `--`).
export const TOKEN_CSS_VAR: Record<TokenKey, string[]> = {
  primary: ["primary"],
  primary_foreground: ["primary-foreground"],
  secondary: ["secondary"],
  secondary_foreground: ["secondary-foreground"],
  accent: ["accent"],
  link: ["link"],
  background: ["background"],
  card: ["card"],
  muted: ["muted"],
  border: ["border", "input"],
  ring: ["ring"],
  foreground: ["foreground", "card-foreground", "popover-foreground"],
  muted_foreground: ["muted-foreground"],
  success: ["state-success", "success"],
  success_foreground: ["success-foreground"],
  warning: ["state-warning", "warning"],
  warning_foreground: ["warning-foreground"],
  danger: ["destructive", "state-danger"],
  danger_foreground: ["destructive-foreground"],
  info: ["state-info", "info"],
  info_foreground: ["info-foreground"],
};

export const DEFAULT_TOKENS: Record<TokenKey, string> = {
  primary: "#1F3A5F",
  primary_foreground: "#FFFFFF",
  secondary: "#F1F4F7",
  secondary_foreground: "#1F3A5F",
  accent: "#1F3A5F",
  link: "#356DA8",
  background: "#E4E9EE",
  card: "#FFFFFF",
  muted: "#EDF0F3",
  border: "#C4CDD6",
  ring: "#1F3A5F",
  foreground: "#2E3E52",
  muted_foreground: "#6B7C8F",
  success: "#2E7D61",
  success_foreground: "#FFFFFF",
  warning: "#C48A2D",
  warning_foreground: "#FFFFFF",
  danger: "#A23B3B",
  danger_foreground: "#FFFFFF",
  info: "#356DA8",
  info_foreground: "#FFFFFF",
};

export interface TokenGroup {
  label: string;
  tokens: { key: TokenKey; label: string; description?: string }[];
}

export const TOKEN_GROUPS: TokenGroup[] = [
  {
    label: "Brand",
    tokens: [
      { key: "primary", label: "Primary", description: "Buttons, active states" },
      { key: "primary_foreground", label: "Primary text", description: "Text on primary colour" },
      { key: "accent", label: "Accent", description: "Highlights, secondary CTAs" },
      { key: "link", label: "Link", description: "Anchor tag colour" },
    ],
  },
  {
    label: "Buttons",
    tokens: [
      { key: "primary", label: "Primary button", description: "Main action buttons (Save, Create, Confirm)" },
      { key: "primary_foreground", label: "Primary text", description: "Text/icon on primary buttons" },
      { key: "secondary", label: "Secondary button", description: "Neutral / outline button surface" },
      { key: "secondary_foreground", label: "Secondary text" },
      { key: "success", label: "Submit / confirm", description: "Green form-submit style button" },
      { key: "success_foreground", label: "Submit text" },
      { key: "danger", label: "Delete / destructive", description: "Delete & destructive buttons" },
      { key: "danger_foreground", label: "Delete text" },
      { key: "warning", label: "Warning button" },
      { key: "warning_foreground", label: "Warning text" },
      { key: "info", label: "Info button" },
      { key: "info_foreground", label: "Info text" },
    ],
  },
  {
    label: "Surfaces",
    tokens: [
      { key: "background", label: "Page background" },
      { key: "card", label: "Card / panel" },
      { key: "muted", label: "Muted surface" },
      { key: "border", label: "Border / divider" },
      { key: "ring", label: "Focus ring" },
    ],
  },
  {
    label: "Text",
    tokens: [
      { key: "foreground", label: "Body text" },
      { key: "muted_foreground", label: "Muted text" },
    ],
  },
  {
    label: "State",
    tokens: [
      { key: "success", label: "Success (shared with submit button)" },
      { key: "warning", label: "Warning (shared with button)" },
      { key: "danger", label: "Danger (shared with delete button)" },
      { key: "info", label: "Info (shared with button)" },
    ],
  },
];

export function hexToHslString(hex: string): string | null {
  const m = hex.trim().replace("#", "");
  if (!/^([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(m)) return null;
  const full = m.length === 3 ? m.split("").map(c => c + c).join("") : m;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export type ThemeTokens = Partial<Record<TokenKey, string>>;

export function applyThemeTokens(root: HTMLElement, tokens: ThemeTokens): string[] {
  const applied: string[] = [];
  for (const [key, hex] of Object.entries(tokens) as [TokenKey, string][]) {
    const hsl = hexToHslString(hex);
    if (!hsl) continue;
    for (const cssVar of TOKEN_CSS_VAR[key] || []) {
      root.style.setProperty(`--${cssVar}`, hsl);
      applied.push(cssVar);
    }
  }
  return applied;
}