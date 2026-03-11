"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell,
  ReferenceLine,
} from "recharts";

// ─── Types ───
interface FilterOption {
  value: string;
  count: number;
}
interface Period {
  id: string;
  label: string;
  name: string;
}
interface Filters {
  unidadesCosto: FilterOption[];
  periodos: Period[];
  tiposDestino: FilterOption[];
}
interface ComparativoRow {
  destino: string;
  tipoDestino: string | null;
  costoTotal: number;
  costoMod: number;
  costoMoi: number;
  costoMateriales: number;
  costoMaquinaria: number;
  pctMod: number;
  pctMoi: number;
  pctMateriales: number;
  pctMaquinaria: number;
  cantidadActividades: number;
  duracionTotal: number;
  duracionPromedio: number;
}
interface Boxplot {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  mean: number;
}
interface DashboardData {
  rows: ComparativoRow[];
  totals: {
    costoTotal: number;
    costoMod: number;
    costoMoi: number;
    costoMateriales: number;
    costoMaquinaria: number;
    cantidadActividades: number;
    duracionTotal: number;
  };
  boxplot: Boxplot;
  count: number;
}

// ─── Helpers ───
const COLORS = {
  mod: "#3b82f6",
  moi: "#8b5cf6",
  materiales: "#f59e0b",
  maquinaria: "#ef4444",
  total: "#10b981",
};

const TIPO_COLORS = [
  "#3b82f6", "#ef4444", "#f59e0b", "#10b981", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#84cc16", "#6366f1",
  "#14b8a6", "#e11d48", "#a855f7", "#0ea5e9", "#eab308",
];

