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
  unidadCosto: [],
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
  if (state.unidadCosto.length > 0)
    params.set("unidadCosto", state.unidadCosto.join("||"));
  if (state.subdestino) params.set("subdestino", state.subdestino);
  if (state.fechaDesde) params.set("fechaDesde", state.fechaDesde);
  if (state.fechaHasta) params.set("fechaHasta", state.fechaHasta);
  return params;
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Costos Detallados por Destino
          </h1>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-lg font-medium text-red-700">
            Error al conectar con la base de datos
          </p>
          <p className="mt-2 text-sm text-red-500">{error}</p>
          <p className="mt-4 text-xs text-red-400">
            Verifica que PostgreSQL est&eacute; corriendo y la variable DATABASE_URL est&eacute; configurada
          </p>
        </div>
      </div>
    );
  }

  if (!filters) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Costos Detallados por Destino
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Ficha anal&iacute;tica de costo para un destino espec&iacute;fico
        </p>
      </div>

      {/* Filters */}
      <FilterPanel filters={filters} state={state} dispatch={dispatch} />

      {/* No destino selected */}
      {!state.destino && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-lg font-medium text-gray-400">
            Selecciona un destino para ver el an&aacute;lisis
          </p>
          <p className="mt-1 text-sm text-gray-300">
            Usa el filtro de arriba para elegir un destino
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      )}

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
              className="w-full rounded-xl border border-dashed border-gray-300 bg-white py-6 text-sm font-medium text-gray-500 hover:border-brand-500 hover:text-brand-600 transition-colors"
            >
              Cargar Actividades y An&aacute;lisis de MOD
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
              className="w-full rounded-xl border border-dashed border-gray-300 bg-white py-6 text-sm font-medium text-gray-500 hover:border-brand-500 hover:text-brand-600 transition-colors"
            >
              Cargar Materiales Principales y Matriz
            </button>
          ) : (
            <MaterialesSection data={matData} />
          )}
        </>
      )}
    </div>
  );
}
