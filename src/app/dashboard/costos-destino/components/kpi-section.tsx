import type { DestinoKPIs } from "../types";
import { fmtQ, fmtPct } from "../constants";
import { KpiCard } from "./shared/kpi-card";

interface Props {
  kpis: DestinoKPIs;
}

// Mini SVG icons for KPI cards
const IconMoney = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconPeople = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);
const IconBox = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
  </svg>
);
const IconCog = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const IconList = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);
const IconActivity = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
  </svg>
);

export function KpiSection({ kpis }: Props) {
  const matTotal = kpis.costoMateriales;
  const costoTotal = kpis.costoTotal;

  const keyMatData = [
    { label: "Cemento", costo: kpis.costoCemento },
    { label: "Arena", costo: kpis.costoArena },
    { label: "Piedrín", costo: kpis.costoPiedrin },
    { label: "Hierro", costo: kpis.costoHierro },
    { label: "Block", costo: kpis.costoBlock },
  ];

  return (
    <div className="space-y-3">
      {/* Destino header — banner con gradiente */}
      <div className="rounded-xl overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 px-5 py-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {/* Icono destino */}
            <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-lg font-bold text-white tracking-tight">{kpis.destino}</h2>
              {kpis.tipo && (
                <span className="rounded-full bg-white/15 border border-white/20 px-2.5 py-0.5 text-xs font-semibold text-white/90">
                  {kpis.tipo}
                </span>
              )}
              {kpis.descripcion && (
                <span className="text-sm text-brand-200/80">{kpis.descripcion}</span>
              )}
            </div>
          </div>
        </div>
        {/* Accent stripe */}
        <div className="h-0.5 bg-gradient-to-r from-accent-500 via-accent-400 to-accent-300" />
      </div>

      {/* Row 1: Main KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        <KpiCard
          label="Costo Total"
          value={fmtQ(kpis.costoTotal)}
          color="bg-emerald-50 text-emerald-700"
          accentColor="bg-emerald-400"
          icon={<IconMoney />}
        />
        <KpiCard
          label="MOD"
          value={fmtQ(kpis.costoMod)}
          sub={fmtPct(kpis.pctMod)}
          color="bg-blue-50 text-blue-700"
          accentColor="bg-blue-400"
          icon={<IconPeople />}
        />
        <KpiCard
          label="MOI"
          value={fmtQ(kpis.costoMoi)}
          sub={fmtPct(kpis.pctMoi)}
          color="bg-violet-50 text-violet-700"
          accentColor="bg-violet-400"
          icon={<IconPeople />}
        />
        <KpiCard
          label="Materiales"
          value={fmtQ(kpis.costoMateriales)}
          sub={fmtPct(kpis.pctMateriales)}
          color="bg-amber-50 text-amber-700"
          accentColor="bg-amber-400"
          icon={<IconBox />}
        />
        <KpiCard
          label="Maquinaria"
          value={fmtQ(kpis.costoMaquinaria)}
          sub={fmtPct(kpis.pctMaquinaria)}
          color="bg-red-50 text-red-700"
          accentColor="bg-red-400"
          icon={<IconCog />}
        />
        <KpiCard
          label="Unidades Costo"
          value={kpis.numUnidadesCosto.toLocaleString()}
          color="bg-purple-50 text-purple-700"
          accentColor="bg-purple-400"
          icon={<IconList />}
        />
        <KpiCard
          label="Actividades"
          value={kpis.numActividades.toLocaleString()}
          sub={`${kpis.numActividadesConMod} con MOD`}
          color="bg-cyan-50 text-cyan-700"
          accentColor="bg-cyan-400"
          icon={<IconActivity />}
        />
      </div>

      {/* Row 2: Key materials */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {keyMatData.map((m) => {
          const pctMat = matTotal > 0 ? (m.costo / matTotal) * 100 : 0;
          const pctTotal = costoTotal > 0 ? (m.costo / costoTotal) * 100 : 0;
          return (
            <KpiCard
              key={m.label}
              label={m.label}
              value={fmtQ(m.costo)}
              sub={`${fmtPct(pctMat)} mat · ${fmtPct(pctTotal)} total`}
              color="bg-gray-50 text-gray-700"
              accentColor="bg-gray-300"
            />
          );
        })}
      </div>

      {/* Row 3: Additional KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="UC más cara"
          value={kpis.ucMasCara ? kpis.ucMasCara.nombre : "—"}
          sub={kpis.ucMasCara ? fmtQ(kpis.ucMasCara.costo) : undefined}
          color="bg-orange-50 text-orange-700"
          accentColor="bg-orange-400"
        />
        <KpiCard
          label="Actividad más cara"
          value={
            kpis.actividadMasCara
              ? kpis.actividadMasCara.nombre.length > 25
                ? kpis.actividadMasCara.nombre.slice(0, 24) + "…"
                : kpis.actividadMasCara.nombre
              : "—"
          }
          sub={kpis.actividadMasCara ? fmtQ(kpis.actividadMasCara.costo) : undefined}
          color="bg-orange-50 text-orange-700"
          accentColor="bg-orange-400"
        />
        <KpiCard
          label="Material más costoso"
          value={
            kpis.materialMasCostoso
              ? kpis.materialMasCostoso.nombre.length > 25
                ? kpis.materialMasCostoso.nombre.slice(0, 24) + "…"
                : kpis.materialMasCostoso.nombre
              : "—"
          }
          sub={kpis.materialMasCostoso ? fmtQ(kpis.materialMasCostoso.costo) : undefined}
          color="bg-orange-50 text-orange-700"
          accentColor="bg-orange-400"
        />
        <KpiCard
          label="Prom. costo/actividad"
          value={fmtQ(kpis.promedioCostoActividad)}
          sub={`${kpis.numSalidasMateriales} salidas mat.`}
          color="bg-orange-50 text-orange-700"
          accentColor="bg-orange-400"
        />
      </div>
    </div>
  );
}