function fmtQ(v: number): string {
  if (v >= 1_000_000) return `Q ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `Q ${(v / 1_000).toFixed(1)}K`;
  return `Q ${v.toFixed(2)}`;
}

function fmtPct(v: number): string {
  return `${v.toFixed(1)}%`;
}

function shortDestino(d: string, maxLen = 22): string {
  if (d.length <= maxLen) return d;
  return d.slice(0, maxLen - 1) + "…";
}

// ─── Multi-Select Dropdown ───
interface MultiSelectProps {
  options: FilterOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  allLabel?: string;
}

function MultiSelectDropdown({ options, selected, onChange, allLabel = "Todas" }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  // empty selected = "all"
  const isAll = selected.length === 0;
  const filtered = options.filter((o) =>
    o.value.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(value: string) {
    if (isAll) {
      // deselect everything except this one
      onChange(options.map((o) => o.value).filter((v) => v !== value));
    } else if (selected.includes(value)) {
      const next = selected.filter((v) => v !== value);
      onChange(next); // [] means "all" again
    } else {
      const next = [...selected, value];
      onChange(next.length === options.length ? [] : next);
    }
  }

  function selectAll() { onChange([]); }

  function toggleFiltered() {
    const fvals = filtered.map((o) => o.value);
    const allFSelected = fvals.every((v) => isAll || selected.includes(v));
    if (allFSelected) {
      // deselect filtered — keep only non-filtered that were selected
      const keep = isAll
        ? options.map((o) => o.value).filter((v) => !fvals.includes(v))
        : selected.filter((v) => !fvals.includes(v));
      onChange(keep);
    } else {
      const merged = isAll
        ? [] // was all, stays all
        : [...new Set([...selected, ...fvals])];
      onChange(merged.length === options.length ? [] : merged);
    }
  }

  let label: string;
  if (isAll) label = allLabel;
  else if (selected.length === 1) label = selected[0];
  else label = `${selected.length} seleccionadas`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:border-gray-400 focus:border-brand-500 focus:outline-none"
      >
        <span className="truncate text-left">{label}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-80 rounded-xl border border-gray-200 bg-white shadow-xl">
          {/* Search */}
          <div className="border-b border-gray-100 p-2">
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar unidad…"
              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
              autoFocus
            />
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 border-b border-gray-100 px-3 py-1.5 text-xs">
            <button type="button" onClick={selectAll} className="text-brand-500 font-medium hover:underline">
              Todas
            </button>
            <span className="text-gray-300">·</span>
            <button type="button" onClick={toggleFiltered} className="text-gray-500 hover:underline">
              {filtered.every((o) => isAll || selected.includes(o.value)) ? "Deseleccionar visibles" : "Seleccionar visibles"}
            </button>
            {!isAll && (
              <>
                <span className="text-gray-300">·</span>
                <button type="button" onClick={() => onChange(selected.slice(0, 1))} className="text-red-400 hover:underline">
                  Limpiar
                </button>
              </>
            )}
          </div>

          {/* Options */}
          <div className="max-h-72 overflow-y-auto py-1">
            {!search && (
              <label className="flex cursor-pointer items-center gap-2.5 px-3 py-1.5 hover:bg-gray-50">
                <input type="checkbox" checked={isAll} onChange={selectAll}
                  className="h-4 w-4 rounded border-gray-300 accent-brand-500" />
                <span className="flex-1 text-sm font-semibold text-gray-700">{allLabel}</span>
                <span className="text-[11px] text-gray-400">
                  {options.reduce((s, o) => s + o.count, 0).toLocaleString()}
                </span>
              </label>
            )}
            {filtered.map((o) => (
              <label key={o.value} className="flex cursor-pointer items-center gap-2.5 px-3 py-1.5 hover:bg-gray-50">
                <input type="checkbox" checked={isAll || selected.includes(o.value)} onChange={() => toggle(o.value)}
                  className="h-4 w-4 shrink-0 rounded border-gray-300 accent-brand-500" />
                <span className="flex-1 text-sm text-gray-700">{o.value}</span>
                <span className="text-[11px] text-gray-400">{o.count.toLocaleString()}</span>
              </label>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-gray-400">Sin resultados</p>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-3 py-1.5 text-[11px] text-gray-400">
            {isAll ? `${options.length} unidades (todas)` : `${selected.length} de ${options.length} seleccionadas`}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Custom Tooltip ───
function CostTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-lg">
      <p className="mb-1.5 font-semibold text-gray-900">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="flex justify-between gap-4">
          <span>{p.name}</span>
          <span className="font-mono font-semibold">{fmtQ(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Main Component ───
export function ComparativoDashboard() {
  const [filters, setFilters] = useState<Filters | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);

  // Filter state — empty array = "all"
  const [selectedUnidades, setSelectedUnidades] = useState<string[]>([]);
  const [periodId, setPeriodId] = useState("");
  const [tipoDestino, setTipoDestino] = useState("");
  const [limit, setLimit] = useState(30);

  // Viz state
  const [sortBy, setSortBy] = useState<"costoTotal" | "costoMod" | "costoMoi" | "costoMateriales" | "costoMaquinaria" | "cantidadActividades">("costoTotal");
  const [activeTab, setActiveTab] = useState<"barras" | "apiladas" | "ranking" | "boxplot" | "dispersion">("barras");

  // Fetch filters on mount
  useEffect(() => {
    fetch("/api/dashboard/comparativo/filters")
      .then((r) => r.json())
      .then((d) => {
        setFilters(d);
        // Default: "1 Cimientos" pre-selected
        if (d.unidadesCosto?.length > 0) {
          const def = d.unidadesCosto.find((u: FilterOption) => u.value === "1 Cimientos");
          setSelectedUnidades(def ? [def.value] : [d.unidadesCosto[0].value]);
        }
      });
  }, []);

  // Fetch data when filters change
  const fetchData = useCallback(async () => {
    setLoading(true);
    // empty = all; use "||" as separator (safe separator for these strings)
    const unidadParam = selectedUnidades.length === 0 ? "all" : selectedUnidades.join("||");
    const params = new URLSearchParams({ unidadCosto: unidadParam, limit: String(limit) });
    if (periodId) params.set("periodId", periodId);
    if (tipoDestino) params.set("tipoDestino", tipoDestino);
    try {
      const res = await fetch(`/api/dashboard/comparativo/data?${params}`);
      const d = await res.json();
      setData(d);
    } finally {
      setLoading(false);
    }
  }, [selectedUnidades, periodId, tipoDestino, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived
  const sortedRows = data?.rows?.slice().sort((a, b) => {
    const key = sortBy as keyof ComparativoRow;
    return (b[key] as number) - (a[key] as number);
  }) ?? [];

  const chartData = sortedRows.slice(0, 20).map((r) => ({
    name: shortDestino(r.destino),
    fullName: r.destino,
    tipo: r.tipoDestino ?? "Sin tipo",
    ...r,
  }));

  if (!filters) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-gray-400">Cargando filtros...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Comparativo por Unidad de Costo
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Compara una misma etapa constructiva entre diferentes destinos
        </p>
      </div>

      {/* ── Filters ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Unidad de Costo — multi-select */}
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Unidad de Costo
            </label>
            <MultiSelectDropdown
              options={filters.unidadesCosto}
              selected={selectedUnidades}
              onChange={setSelectedUnidades}
              allLabel="Todas las unidades"
            />
          </div>

          {/* Período */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Período
            </label>
            <select
              value={periodId}
              onChange={(e) => setPeriodId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
            >
              <option value="">Todos</option>
              {filters.periodos.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Tipo Destino */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Tipo / Modelo
            </label>
            <select
              value={tipoDestino}
              onChange={(e) => setTipoDestino(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
            >
              <option value="">Todos</option>
              {filters.tiposDestino.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.value} ({t.count})
                </option>
              ))}
            </select>
          </div>

          {/* Limit */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Top destinos
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
            >
              {[10, 20, 30, 50, 100].map((n) => (
                <option key={n} value={n}>Top {n}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      )}

      {data && !loading && (
        <>
          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
            <KpiCard
              label="Costo Total"
              value={fmtQ(data.totals.costoTotal)}
              color="bg-emerald-50 text-emerald-700"
            />
            <KpiCard
              label="MOD"
              value={fmtQ(data.totals.costoMod)}
              sub={fmtPct(data.totals.costoTotal > 0 ? (data.totals.costoMod / data.totals.costoTotal) * 100 : 0)}
              color="bg-blue-50 text-blue-700"
            />
            <KpiCard
              label="MOI"
              value={fmtQ(data.totals.costoMoi)}
              sub={fmtPct(data.totals.costoTotal > 0 ? (data.totals.costoMoi / data.totals.costoTotal) * 100 : 0)}
              color="bg-violet-50 text-violet-700"
            />
            <KpiCard
              label="Materiales"
              value={fmtQ(data.totals.costoMateriales)}
              sub={fmtPct(data.totals.costoTotal > 0 ? (data.totals.costoMateriales / data.totals.costoTotal) * 100 : 0)}
              color="bg-amber-50 text-amber-700"
            />
            <KpiCard
              label="Maquinaria"
              value={fmtQ(data.totals.costoMaquinaria)}
              sub={fmtPct(data.totals.costoTotal > 0 ? (data.totals.costoMaquinaria / data.totals.costoTotal) * 100 : 0)}
              color="bg-red-50 text-red-700"
            />
            <KpiCard
              label="Actividades"
              value={data.totals.cantidadActividades.toLocaleString()}
              color="bg-purple-50 text-purple-700"
            />
            <KpiCard
              label="Destinos"
              value={data.count.toLocaleString()}
              sub={`Med: ${fmtQ(data.boxplot.median)}`}
              color="bg-cyan-50 text-cyan-700"
            />
          </div>

          {/* ── Tab Navigation ── */}
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
            {([
              ["barras", "Barras Comparativas"],
              ["apiladas", "Barras por Rubro"],
              ["ranking", "Tabla Ranking"],
              ["boxplot", "Distribución"],
              ["dispersion", "Dispersión"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === key
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Sort Control ── */}
          {(activeTab === "barras" || activeTab === "ranking") && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Ordenar por:</span>
              {([
                ["costoTotal", "Costo Total"],
                ["costoMod", "MOD"],
                ["costoMoi", "MOI"],
                ["costoMateriales", "Materiales"],
                ["costoMaquinaria", "Maquinaria"],
                ["cantidadActividades", "# Actividades"],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSortBy(key)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    sortBy === key
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* ── Charts ── */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            {activeTab === "barras" && (
              <BarrasComparativas data={chartData} sortBy={sortBy} />
            )}
            {activeTab === "apiladas" && (
              <BarrasApiladas data={chartData} />
            )}
            {activeTab === "ranking" && (
              <TablaRanking rows={sortedRows} sortBy={sortBy} />
            )}
            {activeTab === "boxplot" && (
              <BoxplotView boxplot={data.boxplot} rows={sortedRows} />
            )}
            {activeTab === "dispersion" && (
              <Dispersion rows={sortedRows} />
            )}
          </div>
        </>
      )}

      {data && !loading && data.count === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <p className="text-lg font-medium text-gray-400">
            No hay datos para esta combinación de filtros
          </p>
        </div>
      )}
    </div>
  );
}

// ─── KPI Card ───
function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className={`rounded-xl p-4 ${color}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
      {sub && <p className="text-xs opacity-70">{sub}</p>}
    </div>
  );
}

