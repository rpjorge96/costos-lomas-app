"use client";

import { useState, useEffect, useCallback, useReducer } from "react";
import type {
  DestinoFilters,
  FilterState,
  FilterAction,
  DashboardData,
  ActividadesData,
  MaterialesData,
} from "./types";
import { FilterPanel } from "./components/filter-panel";
import { KpiSection } from "./components/kpi-section";
import { DesgloseUnidadChart } from "./components/desglose-unidad-chart";
import { TablaResumenUC } from "./components/tabla-resumen-uc";
import { ActividadesModSection } from "./components/actividades-mod-section";
import { MaterialesSection } from "./components/materiales-section";
import { ParticipacionRubro } from "./components/participacion-rubro";
import { RankingUC } from "./components/ranking-uc";

// ─── Filter Reducer ───

const initialFilter: FilterState = {
  periodId: "",
  destino: "",
  tipoDestino: "",
  unidadCosto: null,
  subdestino: "",
  fechaDesde: "",
  fechaHasta: "",
  soloConMod: false,
  soloMaterialesPrincipales: false,
};

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case "SET_PERIOD":
      return { ...state, periodId: action.value, destino: "" };
    case "SET_DESTINO":
      return { ...state, destino: action.value };
    case "SET_TIPO":
      return { ...state, tipoDestino: action.value, destino: "" };
    case "SET_UC":
      return { ...state, unidadCosto: action.value };
    case "SET_SUBDESTINO":
      return { ...state, subdestino: action.value };
    case "SET_FECHA_DESDE":
      return { ...state, fechaDesde: action.value };
    case "SET_FECHA_HASTA":
      return { ...state, fechaHasta: action.value };
    case "TOGGLE_MOD":
      return { ...state, soloConMod: !state.soloConMod };
    case "TOGGLE_MATERIALES":
      return { ...state, soloMaterialesPrincipales: !state.soloMaterialesPrincipales };
    case "RESET":
      return initialFilter;
    default:
      return state;
  }
}

// ─── Build query params from filter state ───

function buildParams(state: FilterState): URLSearchParams {
  const params = new URLSearchParams({ destino: state.destino });
  if (state.periodId) params.set("periodId", state.periodId);
  if (state.unidadCosto !== null && state.unidadCosto.length > 0)
    params.set("unidadCosto", state.unidadCosto.join("||"));
  if (state.subdestino) params.set("subdestino", state.subdestino);
  if (state.fechaDesde) params.set("fechaDesde", state.fechaDesde);
  if (state.fechaHasta) params.set("fechaHasta", state.fechaHasta);
  return params;
}

// ─── Skeleton Loader ───

function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Banner skeleton */}
      <div className="h-16 rounded-xl bg-gray-200" />
      {/* KPI row 1 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-gray-100" />
        ))}
      </div>
      {/* KPI row 2 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-gray-100" />
        ))}
      </div>
      {/* Chart skeleton */}
      <div className="h-64 rounded-xl bg-gray-100" />
      {/* Table skeleton */}
      <div className="rounded-xl bg-gray-100 overflow-hidden">
        <div className="h-10 bg-gray-200" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 border-t border-gray-200 bg-gray-50" />
        ))}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───

