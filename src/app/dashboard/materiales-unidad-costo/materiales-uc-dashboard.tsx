"use client";

import { useState, useEffect, useCallback, useReducer } from "react";
import type {
  MaterialesUCFilters,
  FilterState,
  FilterAction,
  DashboardData,
} from "./types";
import { FilterPanel } from "./components/filter-panel";
import { KpiSection } from "./components/kpi-section";
import { DistribucionChart } from "./components/distribucion-chart";
import { UCMaterialesList } from "./components/uc-materiales-list";
import { TopMaterialesTable } from "./components/top-materiales-table";

// ─── Filter Reducer ───

const initialFilter: FilterState = {
  periodId: "",
  destino: "",
};

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case "SET_PERIOD":
      return { ...state, periodId: action.value, destino: "" };
    case "SET_DESTINO":
      return { ...state, destino: action.value };
    case "RESET":
      return initialFilter;
    default:
      return state;
  }
}

// ─── Build query params ───

function buildParams(state: FilterState): URLSearchParams {
  const params = new URLSearchParams({ destino: state.destino });
  if (state.periodId) params.set("periodId", state.periodId);
  return params;
}

// ─── Skeleton Loader ───

function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Banner skeleton */}
      <div className="h-16 rounded-xl bg-gray-200" />
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-gray-100" />
        ))}
      </div>
      {/* Chart skeleton */}
      <div className="h-64 rounded-xl bg-gray-100" />
      {/* List skeleton */}
      <div className="rounded-xl bg-gray-100 overflow-hidden">
        <div className="h-10 bg-gray-200" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 border-t border-gray-200 bg-gray-50" />
        ))}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───

export function MaterialesUCDashboard() {
  const [filters, setFilters] = useState<MaterialesUCFilters | null>(null);
  const [state, dispatch] = useReducer(filterReducer, initialFilter);

  // Data
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch filters ──
  useEffect(() => {
    const params = state.periodId ? `?periodId=${state.periodId}` : "";
    fetch(`/api/dashboard/materiales-uc/filters${params}`)
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
    try {
      const params = buildParams(state);
      const res = await fetch(
        `/api/dashboard/materiales-uc/data?${params}`
      );
      const d = await res.json();
      if (d.error) {
        setError(d.error);
      } else {
        setData(d);
        setError(null);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [state.destino, state.periodId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Error state ──
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

  // ── Loading filters ──
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
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
            <svg className="h-7 w-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <p className="text-base font-semibold text-gray-500">Selecciona un destino para comenzar</p>
          <p className="mt-1.5 text-sm text-gray-400">
            Usa el filtro de <span className="font-medium text-amber-500">Destino</span> para ver los materiales por unidad de costo
          </p>
          <div className="mt-4 flex justify-center">
            <svg className="h-5 w-5 text-amber-300 -rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
          {/* KPIs */}
          <KpiSection kpis={data.kpis} />

          {/* Stacked bar chart */}
          <DistribucionChart unidadesCosto={data.unidadesCosto} />

          {/* Expandable UC list */}
          <UCMaterialesList unidadesCosto={data.unidadesCosto} />

          {/* Global materials ranking */}
          <TopMaterialesTable unidadesCosto={data.unidadesCosto} />
        </>
      )}
    </div>
  );
}

function PageHeader() {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-600 shadow-sm">
        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">
          Materiales por Unidad de Costo
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Detalle de materiales consumidos por cada unidad de costo en un destino
        </p>
      </div>
    </div>
  );
}
