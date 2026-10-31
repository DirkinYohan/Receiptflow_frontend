import React from 'react';
import { LucideIcon } from 'lucide-react';

export function SummaryCard({
  title,
  value,
  hint,
  icon: Icon,
  loading = false,
}: {
  title: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  loading?: boolean;
}) {
  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-stone-500">{title}</p>
        {Icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-50 text-stone-500">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
        )}
      </div>
      {loading ? (
        <div className="mt-4 h-8 w-24 animate-pulse rounded-lg bg-stone-100" />
      ) : (
        <p className="mt-3 text-2xl font-semibold tracking-tight text-stone-900">{value}</p>
      )}
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </article>
  );
}