// ─── Barras Comparativas ───
function BarrasComparativas({ data, sortBy }: { data: any[]; sortBy: string }) {
  const colorKey = sortBy === "costoMod" ? COLORS.mod
    : sortBy === "costoMoi" ? COLORS.moi
    : sortBy === "costoMateriales" ? COLORS.materiales
    : sortBy === "costoMaquinaria" ? COLORS.maquinaria
    : COLORS.total;

  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold text-gray-700">
        Costo por Destino (Top {data.length})
      </h3>
      <ResponsiveContainer width="100%" height={Math.max(400, data.length * 32)}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" tickFormatter={(v) => fmtQ(v)} tick={{ fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={170}
            tick={{ fontSize: 11 }}
          />
          <Tooltip content={<CostTooltip />} />
          <Bar
            dataKey={sortBy === "cantidadActividades" ? "costoTotal" : (sortBy as string)}
            fill={colorKey}
            radius={[0, 4, 4, 0]}
            name={sortBy === "costoTotal" ? "Costo Total"
              : sortBy === "costoMod" ? "MOD"
              : sortBy === "costoMoi" ? "MOI"
              : sortBy === "costoMateriales" ? "Materiales"
              : sortBy === "costoMaquinaria" ? "Maquinaria"
              : "Costo Total"}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Barras Apiladas por Rubro ───
function BarrasApiladas({ data }: { data: any[] }) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold text-gray-700">
        Desglose por Rubro (Top {data.length})
      </h3>
      <ResponsiveContainer width="100%" height={Math.max(400, data.length * 32)}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" tickFormatter={(v) => fmtQ(v)} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={170} tick={{ fontSize: 11 }} />
          <Tooltip content={<CostTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />
          <Bar dataKey="costoMod" stackId="a" fill={COLORS.mod} name="MOD" />
          <Bar dataKey="costoMoi" stackId="a" fill={COLORS.moi} name="MOI" />
          <Bar dataKey="costoMateriales" stackId="a" fill={COLORS.materiales} name="Materiales" />
          <Bar dataKey="costoMaquinaria" stackId="a" fill={COLORS.maquinaria} name="Maquinaria" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Tabla Ranking ───
function TablaRanking({ rows, sortBy }: { rows: ComparativoRow[]; sortBy: string }) {
  const maxCosto = Math.max(...rows.map((r) => r.costoTotal), 1);

  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold text-gray-700">
        Ranking de Destinos ({rows.length})
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <th className="px-3 py-2 w-8">#</th>
              <th className="px-3 py-2">Destino</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2 text-right">Costo Total</th>
              <th className="px-3 py-2 text-right">MOD</th>
              <th className="px-3 py-2 text-right">MOI</th>
              <th className="px-3 py-2 text-right">Materiales</th>
              <th className="px-3 py-2 text-right">Maquinaria</th>
              <th className="px-3 py-2 text-center">Acts.</th>
              <th className="px-3 py-2 text-right">Dur. Total</th>
              <th className="px-3 py-2 w-40">Distribución</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const pMod = r.costoTotal > 0 ? (r.costoMod / r.costoTotal) * 100 : 0;
              const pMat = r.costoTotal > 0 ? (r.costoMateriales / r.costoTotal) * 100 : 0;
              const pMaq = r.costoTotal > 0 ? (r.costoMaquinaria / r.costoTotal) * 100 : 0;
              const pMoi = r.costoTotal > 0 ? (r.costoMoi / r.costoTotal) * 100 : 0;

              return (
                <tr
                  key={r.destino}
                  className="border-b border-gray-100 transition-colors hover:bg-gray-50"
                >
                  <td className="px-3 py-2 font-mono text-xs text-gray-400">
                    {i + 1}
                  </td>
                  <td className="px-3 py-2 font-medium text-gray-900 max-w-[200px] truncate" title={r.destino}>
                    {r.destino}
                  </td>
                  <td className="px-3 py-2">
                    {r.tipoDestino ? (
                      <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        {r.tipoDestino}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-semibold text-gray-900">
                    {fmtQ(r.costoTotal)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-blue-600">
                    {fmtQ(r.costoMod)}
                    <span className="ml-1 text-[10px] text-gray-400">{fmtPct(pMod)}</span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-violet-600">
                    {fmtQ(r.costoMoi)}
                    <span className="ml-1 text-[10px] text-gray-400">{fmtPct(pMoi)}</span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-amber-600">
                    {fmtQ(r.costoMateriales)}
                    <span className="ml-1 text-[10px] text-gray-400">{fmtPct(pMat)}</span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-red-600">
                    {fmtQ(r.costoMaquinaria)}
                    <span className="ml-1 text-[10px] text-gray-400">{fmtPct(pMaq)}</span>
                  </td>
                  <td className="px-3 py-2 text-center font-mono">{r.cantidadActividades}</td>
                  <td className="px-3 py-2 text-right font-mono text-gray-600">
                    {r.duracionTotal.toFixed(0)}
                  </td>
                  <td className="px-3 py-2">
                    {/* Mini stacked bar */}
                    <div className="flex h-4 w-full overflow-hidden rounded-full bg-gray-100">
                      <div style={{ width: `${pMod}%` }} className="bg-blue-500" title={`MOD ${fmtPct(pMod)}`} />
                      <div style={{ width: `${pMoi}%` }} className="bg-purple-500" title={`MOI ${fmtPct(pMoi)}`} />
                      <div style={{ width: `${pMat}%` }} className="bg-amber-400" title={`Mat ${fmtPct(pMat)}`} />
                      <div style={{ width: `${pMaq}%` }} className="bg-red-500" title={`Maq ${fmtPct(pMaq)}`} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Boxplot View ───
function BoxplotView({ boxplot, rows }: { boxplot: Boxplot; rows: ComparativoRow[] }) {
  // Show distribution as histogram + summary stats
  const bucketCount = 15;
  const maxVal = boxplot.max || 1;
  const bucketSize = maxVal / bucketCount;
  const buckets = Array(bucketCount).fill(0);
  rows.forEach((r) => {
    const idx = Math.min(Math.floor(r.costoTotal / bucketSize), bucketCount - 1);
    buckets[idx]++;
  });

  const histData = buckets.map((count, i) => ({
    range: fmtQ(i * bucketSize),
    count,
    from: i * bucketSize,
    to: (i + 1) * bucketSize,
  }));

  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold text-gray-700">
        Distribución de Costo Total entre Destinos
      </h3>

      {/* Stats summary */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Mínimo" value={fmtQ(boxplot.min)} />
        <StatCard label="Q1 (25%)" value={fmtQ(boxplot.q1)} />
        <StatCard label="Mediana" value={fmtQ(boxplot.median)} />
        <StatCard label="Media" value={fmtQ(boxplot.mean)} />
        <StatCard label="Q3 (75%)" value={fmtQ(boxplot.q3)} />
        <StatCard label="Máximo" value={fmtQ(boxplot.max)} />
      </div>

      {/* Histogram */}
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={histData} margin={{ bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="range"
            tick={{ fontSize: 10 }}
            angle={-30}
            textAnchor="end"
          />
          <YAxis tick={{ fontSize: 11 }} label={{ value: "# Destinos", angle: -90, position: "insideLeft", style: { fontSize: 11 } }} />
          <Tooltip
            formatter={(value) => [`${value} destinos`]}
            labelFormatter={(_, payload) => {
              if (!payload?.[0]) return "";
              const d = payload[0].payload;
              return `${fmtQ(d.from)} — ${fmtQ(d.to)}`;
            }}
          />
          <ReferenceLine x={histData[Math.min(Math.floor(boxplot.median / bucketSize), bucketCount - 1)]?.range} stroke="#ef4444" strokeDasharray="5 3" label={{ value: "Mediana", position: "top", style: { fontSize: 10, fill: "#ef4444" } }} />
          <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Destinos">
            {histData.map((_, i) => (
              <Cell
                key={i}
                fill={
                  i * bucketSize >= boxplot.q1 && (i + 1) * bucketSize <= boxplot.q3
                    ? "#3b82f6"
                    : "#93c5fd"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Visual boxplot bar */}
      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold text-gray-500">BOXPLOT VISUAL</p>
        <div className="relative h-10 rounded-lg bg-gray-100">
          {maxVal > 0 && (
            <>
              {/* Whisker lines */}
              <div
                className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-gray-400"
                style={{ left: `${(boxplot.min / maxVal) * 100}%`, width: `${((boxplot.q1 - boxplot.min) / maxVal) * 100}%` }}
              />
              <div
                className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-gray-400"
                style={{ left: `${(boxplot.q3 / maxVal) * 100}%`, width: `${((boxplot.max - boxplot.q3) / maxVal) * 100}%` }}
              />
              {/* IQR box */}
              <div
                className="absolute top-1 bottom-1 rounded bg-blue-200 border border-blue-400"
                style={{ left: `${(boxplot.q1 / maxVal) * 100}%`, width: `${((boxplot.q3 - boxplot.q1) / maxVal) * 100}%` }}
              />
              {/* Median line */}
              <div
                className="absolute top-0.5 bottom-0.5 w-0.5 bg-red-500"
                style={{ left: `${(boxplot.median / maxVal) * 100}%` }}
              />
              {/* Mean dot */}
              <div
                className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500 border border-white"
                style={{ left: `${(boxplot.mean / maxVal) * 100}%` }}
              />
            </>
          )}
        </div>
        <div className="mt-1 flex items-center gap-4 text-[10px] text-gray-400">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-300" /> IQR (Q1-Q3)</span>
          <span className="flex items-center gap-1"><span className="h-2 w-0.5 bg-red-500" /> Mediana</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Media</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-0.5 font-mono text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

// ─── Scatter ───
function Dispersion({ rows }: { rows: ComparativoRow[] }) {
  // scatter: duracion_total vs costo_total, color by tipo
  const tipos = [...new Set(rows.map((r) => r.tipoDestino ?? "Sin tipo"))];
  const tipoColor = Object.fromEntries(tipos.map((t, i) => [t, TIPO_COLORS[i % TIPO_COLORS.length]]));

  const scatterData = rows.map((r) => ({
    x: r.duracionTotal,
    y: r.costoTotal,
    tipo: r.tipoDestino ?? "Sin tipo",
    destino: r.destino,
    actividades: r.cantidadActividades,
  }));

  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold text-gray-700">
        Duración Total vs Costo Total
      </h3>
      <div className="mb-3 flex flex-wrap gap-2">
        {tipos.map((t) => (
          <span key={t} className="flex items-center gap-1 text-xs text-gray-600">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tipoColor[t] }} />
            {t}
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={450}>
        <ScatterChart margin={{ bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            type="number"
            dataKey="x"
            name="Duración"
            tick={{ fontSize: 11 }}
            label={{ value: "Duración Total", position: "bottom", offset: 0, style: { fontSize: 11 } }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Costo"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => fmtQ(v)}
            label={{ value: "Costo Total", angle: -90, position: "insideLeft", style: { fontSize: 11 } }}
          />
          <Tooltip
            content={({ payload }) => {
              if (!payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-lg">
                  <p className="font-semibold text-gray-900">{d.destino}</p>
                  <p className="text-gray-500">{d.tipo}</p>
                  <p className="mt-1">Costo: <span className="font-mono font-semibold">{fmtQ(d.y)}</span></p>
                  <p>Duración: <span className="font-mono font-semibold">{d.x.toFixed(0)}</span></p>
                  <p>Actividades: <span className="font-mono font-semibold">{d.actividades}</span></p>
                </div>
              );
            }}
          />
          <Scatter data={scatterData}>
            {scatterData.map((d, i) => (
              <Cell key={i} fill={tipoColor[d.tipo]} fillOpacity={0.7} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
