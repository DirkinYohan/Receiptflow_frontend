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
    <section className="rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">{title}</h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
