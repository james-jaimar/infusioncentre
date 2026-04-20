// Helpers for the "Other / Custom" treatment type.
// We identify it by name (matching the seeded row) so we don't need to hard-code IDs across tenants.
export const CUSTOM_TYPE_NAME = "Other / Custom";
export const CUSTOM_REQUEST_TAG = "[OTHER / CUSTOM]";

export function isCustomType(typeName?: string | null): boolean {
  if (!typeName) return false;
  return typeName.trim().toLowerCase() === CUSTOM_TYPE_NAME.toLowerCase();
}

export function isCustomTypeId(typeId: string | null | undefined, types: Array<{ id: string; name: string }>): boolean {
  if (!typeId) return false;
  const t = types.find((x) => x.id === typeId);
  return isCustomType(t?.name);
}

export function isCustomRequest(treatmentRequested?: string | null): boolean {
  if (!treatmentRequested) return false;
  return treatmentRequested.trim().toUpperCase().startsWith(CUSTOM_REQUEST_TAG);
}

export function stripCustomTag(treatmentRequested?: string | null): string {
  if (!treatmentRequested) return "";
  const trimmed = treatmentRequested.trim();
  if (trimmed.toUpperCase().startsWith(CUSTOM_REQUEST_TAG)) {
    return trimmed.slice(CUSTOM_REQUEST_TAG.length).trim();
  }
  return trimmed;
}

export function tagCustomRequest(description: string): string {
  return `${CUSTOM_REQUEST_TAG} ${description.trim()}`;
}
