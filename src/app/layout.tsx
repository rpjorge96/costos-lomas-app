import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { SidebarNav } from "./sidebar-nav";

export const metadata: Metadata = {
  title: "Costos Lomas",
  description: "Consolidación de costos Las Lomas",
};

function Sidebar() {
  return (
    <aside className="fixed top-0 left-0 h-full w-60 bg-brand-900 text-white flex flex-col z-10">
      {/* Logo / Home */}
      <Link
        href="/"
        className="px-5 py-4 border-b border-brand-700/60 hover:bg-brand-800/50 transition-colors group"
      >
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-accent-500 flex items-center justify-center shrink-0 shadow-sm">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white leading-tight">Costos Lomas</h1>
            <p className="text-[10px] text-brand-100/50 leading-tight">Consolidación de datos</p>
          </div>
        </div>
      </Link>

      {/* Navigation */}
      <SidebarNav />

      {/* Footer */}
      <div className="px-5 py-3 border-t border-brand-700/60">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-500" />
          </span>
          <span className="text-[10px] text-brand-100/40">4 períodos · 74,609 registros</span>
        </div>
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
