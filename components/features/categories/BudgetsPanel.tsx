'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { PiggyBank, X } from 'lucide-react';
import { budgetsService } from '@/services/budgets.service';
import { categoriesService } from '@/services/categories.service';
import { AvailableCategory, BudgetState, CategoryBudget } from '@/types/category';
import { formatCurrency } from '@/lib/formatters';
import { useToast } from '@/hooks/useToast';
import { useI18n } from '@/providers/I18nProvider';
import { localizeCategoryName } from '@/lib/i18n/categoryNames';

const BAR_COLOR: Record<BudgetState, string> = {
  ok: 'bg-emerald-600',
  warning: 'bg-amber-500',
  exceeded: 'bg-red-600',
};

const TEXT_COLOR: Record<BudgetState, string> = {
  ok: 'text-emerald-800',
  warning: 'text-amber-800',
  exceeded: 'text-red-700',
};

function BudgetBar({ budget }: { budget: CategoryBudget }) {
  const { locale, t } = useI18n();
  const pct = Math.min(Number(budget.status.percentage), 100);
  return (
    <div>
      <div className="h-2 overflow-hidden rounded-full bg-stone-100">
        <div className={`h-full rounded-full ${BAR_COLOR[budget.status.state]}`} style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
      <p className={`mt-1 text-xs ${TEXT_COLOR[budget.status.state]}`}>
        {t('categories.budgetSpent', {
          spent: formatCurrency(budget.status.spent, budget.currency),
          budget: formatCurrency(budget.monthly_amount, budget.currency),
        })}{' '}
        · {budget.status.percentage}% · {t(`categories.budgetState_${budget.status.state}`)}
      </p>
    </div>
  );
}

function useBudgets() {
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [loaded, setLoaded] = useState(false);
  const reload = useCallback(async () => {
    try {
      const res = await budgetsService.getBudgets();
      setBudgets(res.data ?? []);
    } finally {
      setLoaded(true);
    }
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);
  return { budgets, loaded, reload };
}

/** Compact view for the dashboard: only categories that have a budget. */
export function BudgetSummary() {
  const { locale, t } = useI18n();
  const { budgets, loaded } = useBudgets();
  if (!loaded || budgets.length === 0) return null;
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
          <PiggyBank className="h-4 w-4 text-emerald-700" aria-hidden />
          {t('dashboard.budgetsTitle')}
        </h3>
        <Link href="/categories" className="text-sm font-medium text-emerald-800 hover:underline">
          {t('dashboard.budgetsManage')}
        </Link>
      </div>
      <ul className="mt-4 space-y-4">
        {budgets.map((budget) => (
          <li key={budget.id}>
            <p className="mb-1.5 text-sm font-medium text-stone-800">
              {localizeCategoryName(budget.category_name, locale)}
            </p>
            <BudgetBar budget={budget} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function BudgetRow({
  category,
  budget,
  onChanged,
}: {
  category: AvailableCategory;
  budget?: CategoryBudget;
  onChanged: () => void;
}) {
  const { locale, t } = useI18n();
  const { success: toastSuccess, error: toastError } = useToast();
  const [value, setValue] = useState(budget ? String(Number(budget.monthly_amount)) : '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const amount = Number(value);
    if (!value || amount <= 0 || (budget && amount === Number(budget.monthly_amount))) return;
    setSaving(true);
    try {
      await budgetsService.saveBudget(category.id, amount);
      toastSuccess(t('categories.budgetSaved'));
      onChanged();
    } catch {
      toastError(t('categories.budgetError'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!budget) return;
    setSaving(true);
    try {
      await budgetsService.deleteBudget(budget.id);
      setValue('');
      toastSuccess(t('categories.budgetRemoved'));
      onChanged();
    } catch {
      toastError(t('categories.budgetError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className="grid grid-cols-1 items-center gap-3 py-3 sm:grid-cols-[180px_160px_1fr]">
      <span className="flex items-center gap-2 text-sm font-medium text-stone-900">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color || '#a8a29e' }} aria-hidden />
        {localizeCategoryName(category, locale)}
      </span>
      <div className="flex items-center gap-1">
        <input
          type="number"
          min="0"
          step="1000"
          inputMode="numeric"
          value={value}
          disabled={saving}
          placeholder={t('categories.budgetPlaceholder')}
          aria-label={`${t('categories.budgetsTitle')}: ${localizeCategoryName(category, locale)}`}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              save();
            }
          }}
          className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
        />
        {budget && (
          <button
            type="button"
            onClick={remove}
            disabled={saving}
            aria-label={t('categories.budgetRemove')}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div>{budget && <BudgetBar budget={budget} />}</div>
    </li>
  );
}

/** Editable list on the categories page: one monthly budget per category. */
export function BudgetsPanel() {
  const { locale, t } = useI18n();
  const { budgets, reload } = useBudgets();
  const [categories, setCategories] = useState<AvailableCategory[]>([]);

  useEffect(() => {
    categoriesService.getAvailableCategories().then((res) => setCategories(res.data ?? []));
  }, []);

  const byCategory = new Map(budgets.map((budget) => [budget.category, budget]));

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
        <PiggyBank className="h-4 w-4 text-emerald-700" aria-hidden />
        {t('categories.budgetsTitle')}
      </h3>
      <p className="mt-1 text-sm text-stone-500">{t('categories.budgetsHint')}</p>
      <ul className="mt-3 divide-y divide-stone-100">
        {categories.map((category) => (
          <BudgetRow
            key={`${category.id}-${byCategory.get(category.id)?.updated_at ?? 'none'}`}
            category={category}
            budget={byCategory.get(category.id)}
            onChanged={reload}
          />
        ))}
      </ul>
    </section>
  );
}
