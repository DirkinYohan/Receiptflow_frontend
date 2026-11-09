'use client';

import { Calendar } from 'lucide-react';
import { PERIOD_PRESETS, PeriodFilterState } from '@/hooks/usePeriodFilter';
import { useI18n } from '@/providers/I18nProvider';

export function PeriodFilter({ filter }: { filter: PeriodFilterState }) {
  const { t } = useI18n();
  return (
    <>
      <div
        role="group"
        aria-label={t('reports.periodFilter')}
        className="flex rounded-xl border border-stone-200 bg-white p-1 shadow-2xs dark:border-stone-800 dark:bg-stone-900"
      >
        {PERIOD_PRESETS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={filter.preset === item.id}
            onClick={() => filter.choosePreset(item.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${
              filter.preset === item.id
                ? 'bg-stone-900 text-white dark:bg-stone-700'
                : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800'
            }`}
          >
            {t(item.labelKey)}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-1.5 shadow-2xs">
        <Calendar className="w-4 h-4 text-stone-400 ml-1.5 dark:text-stone-500" />
        <input
          type="date"
          aria-label={t('reports.periodFrom')}
          value={filter.startDate}
          max={filter.endDate}
          onChange={(e) => filter.changeStart(e.target.value)}
          className="text-xs bg-transparent border-0 focus:outline-none text-stone-700 dark:text-stone-300 cursor-pointer"
        />
        <span className="text-stone-300 dark:text-stone-700 text-xs">—</span>
        <input
          type="date"
          aria-label={t('reports.periodTo')}
          value={filter.endDate}
          min={filter.startDate}
          onChange={(e) => filter.changeEnd(e.target.value)}
          className="text-xs bg-transparent border-0 focus:outline-none text-stone-700 dark:text-stone-300 cursor-pointer"
        />
      </div>
    </>
  );
}
