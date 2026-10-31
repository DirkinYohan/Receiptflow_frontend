import React from 'react';

export function DetailSection({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
