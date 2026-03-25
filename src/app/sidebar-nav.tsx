"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TABLE_CONFIGS, TABLE_KEYS } from "@/lib/table-config";

function NavLink({
  href,
  children,
  exact = false,
}: {
  href: string;
  children: React.ReactNode;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`group flex items-center gap-2.5 px-4 py-2.5 text-sm transition-all duration-150 relative
        ${
          isActive
            ? "bg-brand-800/60 text-white font-medium"
            : "text-brand-100/80 hover:bg-brand-800/40 hover:text-white"
        }`}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-r-full bg-accent-400" />
      )}
      {children}
    </Link>
  );
}

export function SidebarNav() {
  return (
    <nav className="flex-1 overflow-y-auto py-3">
      <p className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-brand-100/35">
        Dashboards
      </p>

      <NavLink href="/dashboard/comparativo-unidad-costo">
        <svg className="h-4 w-4 shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
        <span className="truncate">Comparativo Unidad Costo</span>
      </NavLink>

      <NavLink href="/dashboard/costos-destino">
        <svg className="h-4 w-4 shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
        <span className="truncate">Costos por Destino</span>
      </NavLink>

      <NavLink href="/dashboard/materiales-unidad-costo">
        <svg className="h-4 w-4 shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
        <span className="truncate">Materiales por UC</span>
      </NavLink>

      <p className="px-5 py-2 mt-3 text-[10px] font-bold uppercase tracking-widest text-brand-100/35">
        Tablas
      </p>

      {TABLE_KEYS.map((key) => {
        const t = TABLE_CONFIGS[key];
        return (
          <NavLink key={key} href={`/tabla/${key}`}>
            <span className="text-sm opacity-80 shrink-0">{t.icon}</span>
            <span className="truncate">{t.name}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
