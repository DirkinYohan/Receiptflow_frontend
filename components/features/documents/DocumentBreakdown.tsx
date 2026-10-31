'use client';

import React from 'react';
import { ExpenseItem, ExtractedSection } from '@/types/document';
import { formatCurrency } from '@/lib/formatters';
import { useI18n } from '@/providers/I18nProvider';

const EMPTY_MARKERS = new Set(['-', '—', '–', 'n/a', 'na', 'n.a.', 'null', 'none', 'undefined']);

function missing(item: ExpenseItem, flag: string): boolean {
  return Boolean(item.extra?.[flag]);
}

function displayCell(value: string | number | null | undefined): string {
  if (value == null) return '';
  const text = String(value).trim();
  if (!text || EMPTY_MARKERS.has(text.toLowerCase())) return '';
  return text;
}

export function DocumentBreakdown({
  sections,
  lineItems,
  currency,
  documentClass,
}: {
  sections?: ExtractedSection[] | null;
  lineItems: ExpenseItem[];
  currency?: string;
  documentClass?: string | null;
}) {
  const { t } = useI18n();
  const printedSections = (sections || []).filter((section) => (section.columns || []).length > 0 || (section.rows || []).length > 0);
  const classKey = documentClass ? `docClass.${documentClass}` : '';
  const classLabel = classKey && t(classKey) !== classKey ? t(classKey) : '';

  return (
    <div className="space-y-2">
      {classLabel && <p className="text-sm text-stone-500">{classLabel}</p>}
        {printedSections.map((section, sectionIndex) => {
          const columns = section.columns?.length
            ? section.columns
            : (section.rows?.[0]?.cells || []).map((cell) => cell.column || '').filter(Boolean);
          return (
            <div key={`${section.name || 'seccion'}-${sectionIndex}`} className="overflow-x-auto border-b border-zinc-100 dark:border-zinc-800">
              {section.name && (
                <p className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  {section.name}
                </p>
              )}
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    {columns.map((column) => (
                      <th key={column} className="py-2.5 px-4">{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {(section.rows || []).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {columns.map((column) => {
                        const value = row.cells?.find((cell) => cell.column === column)?.value;
                        return (
                          <td key={column} className="py-3 px-4 text-zinc-800 dark:text-zinc-100">
                            {displayCell(value)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}

        {lineItems.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-4 w-12">#</th>
                  <th className="py-2.5 px-4">{t('detail.description')}</th>
                  <th className="py-2.5 px-4 text-right">{t('detail.quantity')}</th>
                  <th className="py-2.5 px-4 text-right">{t('detail.unitPrice')}</th>
                  <th className="py-2.5 px-4 text-right">{t('detail.taxCol')}</th>
                  <th className="py-2.5 px-4 text-right">{t('detail.totalCol')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {lineItems.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="py-3 px-4 text-zinc-400">{item.sequence || idx + 1}</td>
                    <td className="py-3 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                      {item.description}
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-600 dark:text-zinc-300">
                      {missing(item, 'quantity_missing') || item.quantity == null
                        ? ''
                        : `${item.quantity} ${item.unit || ''}`.trim()}
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-600 dark:text-zinc-300">
                      {missing(item, 'unit_price_missing') || item.unit_price == null
                        ? ''
                        : formatCurrency(item.unit_price, currency)}
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-600 dark:text-zinc-300">
                      {missing(item, 'tax_amount_missing') || item.tax_amount == null
                        ? ''
                        : formatCurrency(item.tax_amount, currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-zinc-900 dark:text-zinc-100">
                      {missing(item, 'total_missing') || item.total_amount == null
                        ? ''
                        : formatCurrency(item.total_amount, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {printedSections.length === 0 && lineItems.length === 0 && (
          <div className="p-8 text-center text-xs text-zinc-400">
            {t('detail.noTable')}
          </div>
        )}
    </div>
  );
}
