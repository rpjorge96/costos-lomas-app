"use client";

import { useState, useEffect, useRef } from "react";
import type {
  DestinoFilters,
  FilterOption,
  FilterState,
  FilterAction,
} from "../types";

// ─── Searchable Single-Select ───
function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  renderOption,
}: {
  options: { value: string; label: string; sub?: string }[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  renderOption?: (o: { value: string; label: string; sub?: string }) => React.ReactNode;
}) {
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

  const filtered = options.filter(
    (o) =>
      o.value.toLowerCase().includes(search.toLowerCase()) ||
      o.label.toLowerCase().includes(search.toLowerCase()) ||
      (o.sub && o.sub.toLowerCase().includes(search.toLowerCase()))
  );

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none
          ${value
            ? "border-brand-400 bg-brand-50 text-brand-800 font-medium"
            : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 focus:border-brand-500"
          }`}
      >
        <span className="truncate text-left">
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""} ${value ? "text-brand-500" : "text-gray-400"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[320px] rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-100 p-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
              autoFocus
            />
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
            {filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                  setSearch("");
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                  o.value === value ? "bg-brand-50 font-medium text-brand-700" : "text-gray-700"
                }`}
              >
                {renderOption ? (
                  renderOption(o)
                ) : (
                  <span className="truncate">{o.label}</span>
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-gray-400">
                Sin resultados
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Multi-Select Dropdown ───
function MultiSelectDropdown({
  options,
  selected,
  onChange,
  allLabel = "Todas",
}: {
  options: FilterOption[];
  selected: string[] | null;
  onChange: (next: string[] | null) => void;
  allLabel?: string;
}) {
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

  // null = todas, [] = ninguna, [items] = selección específica
  const isAll = selected === null;
  const filtered = options.filter((o) =>
    o.value.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(value: string) {
    if (isAll) {
      // En modo "todas", desmarcar una → todas excepto esa
      onChange(options.map((o) => o.value).filter((v) => v !== value));
    } else if (selected.includes(value)) {
      // Desmarcar item existente
      onChange(selected.filter((v) => v !== value));
    } else {
      // Marcar nuevo item; si quedan todas marcadas → volver a "todas"
      const next = [...selected, value];
      onChange(next.length === options.length ? null : next);
    }
  }

  let label: string;
  if (isAll) label = allLabel;
  else if (selected.length === 0) label = "Ninguna";
  else if (selected.length === 1) label = selected[0];
  else label = `${selected.length} seleccionadas`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none
          ${!isAll
            ? "border-brand-400 bg-brand-50 text-brand-800 font-medium"
            : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 focus:border-brand-500"
          }`}
      >
        <span className="truncate text-left">{label}</span>
        <svg
          className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""} ${!isAll ? "text-brand-500" : "text-gray-400"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-80 rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-100 p-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar unidad..."
              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
              autoFocus
            />
          </div>
          <div className="flex gap-2 border-b border-gray-100 px-3 py-1.5 text-xs">
            <button
              type="button"
              onClick={() => onChange(null)}
              className={`font-medium hover:underline ${isAll ? "text-brand-500" : "text-gray-400"}`}
            >
              Todas
            </button>
            <span className="text-gray-300">·</span>
            <button
              type="button"
              onClick={() => onChange([])}
              className={`font-medium hover:underline ${!isAll && selected.length === 0 ? "text-brand-500" : "text-gray-400"}`}
            >
              Ninguna
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
            {filtered.map((o) => (
              <label
                key={o.value}
                className="flex cursor-pointer items-center gap-2.5 px-3 py-1.5 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={isAll || selected.includes(o.value)}
                  onChange={() => toggle(o.value)}
                  className="h-4 w-4 shrink-0 rounded border-gray-300 accent-brand-500"
                />
                <span className="flex-1 text-sm text-gray-700">{o.value}</span>
                <span className="text-[11px] text-gray-400">
                  {o.count.toLocaleString()}
                </span>
              </label>
            ))}
          </div>
          <div className="border-t border-gray-100 px-3 py-1.5 text-[11px] text-gray-400">
            {isAll
              ? `${options.length} unidades (todas)`
              : `${selected.length} de ${options.length} seleccionadas`}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Filter Panel ───

interface FilterPanelProps {
  filters: DestinoFilters;
  state: FilterState;
  dispatch: React.Dispatch<FilterAction>;
}

export function FilterPanel({ filters, state, dispatch }: FilterPanelProps) {
  // Count active filters (excluding destino which is primary)
  const activeCount = [
    state.periodId,
    state.tipoDestino,
    state.subdestino,
    state.fechaDesde,
    state.fechaHasta,
    state.soloConMod,
    state.soloMaterialesPrincipales,
    state.unidadCosto !== null,
  ].filter(Boolean).length;

  const hasAnyFilter = !!state.destino || activeCount > 0;

  const filteredDestinos = state.tipoDestino
    ? filters.destinos.filter((d) => d.tipo === state.tipoDestino)
    : filters.destinos;

  const destinoOptions = filteredDestinos.map((d) => ({
    value: d.value,
    label: d.value,
    sub: [d.tipo, d.descripcion].filter(Boolean).join(" · "),
  }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Panel header */}
      <div className="flex items-center justify-between gap-4 px-4 py-2.5 bg-gray-50/80 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
          </svg>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Filtros</span>
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center h-4 min-w-4 rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </div>
        {hasAnyFilter && (
          <button
            type="button"
            onClick={() => dispatch({ type: "RESET" })}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Filter grid */}
      <div className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {/* Destino — Primary selector */}
          <div className="lg:col-span-2">
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Destino
            </label>
            <SearchableSelect
              options={destinoOptions}
              value={state.destino}
              onChange={(v) => dispatch({ type: "SET_DESTINO", value: v })}
              placeholder="Seleccionar destino..."
              renderOption={(o) => (
                <div className="min-w-0">
                  <p className="truncate font-medium">{o.label}</p>
                  {o.sub && (
                    <p className="truncate text-[11px] text-gray-400">{o.sub}</p>
                  )}
                </div>
              )}
            />
          </div>

          {/* Período */}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Periodo
            </label>
            <select
              value={state.periodId}
              onChange={(e) => dispatch({ type: "SET_PERIOD", value: e.target.value })}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none transition-colors
                ${state.periodId ? "border-brand-400 bg-brand-50 text-brand-800 font-medium" : "border-gray-300"}`}
            >
              <option value="">Todos</option>
              {filters.periodos.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Tipo Destino */}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Tipo / Modelo
            </label>
            <select
              value={state.tipoDestino}
              onChange={(e) => dispatch({ type: "SET_TIPO", value: e.target.value })}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none transition-colors
                ${state.tipoDestino ? "border-brand-400 bg-brand-50 text-brand-800 font-medium" : "border-gray-300"}`}
            >
              <option value="">Todos</option>
              {filters.tiposDestino.map((t) => (
                <option key={t.value} value={t.value}>{t.value} ({t.count})</option>
              ))}
            </select>
          </div>

          {/* Subdestino */}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Subdestino
            </label>
            <select
              value={state.subdestino}
              onChange={(e) => dispatch({ type: "SET_SUBDESTINO", value: e.target.value })}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none transition-colors
                ${state.subdestino ? "border-brand-400 bg-brand-50 text-brand-800 font-medium" : "border-gray-300"}`}
            >
              <option value="">Todos</option>
              {filters.subdestinos.map((s, idx) => (
                <option key={`sub-${idx}`} value={s.value}>{s.value} ({s.count})</option>
              ))}
            </select>
          </div>

          {/* Unidad de Costo */}
          <div className="lg:col-span-2">
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Unidad de Costo
            </label>
            <MultiSelectDropdown
              options={filters.unidadesCosto}
              selected={state.unidadCosto}
              onChange={(v) => dispatch({ type: "SET_UC", value: v })}
              allLabel="Todas las unidades"
            />
          </div>

          {/* Fecha desde */}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Fecha desde
            </label>
            <input
              type="date"
              value={state.fechaDesde}
              onChange={(e) => dispatch({ type: "SET_FECHA_DESDE", value: e.target.value })}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none transition-colors
                ${state.fechaDesde ? "border-brand-400 bg-brand-50 text-brand-800" : "border-gray-300"}`}
            />
          </div>

          {/* Fecha hasta */}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Fecha hasta
            </label>
            <input
              type="date"
              value={state.fechaHasta}
              onChange={(e) => dispatch({ type: "SET_FECHA_HASTA", value: e.target.value })}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none transition-colors
                ${state.fechaHasta ? "border-brand-400 bg-brand-50 text-brand-800" : "border-gray-300"}`}
            />
          </div>

          {/* Toggles */}
          <div className="flex items-end gap-4 lg:col-span-2">
            <label className={`flex items-center gap-2 text-sm cursor-pointer px-3 py-2 rounded-lg border transition-colors
              ${state.soloConMod ? "border-brand-300 bg-brand-50 text-brand-700" : "border-transparent text-gray-600 hover:bg-gray-50"}`}
            >
              <input
                type="checkbox"
                checked={state.soloConMod}
                onChange={() => dispatch({ type: "TOGGLE_MOD" })}
                className="h-4 w-4 rounded border-gray-300 accent-brand-500"
              />
              Solo con MOD
            </label>
            <label className={`flex items-center gap-2 text-sm cursor-pointer px-3 py-2 rounded-lg border transition-colors
              ${state.soloMaterialesPrincipales ? "border-brand-300 bg-brand-50 text-brand-700" : "border-transparent text-gray-600 hover:bg-gray-50"}`}
            >
              <input
                type="checkbox"
                checked={state.soloMaterialesPrincipales}
                onChange={() => dispatch({ type: "TOGGLE_MATERIALES" })}
                className="h-4 w-4 rounded border-gray-300 accent-brand-500"
              />
              Solo mat. principales
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
