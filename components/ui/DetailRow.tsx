export function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4 border-b border-stone-100 py-3 text-sm last:border-0 dark:border-stone-800">
      <span className="text-stone-500 dark:text-stone-400">{label}</span>
      <span className="text-right font-medium text-stone-900 dark:text-stone-100">{value}</span>
    </div>
  );
}
