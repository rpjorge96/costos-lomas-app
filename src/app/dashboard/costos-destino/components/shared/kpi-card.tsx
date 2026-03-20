interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  color: string;
  accentColor?: string;
  icon?: React.ReactNode;
}

export function KpiCard({ label, value, sub, color, accentColor, icon }: KpiCardProps) {
  return (
    <div className={`relative rounded-xl overflow-hidden ${color} shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}>
      {/* Accent top bar */}
      {accentColor && (
        <div className={`h-1 w-full ${accentColor}`} />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 leading-tight">
            {label}
          </p>
          {icon && (
            <span className="opacity-25 shrink-0 -mt-0.5">{icon}</span>
          )}
        </div>
        <p className="mt-2 text-xl font-extrabold leading-none tracking-tight">{value}</p>
        {sub && (
          <p className="mt-1.5 text-[11px] font-medium opacity-60 leading-tight">{sub}</p>
        )}
      </div>
    </div>
  );
}
