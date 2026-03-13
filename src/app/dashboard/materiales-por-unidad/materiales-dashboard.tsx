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
  Cell,
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
  periodos: Period[];
  unidadesCosto: FilterOption[];
  destinos: FilterOption[];
  materiales: FilterOption[];
}

interface ParetoItem {
  material: string;
  costo: number;
  cantidad: number;
  despachos: number;
  unidadMedida: string;
  pct: number;
  cumPct: number;
}

interface ComparativaRow {
  destino: string;
  costoTotal: number;
  cantidadTotal: number;
  despachos: number;
  materialesUnicos: number;
}

interface MatrixRow {
  material: string;
  total: number;
  destinos: Record<string, { costo: number; cantidad: number }>;
}

interface DashboardData {
  totals: {
    costoTotal: number;
    totalDespachos: number;
    materialesUnicos: number;
    cantidadTotal: number;
    destinosCount: number;
  };
  pareto: ParetoItem[];
  porUnidadCosto: Record<string, string | number>[];
  topMaterials: string[];
  matrix: MatrixRow[];
  matrixDestinos: string[];
  comparativa: ComparativaRow[];
}

// ─── Helpers ───
const MAT_COLORS = [
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

function shortLabel(d: string, maxLen = 20): string {
  if (d.length <= maxLen) return d;
  return d.slice(0, maxLen - 1) + "\u2026";
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

  const isAll = selected.length === 0;
  const filtered = options.filter((o) =>
    o.value.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(value: string) {
    if (isAll) {
      onChange(options.map((o) => o.value).filter((v) => v !== value));
    } else if (selected.includes(value)) {
      const next = selected.filter((v) => v !== value);
      onChange(next);
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
      const keep = isAll
        ? options.map((o) => o.value).filter((v) => !fvals.includes(v))
        : selected.filter((v) => !fvals.includes(v));
      onChange(keep);
    } else {
      const merged = isAll
        ? []
        : [...new Set([...selected, ...fvals])];
      onChange(merged.length === options.length ? [] : merged);
    }
  }

  let label: string;
  if (isAll) label = allLabel;
  else if (selected.length === 1) label = selected[0];
  else label = `${selected.length} seleccionados`;

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
          <div className="border-b border-gray-100 p-2">
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
              autoFocus
            />
          </div>
          <div className="flex gap-2 border-b border-gray-100 px-3 py-1.5 text-xs">
            <button type="button" onClick={selectAll} className="text-brand-500 font-medium hover:underline">
              Todas
            </button>
            <span className="text-gray-300">&middot;</span>
            <button type="button" onClick={toggleFiltered} className="text-gray-500 hover:underline">
              {filtered.every((o) => isAll || selected.includes(o.value)) ? "Deseleccionar visibles" : "Seleccionar visibles"}
            </button>
            {!isAll && (
              <>
                <span className="text-gray-300">&middot;</span>
                <button type="button" onClick={() => onChange(selected.slice(0, 1))} className="text-red-400 hover:underline">
                  Limpiar
                </button>
              </>
            )}
          </div>
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
          <div className="border-t border-gray-100 px-3 py-1.5 text-[11px] text-gray-400">
            {isAll ? `${options.length} opciones (todas)` : `${selected.length} de ${options.length} seleccionadas`}
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
          <span className="font-mono font-semibold">
            {typeof p.value === "number" && p.dataKey !== "cumPct"
              ? fmtQ(p.value)
              : fmtPct(p.value)}
          </span>
        </p>
      ))}
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

