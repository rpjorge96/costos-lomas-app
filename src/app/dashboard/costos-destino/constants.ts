export const COLORS = {
  mod: "#3b82f6",
  moi: "#8b5cf6",
  materiales: "#f59e0b",
  maquinaria: "#ef4444",
  total: "#10b981",
};

export const RUBRO_LABELS: Record<string, string> = {
  mod: "MOD",
  moi: "MOI",
  materiales: "Materiales",
  maquinaria: "Maquinaria",
};

export const KEY_MATERIALS = [
  { key: "cemento", label: "Cemento", color: "#6b7280" },
  { key: "arena", label: "Arena", color: "#d97706" },
  { key: "piedrin", label: "Piedrín", color: "#4b5563" },
  { key: "hierro", label: "Hierro", color: "#dc2626" },
  { key: "block", label: "Block", color: "#2563eb" },
];

export function fmtQ(v: number): string {
  if (v >= 1_000_000) return `Q ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `Q ${(v / 1_000).toFixed(1)}K`;
  return `Q ${v.toFixed(2)}`;
}

export function fmtNum(v: number): string {
  return v.toLocaleString("es-GT", { maximumFractionDigits: 2 });
}

export function fmtPct(v: number): string {
  return `${v.toFixed(1)}%`;
}

export function dominantRubro(
  mod: number,
  moi: number,
  mat: number,
  maq: number
): string {
  const max = Math.max(mod, moi, mat, maq);
  if (max === 0) return "—";
  if (max === mat) return "Materiales";
  if (max === mod) return "MOD";
  if (max === moi) return "MOI";
  return "Maquinaria";
}
