interface SectionWrapperProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function SectionWrapper({
  title,
  subtitle,
  children,
  actions,
}: SectionWrapperProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-5 py-4 bg-gray-50/70 border-b border-gray-100">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 h-4 w-1 rounded-full bg-brand-500 shrink-0" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-800 leading-tight">{title}</h3>
            {subtitle && (
              <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {/* Content */}
      <div className="p-5">{children}</div>
    </div>
  );
}
