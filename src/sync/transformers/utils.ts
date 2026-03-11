/**
 * Extract the name from an Airtable singleSelect field value.
 * Can be a string or { id, name, color } object.
 */
export function extractSelectName(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "name" in value) {
    return (value as { name: string }).name;
  }
  return null;
}

/**
 * Convert an Airtable numeric value to a string for PostgreSQL NUMERIC columns.
 */
export function toNumeric(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return String(value);
  if (typeof value === "string") {
    const n = parseFloat(value);
    return isNaN(n) ? null : String(n);
  }
  return null;
}

/**
 * Extract the first value from a multipleLookupValues field.
 * These come as arrays from Airtable.
 */
export function extractFirstLookup(value: unknown): string | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    const first = value[0];
    if (!first) return null;
    if (typeof first === "string") return first;
    if (typeof first === "number") return String(first);
    if (typeof first === "object" && first !== null && "name" in first) {
      return (first as { name: string }).name;
    }
    return String(first);
  }
  if (typeof value === "string") return value;
  return null;
}

/**
 * Extract first numeric value from a lookup/rollup array.
 */
export function extractFirstNumeric(value: unknown): string | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    return toNumeric(value[0]);
  }
  return toNumeric(value);
}
