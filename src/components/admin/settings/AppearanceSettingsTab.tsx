import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Palette, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";
import { useUpdateTenantTheme } from "@/hooks/useTenantAdmin";
import {
  DEFAULT_TOKENS,
  TOKEN_GROUPS,
  applyThemeTokens,
  hexToHslString,
  type ThemeTokens,
  type TokenKey,
} from "@/lib/colorTokens";

export default function AppearanceSettingsTab() {
  const { tenant, tenantId } = useTenant();
  const updateTheme = useUpdateTenantTheme();

  const saved: ThemeTokens = useMemo(
    () => (tenant?.theme_tokens ?? {}) as ThemeTokens,
    [tenant?.theme_tokens],
  );
  const [values, setValues] = useState<Record<TokenKey, string>>(() => ({
    ...DEFAULT_TOKENS,
    ...saved,
  }));

  // Re-sync when the tenant (and therefore saved tokens) finishes loading.
  useEffect(() => {
    setValues({ ...DEFAULT_TOKENS, ...saved });
  }, [saved]);

  const dirty = (Object.keys(DEFAULT_TOKENS) as TokenKey[]).some(
    k => (saved[k] ?? DEFAULT_TOKENS[k]).toLowerCase() !== values[k].toLowerCase(),
  );

  const setToken = (k: TokenKey, v: string) => setValues(prev => ({ ...prev, [k]: v }));
  const resetToken = (k: TokenKey) => setToken(k, DEFAULT_TOKENS[k]);
  const resetAll = () => setValues({ ...DEFAULT_TOKENS });

  const handleSave = async () => {
    if (!tenantId) return;
    const invalid = (Object.entries(values) as [TokenKey, string][]).find(
      ([, v]) => !hexToHslString(v),
    );
    if (invalid) {
      toast.error(`Invalid hex colour for ${invalid[0]}`);
      return;
    }
    // Only persist tokens that differ from defaults, to keep the object lean.
    const tokens: ThemeTokens = {};
    for (const k of Object.keys(DEFAULT_TOKENS) as TokenKey[]) {
      if (values[k].toLowerCase() !== DEFAULT_TOKENS[k].toLowerCase()) {
        tokens[k] = values[k];
      }
    }
    try {
      await updateTheme.mutateAsync({
        tenantId,
        tokens: Object.keys(tokens).length ? tokens : null,
      });
      toast.success("Theme saved");
    } catch (e) {
      toast.error("Failed to save theme");
    }
  };

  // Build inline style for preview area
  const previewStyle = useMemo(() => {
    const style: Record<string, string> = {};
    // Fake root by using CSS vars locally on the preview container
    const el = { style: { setProperty: (k: string, v: string) => { style[k] = v; } } } as unknown as HTMLElement;
    applyThemeTokens(el, values);
    return style as React.CSSProperties;
  }, [values]);

  return (
    <div className="space-y-4">
      {!tenantId && (
        <Alert>
          <AlertDescription>No clinic detected — sign in as an admin of a clinic.</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">Appearance</h2>
            <p className="text-xs text-muted-foreground">
              Customize buttons, links, backgrounds, borders and state colours. Changes apply across the app after saving.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={resetAll}>
            <RotateCcw className="h-4 w-4 mr-1" /> Reset all
          </Button>
          <Button onClick={handleSave} disabled={!dirty || updateTheme.isPending}>
            <Save className="h-4 w-4 mr-1" /> Save changes
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {TOKEN_GROUPS.map(group => (
          <Card key={group.label}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{group.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {group.tokens.map(t => (
                <div key={t.key} className="space-y-1">
                  <div className="flex items-baseline justify-between">
                    <Label className="text-sm">{t.label}</Label>
                    {values[t.key].toLowerCase() !== DEFAULT_TOKENS[t.key].toLowerCase() && (
                      <button
                        type="button"
                        onClick={() => resetToken(t.key)}
                        className="text-xs text-muted-foreground hover:text-foreground underline"
                      >
                        reset
                      </button>
                    )}
                  </div>
                  {t.description && (
                    <p className="text-xs text-muted-foreground">{t.description}</p>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={values[t.key]}
                      onChange={e => setToken(t.key, e.target.value.toUpperCase())}
                      className="h-10 w-12 rounded border cursor-pointer bg-transparent"
                    />
                    <Input
                      value={values[t.key]}
                      onChange={e => setToken(t.key, e.target.value)}
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Live preview</CardTitle>
          <CardDescription>Reflects your unsaved edits.</CardDescription>
        </CardHeader>
        <CardContent>
          <div style={previewStyle} className="rounded-md border p-6 bg-[hsl(var(--background))] text-[hsl(var(--foreground))] space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <button className="px-4 h-10 rounded-md font-medium" style={{ background: `hsl(${hexToHslString(values.button_primary)})`, color: `hsl(${hexToHslString(values.button_primary_foreground)})` }}>
                Primary button
              </button>
              <button className="px-4 h-10 rounded-md font-medium bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]">
                Secondary
              </button>
              <button className="px-4 h-10 rounded-md font-medium" style={{ background: `hsl(${hexToHslString(values.success)})`, color: `hsl(${hexToHslString(values.success_foreground)})` }}>
                Submit
              </button>
              <button className="px-4 h-10 rounded-md font-medium" style={{ background: `hsl(${hexToHslString(values.danger)})`, color: `hsl(${hexToHslString(values.danger_foreground)})` }}>
                Delete
              </button>
              <button className="px-4 h-10 rounded-md font-medium" style={{ background: `hsl(${hexToHslString(values.warning)})`, color: `hsl(${hexToHslString(values.warning_foreground)})` }}>
                Warning
              </button>
              <button className="px-4 h-10 rounded-md font-medium" style={{ background: `hsl(${hexToHslString(values.info)})`, color: `hsl(${hexToHslString(values.info_foreground)})` }}>
                Info
              </button>
              <a href="#" onClick={e => e.preventDefault()} className="underline" style={{ color: `hsl(${hexToHslString(values.link) || "0 0% 0%"})` }}>
                A sample link
              </a>
            </div>
            <div className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
              <p className="font-medium">Card / panel surface</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Muted supporting text sits on the card, above a divider.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-medium">
              <div className="rounded p-2 text-center" style={{ background: `hsl(${hexToHslString(values.success)} / 0.15)`, color: `hsl(${hexToHslString(values.success)})` }}>Success</div>
              <div className="rounded p-2 text-center" style={{ background: `hsl(${hexToHslString(values.warning)} / 0.15)`, color: `hsl(${hexToHslString(values.warning)})` }}>Warning</div>
              <div className="rounded p-2 text-center" style={{ background: `hsl(${hexToHslString(values.danger)} / 0.15)`, color: `hsl(${hexToHslString(values.danger)})` }}>Danger</div>
              <div className="rounded p-2 text-center" style={{ background: `hsl(${hexToHslString(values.info)} / 0.15)`, color: `hsl(${hexToHslString(values.info)})` }}>Info</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}