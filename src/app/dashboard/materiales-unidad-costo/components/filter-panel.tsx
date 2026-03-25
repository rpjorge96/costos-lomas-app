"use client";

import { useState, useEffect, useRef } from "react";
import type { MaterialesUCFilters, FilterState, FilterAction } from "../types";

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

// ─── Filter Panel ───

interface FilterPanelProps {
  filters: MaterialesUCFilters;
  state: FilterState;
  dispatch: React.ActionDispatch<[action: FilterAction]>;
}

export function FilterPanel({ filters, state, dispatch }: FilterPanelProps) {
  const destinoOptions = filters.destinos.map((d) => ({
    value: d.value,
    label: d.value,
    sub: [d.tipo, d.descripcion].filter(Boolean).join(" · "),
  }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Periodo */}
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Período
          </label>
          <select
            value={state.periodId}
            onChange={(e) =>
              dispatch({ type: "SET_PERIOD", value: e.target.value })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none"
          >
            <option value="">Todos los períodos</option>
            {filters.periodos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Destino */}
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Destino
          </label>
          <SearchableSelect
            options={destinoOptions}
            value={state.destino}
            onChange={(v) => dispatch({ type: "SET_DESTINO", value: v })}
            placeholder="Seleccionar destino..."
            renderOption={(o) => (
              <div className="min-w-0">
                <p className="truncate font-medium">{o.value}</p>
                {o.sub && (
                  <p className="truncate text-xs text-gray-400">{o.sub}</p>
                )}
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
}
