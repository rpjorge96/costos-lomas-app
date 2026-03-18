import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { TABLE_CONFIGS, TABLE_KEYS } from "@/lib/table-config";

export const metadata: Metadata = {
  title: "Costos Lomas",
  description: "Consolidación de costos Las Lomas",
};

function Sidebar() {
  return (
    <aside className="fixed top-0 left-0 h-full w-60 bg-brand-900 text-white flex flex-col z-10">
      <Link
        href="/"
        className="px-5 py-5 border-b border-brand-700 hover:bg-brand-800 transition-colors"
      >
        <h1 className="text-lg font-bold tracking-tight">Costos Lomas</h1>
        <p className="text-xs text-brand-100/70 mt-0.5">Consolidación de datos</p>
      </Link>

      <nav className="flex-1 overflow-y-auto py-3">
        <p className="px-5 py-2 text-[10px] font-semibold uppercase tracking-widest text-brand-100/40">
          Dashboards
        </p>
        <Link
          href="/dashboard/comparativo-unidad-costo"
          className="flex items-center gap-2.5 px-5 py-2.5 text-sm text-brand-100/90 hover:bg-brand-800 hover:text-white transition-colors"
        >
          <span className="text-base">📊</span>
          <span className="truncate">Comparativo Unidad Costo</span>
        </Link>
        <Link
          href="/dashboard/costos-destino"
          className="flex items-center gap-2.5 px-5 py-2.5 text-sm text-brand-100/90 hover:bg-brand-800 hover:text-white transition-colors"
        >
          <span className="text-base">🏠</span>
          <span className="truncate">Costos por Destino</span>
        </Link>

        <p className="px-5 py-2 mt-2 text-[10px] font-semibold uppercase tracking-widest text-brand-100/40">
          Tablas
        </p>
        {TABLE_KEYS.map((key) => {
          const t = TABLE_CONFIGS[key];
          return (
            <Link
              key={key}
              href={`/tabla/${key}`}
              className="flex items-center gap-2.5 px-5 py-2.5 text-sm text-brand-100/90 hover:bg-brand-800 hover:text-white transition-colors"
            >
              <span className="text-base">{t.icon}</span>
              <span className="truncate">{t.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-3 border-t border-brand-700 text-[10px] text-brand-100/30">
        4 períodos · 74,609 registros
      </div>
    </aside>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-gray-50 text-gray-900">
        <Sidebar />
        <div className="ml-60 min-h-screen">{children}</div>
      </body>
    </html>
  );
}
