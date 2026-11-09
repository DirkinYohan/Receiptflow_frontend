import { Card } from '@/components/ui/Card';

type StatCardProps = {
  label: string;
  value: string;
  hint: string;
  valueClassName?: string;
};

export function StatCard({ label, value, hint, valueClassName = 'text-stone-900 dark:text-stone-100' }: StatCardProps) {
  return (
    <Card className="p-4">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 block dark:text-stone-500">
        {label}
      </span>
      <p className={`text-2xl font-extrabold mt-1 ${valueClassName}`}>{value}</p>
      <span className="text-xs text-stone-500 mt-1 block dark:text-stone-400">{hint}</span>
    </Card>
  );
}
