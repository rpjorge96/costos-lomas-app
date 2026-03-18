interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  color: string;
}

export function KpiCard({ label, value, sub, color }: KpiCardProps) {
  return (
    <div className={`rounded-xl p-4 ${color}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold">{value}</p>
      {sub && <p className="text-xs opacity-70">{sub}</p>}
    </div>
  );
}