export function CostosDestinoDashboard() {
  const [filters, setFilters] = useState<DestinoFilters | null>(null);
  const [state, dispatch] = useReducer(filterReducer, initialFilter);

  // Data
  const [data, setData] = useState<DashboardData | null>(null);
  const [actData, setActData] = useState<ActividadesData | null>(null);
  const [matData, setMatData] = useState<MaterialesData | null>(null);
  const [loading, setLoading] = useState(false);

  // Lazy-load triggers
  const [showActividades, setShowActividades] = useState(false);
  const [showMateriales, setShowMateriales] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // ── Fetch filters ──
  useEffect(() => {
    const params = state.periodId ? `?periodId=${state.periodId}` : "";
    fetch(`/api/dashboard/costos-destino/filters${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error);
        } else {
          setFilters(d);
          setError(null);
        }
      })
      .catch((e) => setError(e.message));
  }, [state.periodId]);

  // ── Fetch main data when destino changes ──
  const fetchData = useCallback(async () => {
    if (!state.destino) return;
    setLoading(true);
    setActData(null);
    setMatData(null);
    setShowActividades(false);
    setShowMateriales(false);
    try {
      const params = buildParams(state);
      const res = await fetch(
        `/api/dashboard/costos-destino/data?${params}`
      );
      const d = await res.json();
      setData(d);
    } finally {
      setLoading(false);
    }
  }, [state.destino, state.periodId, state.unidadCosto, state.subdestino, state.fechaDesde, state.fechaHasta]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Lazy fetch: actividades ──
  useEffect(() => {
    if (!showActividades || !state.destino || actData) return;
    const params = buildParams(state);
    fetch(`/api/dashboard/costos-destino/actividades?${params}`)
      .then((r) => r.json())
      .then(setActData);
  }, [showActividades, state.destino, state.periodId, state.unidadCosto, state.subdestino, state.fechaDesde, state.fechaHasta]);

  // ── Lazy fetch: materiales ──
  useEffect(() => {
    if (!showMateriales || !state.destino || matData) return;
    const params = buildParams(state);
    fetch(`/api/dashboard/costos-destino/materiales?${params}`)
      .then((r) => r.json())
      .then(setMatData);
  }, [showMateriales, state.destino, state.periodId, state.unidadCosto, state.subdestino, state.fechaDesde, state.fechaHasta]);

  // ── Loading / Error state ──
  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-red-700">Error al conectar con la base de datos</p>
          <p className="mt-2 text-sm text-red-500">{error}</p>
          <p className="mt-4 text-xs text-red-400">
            Verifica que PostgreSQL esté corriendo y la variable DATABASE_URL esté configurada
          </p>
        </div>
      </div>
    );
  }

  if (!filters) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <p className="text-sm text-gray-400">Cargando filtros…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader />

      {/* Filters */}
      <FilterPanel filters={filters} state={state} dispatch={dispatch} />

      {/* No destino selected */}
      {!state.destino && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
            <svg className="h-7 w-7 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </div>
          <p className="text-base font-semibold text-gray-500">Selecciona un destino para comenzar</p>
          <p className="mt-1.5 text-sm text-gray-400">
            Usa el filtro de <span className="font-medium text-brand-500">Destino</span> para ver el análisis de costos
          </p>
          <div className="mt-4 flex justify-center">
            <svg className="h-5 w-5 text-brand-300 -rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
            </svg>
          </div>
        </div>
      )}

      {/* Skeleton Loader */}
      {loading && <DashboardSkeleton />}

      {/* Dashboard content */}
      {data && !loading && state.destino && (
        <>
          {/* Section 1: KPIs */}
          <KpiSection kpis={data.kpis} />

          {/* Section 2: Desglose por UC */}
          <DesgloseUnidadChart unidadesCosto={data.unidadesCosto} />

          {/* Section 3: Tabla resumen UC */}
          <TablaResumenUC unidadesCosto={data.unidadesCosto} />

          {/* Section 6: Participación por rubro */}
          <ParticipacionRubro
            participacionGlobal={data.participacionGlobal}
            unidadesCosto={data.unidadesCosto}
          />

          {/* Section 7: Ranking UCs */}
          <RankingUC unidadesCosto={data.unidadesCosto} />

          {/* Section 4: Actividades + MOD (lazy) */}
          {!showActividades ? (
            <button
              onClick={() => setShowActividades(true)}
              className="group w-full rounded-xl border-2 border-dashed border-gray-200 bg-white py-5 transition-all duration-200 hover:border-brand-400 hover:bg-brand-50"
            >
              <div className="flex items-center justify-center gap-2.5 text-sm font-medium text-gray-400 group-hover:text-brand-600 transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Cargar Actividades y Análisis de MOD
              </div>
            </button>
          ) : (
            <ActividadesModSection
              data={actData}
              unidadesCosto={data.unidadesCosto.map((u) => u.unidadCosto)}
            />
          )}

          {/* Section 5 + 8: Materiales (lazy) */}
          {!showMateriales ? (
            <button
              onClick={() => setShowMateriales(true)}
              className="group w-full rounded-xl border-2 border-dashed border-gray-200 bg-white py-5 transition-all duration-200 hover:border-brand-400 hover:bg-brand-50"
            >
              <div className="flex items-center justify-center gap-2.5 text-sm font-medium text-gray-400 group-hover:text-brand-600 transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Cargar Materiales Principales y Matriz
              </div>
            </button>
          ) : (
            <MaterialesSection data={matData} />
          )}
        </>
      )}
    </div>
  );
}

function PageHeader() {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 shadow-sm">
        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">
          Costos Detallados por Destino
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Ficha analítica de costo para un destino específico
        </p>
      </div>
    </div>
  );
}