// ─── Main Component ───
export function MaterialesDashboard() {
  const [filters, setFilters] = useState<Filters | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);

  // Filter state
  const [selectedUnidades, setSelectedUnidades] = useState<string[]>([]);
  const [periodId, setPeriodId] = useState("");
  const [selectedDestinos, setSelectedDestinos] = useState<string[]>([]);
  const [selectedMateriales, setSelectedMateriales] = useState<string[]>([]);
  const [limit, setLimit] = useState(30);

  // Viz state
  const [activeTab, setActiveTab] = useState<"pareto" | "porUnidad" | "matriz" | "comparativa" | "barMaterial">("pareto");

  const filtersInitialized = useRef(false);

  // ── Initial filter load ──
  useEffect(() => {
    fetch("/api/dashboard/materiales-por-unidad/filters")
      .then((r) => r.json())
      .then((d: Filters) => {
        setFilters(d);
        if (d.unidadesCosto?.length > 0) {
          const def = d.unidadesCosto.find((u) => u.value.startsWith("2 "));
          setSelectedUnidades(def ? [def.value] : [d.unidadesCosto[0].value]);
        }
        filtersInitialized.current = true;
      });
  }, []);

  // ── Cascading filter refetch ──
  useEffect(() => {
    if (!filtersInitialized.current) return;
    const unidadParam = selectedUnidades.length === 0 ? "all" : selectedUnidades.join("||");
    const destinosParam = selectedDestinos.length === 0 ? "all" : selectedDestinos.join("||");
    const params = new URLSearchParams({ unidadCosto: unidadParam, destinos: destinosParam });
    if (periodId) params.set("periodId", periodId);
    fetch(`/api/dashboard/materiales-por-unidad/filters?${params}`)
      .then((r) => r.json())
      .then((d: Filters) => setFilters(d));
  }, [periodId, selectedUnidades, selectedDestinos]);

  // ── Fetch chart data ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    const unidadParam = selectedUnidades.length === 0 ? "all" : selectedUnidades.join("||");
    const destinosParam = selectedDestinos.length === 0 ? "all" : selectedDestinos.join("||");
    const materialesParam = selectedMateriales.length === 0 ? "all" : selectedMateriales.join("||");
    const params = new URLSearchParams({
      unidadCosto: unidadParam,
      destinos: destinosParam,
      materiales: materialesParam,
      limit: String(limit),
    });
    if (periodId) params.set("periodId", periodId);
    try {
      const res = await fetch(`/api/dashboard/materiales-por-unidad/data?${params}`);
      const d = await res.json();
      setData(d);
    } finally {
      setLoading(false);
    }
  }, [selectedUnidades, selectedDestinos, selectedMateriales, periodId, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
          Materiales por Unidad de Costo
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Analiza materiales consumidos dentro de etapas constructivas y compara diferencias entre destinos
        </p>
      </div>

      {/* ── Filters ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Unidad de Costo */}
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Unidad de Costo
            </label>
            <MultiSelectDropdown
              options={filters.unidadesCosto}
              selected={selectedUnidades}
              onChange={(next) => {
                setSelectedUnidades(next);
                setSelectedDestinos([]);
                setSelectedMateriales([]);
              }}
              allLabel="Todas las unidades"
            />
          </div>

          {/* Periodo */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Periodo
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

          {/* Destinos */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Destinos
            </label>
            <MultiSelectDropdown
              options={filters.destinos ?? []}
              selected={selectedDestinos}
              onChange={(next) => {
                setSelectedDestinos(next);
                setSelectedMateriales([]);
              }}
              allLabel="Todos los destinos"
            />
          </div>

          {/* Top N */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Top Materiales
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

          {/* Materiales — full width row */}
          <div className="sm:col-span-2 lg:col-span-5">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Materiales
            </label>
            <MultiSelectDropdown
              options={filters.materiales ?? []}
              selected={selectedMateriales}
              onChange={setSelectedMateriales}
              allLabel="Todos los materiales"
            />
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <KpiCard
              label="Costo Total Materiales"
              value={fmtQ(data.totals.costoTotal)}
              color="bg-amber-50 text-amber-700"
            />
            <KpiCard
              label="Despachos"
              value={data.totals.totalDespachos.toLocaleString()}
              color="bg-blue-50 text-blue-700"
            />
            <KpiCard
              label="Materiales Distintos"
              value={data.totals.materialesUnicos.toLocaleString()}
              color="bg-violet-50 text-violet-700"
            />
            <KpiCard
              label="Cantidad Total"
              value={data.totals.cantidadTotal.toLocaleString("es-GT", { maximumFractionDigits: 0 })}
              color="bg-emerald-50 text-emerald-700"
            />
            <KpiCard
              label="Destinos"
              value={data.totals.destinosCount.toLocaleString()}
              sub={data.pareto.length > 0 ? `Top: ${data.pareto[0].material.slice(0, 18)}` : undefined}
              color="bg-cyan-50 text-cyan-700"
            />
          </div>

          {/* ── Tab Navigation ── */}
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
            {([
              ["pareto", "Pareto Materiales"],
              ["porUnidad", "Por Unidad Costo"],
              ["matriz", "Matriz Material\u00D7Destino"],
              ["comparativa", "Comparativa Destinos"],
              ["barMaterial", "Barra por Material"],
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

          {/* ── Charts ── */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            {activeTab === "pareto" && <ParetoChart data={data.pareto} />}
            {activeTab === "porUnidad" && (
              <PorUnidadCostoChart data={data.porUnidadCosto} topMaterials={data.topMaterials} />
            )}
            {activeTab === "matriz" && (
              <MatrizView matrix={data.matrix} destinos={data.matrixDestinos} />
            )}
            {activeTab === "comparativa" && (
              <ComparativaTable rows={data.comparativa} />
            )}
            {activeTab === "barMaterial" && (
              <BarMaterialChart pareto={data.pareto} />
            )}
          </div>
        </>
      )}

      {data && !loading && data.totals.totalDespachos === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <p className="text-lg font-medium text-gray-400">
            No hay datos para esta combinacion de filtros
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Pareto Chart ───
function ParetoChart({ data }: { data: ParetoItem[] }) {
  const chartData = data.slice(0, 25).map((d) => ({
    name: shortLabel(d.material),
    fullName: d.material,
    costo: d.costo,
    pct: d.pct,
    cumPct: d.cumPct,
    cantidad: d.cantidad,
    despachos: d.despachos,
    unidadMedida: d.unidadMedida,
  }));

  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold text-gray-700">
        Pareto de Materiales por Costo (Top {chartData.length})
      </h3>
      <ResponsiveContainer width="100%" height={Math.max(450, chartData.length * 28)}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            type="number"
            tickFormatter={(v) => fmtQ(v)}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={160}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0]?.payload;
              return (
                <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-lg">
                  <p className="mb-1.5 font-semibold text-gray-900">{d?.fullName || label}</p>
                  <p className="flex justify-between gap-4 text-amber-600">
                    <span>Costo</span>
                    <span className="font-mono font-semibold">{fmtQ(d?.costo || 0)}</span>
                  </p>
                  <p className="flex justify-between gap-4 text-gray-600">
                    <span>% del total</span>
                    <span className="font-mono font-semibold">{fmtPct(d?.pct || 0)}</span>
                  </p>
                  <p className="flex justify-between gap-4 text-emerald-600">
                    <span>% acumulado</span>
                    <span className="font-mono font-semibold">{fmtPct(d?.cumPct || 0)}</span>
                  </p>
                  <p className="flex justify-between gap-4 text-blue-600">
                    <span>Cantidad</span>
                    <span className="font-mono font-semibold">{(d?.cantidad || 0).toLocaleString()} {d?.unidadMedida || ""}</span>
                  </p>
                  <p className="flex justify-between gap-4 text-gray-500">
                    <span>Despachos</span>
                    <span className="font-mono font-semibold">{d?.despachos || 0}</span>
                  </p>
                </div>
              );
            }}
          />
          <Bar
            dataKey="costo"
            fill="#f59e0b"
            radius={[0, 4, 4, 0]}
            name="Costo"
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={i < 3 ? "#f59e0b" : i < 8 ? "#fbbf24" : "#fcd34d"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Pareto summary: cumulative percentage badges */}
      {data.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {data.slice(0, 10).map((d, i) => (
              <span
                key={d.material}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  d.cumPct <= 80
                    ? "bg-amber-100 text-amber-800"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                <span className="font-semibold">{i + 1}.</span>
                {shortLabel(d.material, 16)}
                <span className="font-mono text-[10px] opacity-70">{fmtPct(d.cumPct)}</span>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            {(() => {
              const at80 = data.findIndex((d) => d.cumPct >= 80);
              return at80 >= 0
                ? `${at80 + 1} materiales representan el 80% del costo (regla 80/20)`
                : "Todos los materiales suman menos del 80%";
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Por Unidad de Costo — Stacked Horizontal Bars ───
function PorUnidadCostoChart({ data, topMaterials }: { data: Record<string, string | number>[]; topMaterials: string[] }) {
  const chartData = data.slice(0, 15).map((d) => ({
    ...d,
    name: shortLabel(String(d.name || ""), 25),
  }));

  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold text-gray-700">
        Costo de Materiales por Unidad de Costo
      </h3>
      <ResponsiveContainer width="100%" height={Math.max(400, chartData.length * 40)}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" tickFormatter={(v) => fmtQ(v)} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 11 }} />
          <Tooltip content={<CostTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          {topMaterials.map((mat, i) => (
            <Bar
              key={mat}
              dataKey={mat}
              stackId="a"
              fill={MAT_COLORS[i % MAT_COLORS.length]}
              name={shortLabel(mat, 18)}
              radius={i === topMaterials.length - 1 ? [0, 4, 4, 0] : undefined}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Matrix Material × Destino ───
function MatrizView({ matrix, destinos }: { matrix: MatrixRow[]; destinos: string[] }) {
  const visibleDestinos = destinos.slice(0, 20);
  const maxCosto = Math.max(
    ...matrix.flatMap((m) =>
      Object.values(m.destinos).map((d) => d.costo)
    ),
    1
  );

  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold text-gray-700">
        Matriz Material &times; Destino (Top {matrix.length} materiales, {visibleDestinos.length} destinos)
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <th className="sticky left-0 z-10 bg-white px-3 py-2">Material</th>
              <th className="px-2 py-2 text-right">Total</th>
              {visibleDestinos.map((d) => (
                <th key={d} className="px-2 py-2 text-center min-w-[80px]" title={d}>
                  {shortLabel(d, 12)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.slice(0, 30).map((row) => (
              <tr key={row.material} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="sticky left-0 z-10 bg-white px-3 py-2 font-medium text-gray-900 max-w-[200px] truncate" title={row.material}>
                  {row.material}
                </td>
                <td className="px-2 py-2 text-right font-mono font-semibold text-gray-900 whitespace-nowrap">
                  {fmtQ(row.total)}
                </td>
                {visibleDestinos.map((dest) => {
                  const cell = row.destinos[dest];
                  if (!cell || cell.costo === 0) {
                    return <td key={dest} className="px-2 py-2 text-center text-gray-200">&mdash;</td>;
                  }
                  const intensity = Math.min(cell.costo / maxCosto, 1);
                  const bg = `rgba(245, 158, 11, ${0.1 + intensity * 0.5})`;
                  return (
                    <td key={dest} className="px-2 py-2 text-center" style={{ backgroundColor: bg }}>
                      <span className="font-mono text-[11px] font-semibold text-gray-800">
                        {fmtQ(cell.costo)}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[10px] text-gray-400">
        Intensidad del color indica magnitud del costo relativo al valor maximo
      </p>
    </div>
  );
}

// ─── Comparativa por Destino ───
function ComparativaTable({ rows }: { rows: ComparativaRow[] }) {
  const maxCosto = Math.max(...rows.map((r) => r.costoTotal), 1);

  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold text-gray-700">
        Comparativa de Materiales por Destino ({rows.length})
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <th className="px-3 py-2 w-8">#</th>
              <th className="px-3 py-2">Destino</th>
              <th className="px-3 py-2 text-right">Costo Total</th>
              <th className="px-3 py-2 text-right">Cantidad</th>
              <th className="px-3 py-2 text-center">Despachos</th>
              <th className="px-3 py-2 text-center">Mat. Distintos</th>
              <th className="px-3 py-2 text-right">Costo / Despacho</th>
              <th className="px-3 py-2 w-48">Proporcion</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const costPerDespacho = r.despachos > 0 ? r.costoTotal / r.despachos : 0;
              const pct = maxCosto > 0 ? (r.costoTotal / maxCosto) * 100 : 0;

              return (
                <tr key={r.destino} className="border-b border-gray-100 transition-colors hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs text-gray-400">{i + 1}</td>
                  <td className="px-3 py-2 font-medium text-gray-900 max-w-[200px] truncate" title={r.destino}>
                    {r.destino}
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-semibold text-amber-700">
                    {fmtQ(r.costoTotal)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-gray-600">
                    {r.cantidadTotal.toLocaleString("es-GT", { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-3 py-2 text-center font-mono">{r.despachos}</td>
                  <td className="px-3 py-2 text-center font-mono">{r.materialesUnicos}</td>
                  <td className="px-3 py-2 text-right font-mono text-gray-600">
                    {fmtQ(costPerDespacho)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex h-4 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        style={{ width: `${pct}%` }}
                        className="bg-amber-400 rounded-full"
                        title={fmtPct(pct)}
                      />
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

// ─── Bar Chart by Material (horizontal bars showing cost per material) ───
function BarMaterialChart({ pareto }: { pareto: ParetoItem[] }) {
  const chartData = pareto.slice(0, 20).map((d) => ({
    name: shortLabel(d.material),
    fullName: d.material,
    costo: d.costo,
    cantidad: d.cantidad,
    despachos: d.despachos,
    unidadMedida: d.unidadMedida,
  }));

  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold text-gray-700">
        Costo por Material (Top {chartData.length})
      </h3>
      <ResponsiveContainer width="100%" height={Math.max(400, chartData.length * 32)}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" tickFormatter={(v) => fmtQ(v)} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11 }} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0]?.payload;
              return (
                <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-lg">
                  <p className="mb-1.5 font-semibold text-gray-900">{d?.fullName || label}</p>
                  <p className="flex justify-between gap-4 text-amber-600">
                    <span>Costo</span>
                    <span className="font-mono font-semibold">{fmtQ(d?.costo || 0)}</span>
                  </p>
                  <p className="flex justify-between gap-4 text-blue-600">
                    <span>Cantidad</span>
                    <span className="font-mono font-semibold">{(d?.cantidad || 0).toLocaleString()} {d?.unidadMedida || ""}</span>
                  </p>
                  <p className="flex justify-between gap-4 text-gray-500">
                    <span>Despachos</span>
                    <span className="font-mono font-semibold">{d?.despachos || 0}</span>
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="costo" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Costo">
            {chartData.map((_, i) => (
              <Cell key={i} fill={MAT_COLORS[i % MAT_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
