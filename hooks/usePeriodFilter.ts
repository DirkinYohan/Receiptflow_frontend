'use client';

import { useState } from 'react';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import { expensesService } from '@/services/expenses.service';
import { localDateInput } from '@/lib/formatters';

export type PeriodPreset = 'month' | 'quarter' | 'year' | 'all';

export const PERIOD_PRESETS: { id: PeriodPreset; labelKey: string }[] = [
  { id: 'month', labelKey: 'reports.presetMonth' },
  { id: 'quarter', labelKey: 'reports.presetQuarter' },
  { id: 'year', labelKey: 'reports.presetYear' },
  { id: 'all', labelKey: 'reports.presetAll' },
];

function quarterStart(now: Date): string {
  return localDateInput(new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()));
}

async function presetStart(preset: PeriodPreset, client: QueryClient): Promise<string> {
  const now = new Date();
  if (preset === 'month') return localDateInput(new Date(now.getFullYear(), now.getMonth(), 1));
  if (preset === 'year') return localDateInput(new Date(now.getFullYear(), 0, 1));
  if (preset === 'quarter') return quarterStart(now);
  const oldestParams = { ordering: 'incurred_at', page_size: 1 };
  const oldest = await client.fetchQuery({
    queryKey: qk.expenses.list(oldestParams),
    queryFn: () => expensesService.getExpenses(oldestParams),
    staleTime: 60_000,
  });
  const first = oldest.results?.[0]?.incurred_at;
  return localDateInput(first ? new Date(first) : now);
}

export function usePeriodFilter() {
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState(() => quarterStart(new Date()));
  const [endDate, setEndDate] = useState(() => localDateInput());
  const [preset, setPreset] = useState<PeriodPreset | null>('quarter');

  const choosePreset = async (next: PeriodPreset) => {
    setPreset(next);
    const start = await presetStart(next, queryClient);
    setStartDate(start);
    setEndDate(localDateInput());
  };

  const changeStart = (value: string) => {
    setPreset(null);
    setStartDate(value);
  };

  const changeEnd = (value: string) => {
    setPreset(null);
    setEndDate(value);
  };

  return {
    preset,
    startDate,
    endDate,
    choosePreset,
    changeStart,
    changeEnd,
    range: { start_date: startDate, end_date: endDate },
  };
}

export type PeriodFilterState = ReturnType<typeof usePeriodFilter>;
