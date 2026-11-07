'use client';

import React from 'react';
import Link from 'next/link';
import { Receipt, Edit, Trash2, Eye, Repeat } from 'lucide-react';
import { Expense } from '@/types/expense';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useI18n } from '@/providers/I18nProvider';
import { localizeCategoryName } from '@/lib/i18n/categoryNames';

type ExpensesTableProps = {
  expenses: Expense[];
  deletingId: number | null;
  onOpen: (id: number) => void;
  onEdit: (expense: Expense, event: React.MouseEvent) => void;
  onDelete: (expense: Expense, event: React.MouseEvent) => void;
};

export function ExpensesTable({ expenses, deletingId, onOpen, onEdit, onDelete }: ExpensesTableProps) {
  const { locale, t } = useI18n();
  return (
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">{t('expenses.colDescription')}</th>
              <th className="py-3 px-4">{t('expenses.colCategory')}</th>
              <th className="py-3 px-4">{t('expenses.colDate')}</th>
              <th className="py-3 px-4">{t('expenses.colMethod')}</th>
              <th className="py-3 px-4">{t('expenses.colTotal')}</th>
              <th className="py-3 px-4 text-right">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
            {expenses.map((expense) => (
              <tr
                key={expense.id}
                className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                onClick={() => onOpen(expense.id)}
              >
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[240px]">
                        {expense.description}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5 dark:text-zinc-500">
                        {expense.supplier_name && <span>{expense.supplier_name}</span>}
                        {expense.is_recurring && (
                          <span className="inline-flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 font-medium">
                            <Repeat className="w-3 h-3" />
                            <span>{t('expenses.recurring')}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
    
                <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300">
                  {localizeCategoryName(expense.category_name, locale) || t('common.noCategory')}
                </td>
    
                <td className="py-3.5 px-4 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                  {formatDate(expense.incurred_at)}
                </td>
    
                <td className="py-3.5 px-4 text-zinc-500 dark:text-zinc-400">
                  {expense.payment_method
                    ? t(`method.${expense.payment_method}`)
                    : '—'}
                </td>
    
                <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                  {formatCurrency(expense.total_amount, expense.currency)}
                </td>
    
                <td className="py-3.5 px-4 text-right">
                  <div
                    className="flex items-center justify-end gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link
                      href={`/expenses/${expense.id}`}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800 transition-colors dark:text-zinc-500 dark:hover:text-indigo-400"
                      title={t('expenses.viewDetail')}
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
    
                    <button
                      title={t('expenses.edit')}
                      onClick={(e) => onEdit(expense, e)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer dark:text-zinc-500 dark:hover:text-indigo-400"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
    
                    <button
                      title={t('expenses.delete')}
                      disabled={deletingId === expense.id}
                      onClick={(e) => onDelete(expense, e)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50 dark:text-zinc-500 dark:hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
  );
}
