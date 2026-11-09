'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';
import { Expense, ExpenseCreatePayload } from '@/types/expense';
import { expensesService } from '@/services/expenses.service';
import { useToast } from '@/hooks/useToast';
import { ApiError } from '@/types/api';
import { PaymentMethod } from '@/types/document';
import { useQueryClient } from '@tanstack/react-query';
import { useAvailableCategories, useSupplierOptions } from '@/hooks/queries';
import { invalidateAfter } from '@/lib/query/invalidate';
import { useI18n } from '@/providers/I18nProvider';
import { localizeCategoryName } from '@/lib/i18n/categoryNames';

export function ExpenseFormModal({
  isOpen,
  onClose,
  expense,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  expense?: Expense | null;
  onSuccess: () => void;
}) {
  const isEditing = !!expense;
  const { success: toastSuccess } = useToast();
  const { locale, t } = useI18n();

  const { data: categories = [] } = useAvailableCategories();
  const { data: suppliers = [] } = useSupplierOptions(isOpen);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    currency: 'COP',
    category: '',
    supplier: '',
    incurred_at: new Date().toISOString().slice(0, 16),
    payment_method: '',
    tax_amount: '',
    is_recurring: false,
    recurring_frequency: 'monthly',
    is_reimbursable: false,
    notes: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [syncedWith, setSyncedWith] = useState({ isOpen: false, item: expense });
  if (syncedWith.isOpen !== isOpen || syncedWith.item !== expense) {
    setSyncedWith({ isOpen, item: expense });
    if (isOpen) {
      if (expense) {
        setFormData({
          description: expense.description || '',
          amount: expense.amount || '',
          currency: expense.currency || 'COP',
          category: expense.category ? String(expense.category) : '',
          supplier: expense.supplier ? String(expense.supplier) : '',
          incurred_at: expense.incurred_at ? expense.incurred_at.slice(0, 16) : new Date().toISOString().slice(0, 16),
          payment_method: expense.payment_method || '',
          tax_amount: expense.tax_amount || '',
          is_recurring: expense.is_recurring || false,
          recurring_frequency: expense.recurring_frequency || 'monthly',
          is_reimbursable: expense.is_reimbursable || false,
          notes: expense.notes || '',
        });
      } else {
        setFormData({
          description: '',
          amount: '',
          currency: 'COP',
          category: '',
          supplier: '',
          incurred_at: new Date().toISOString().slice(0, 16),
          payment_method: '',
          tax_amount: '',
          is_recurring: false,
          recurring_frequency: 'monthly',
          is_reimbursable: false,
          notes: '',
        });
      }
      setErrorMessage('');
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    const payload: ExpenseCreatePayload = {
      description: formData.description,
      amount: Number(formData.amount),
      currency: formData.currency,
      category: formData.category ? Number(formData.category) : null,
      supplier: formData.supplier ? Number(formData.supplier) : null,
      incurred_at: new Date(formData.incurred_at).toISOString(),
      payment_method: (formData.payment_method as PaymentMethod | '') || '',
      tax_amount: formData.tax_amount ? Number(formData.tax_amount) : 0,
      is_recurring: formData.is_recurring,
      recurring_frequency: formData.is_recurring ? formData.recurring_frequency : '',
      is_reimbursable: formData.is_reimbursable,
      notes: formData.notes,
    };

    try {
      if (isEditing && expense) {
        await expensesService.updateExpense(expense.id, payload);
        toastSuccess(t('expenseForm.updated'));
      } else {
        await expensesService.createExpense(payload);
        toastSuccess(t('expenseForm.created'));
      }
      invalidateAfter(queryClient, 'expense');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setErrorMessage(apiErr.message || t('expenseForm.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? t('expenseForm.editTitle') : t('expenseForm.newTitle')}
      description={t('expenseForm.description')}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <Alert type="danger" onClose={() => setErrorMessage('')}>
            {errorMessage}
          </Alert>
        )}

        <Input
          label={t('expenseForm.descriptionLabel')}
          name="description"
          required
          placeholder={t('expenseForm.descriptionPlaceholder')}
          value={formData.description}
          onChange={handleChange}
          disabled={isLoading}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t('expenseForm.amount')}
            name="amount"
            type="number"
            step="0.01"
            required
            placeholder="0.00"
            value={formData.amount}
            onChange={handleChange}
            disabled={isLoading}
          />
          <Select
            label={t('expenseForm.currency')}
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            options={[
              { value: 'COP', label: t('currency.COP') },
              { value: 'MXN', label: t('currency.MXN') },
              { value: 'USD', label: t('currency.USD') },
              { value: 'EUR', label: t('currency.EUR') },
            ]}
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label={t('expenseForm.category')}
            name="category"
            value={formData.category}
            onChange={handleChange}
            placeholder={t('expenseForm.categoryPlaceholder')}
            options={categories.map((c) => ({
              value: c.id,
              label: `${localizeCategoryName(c, locale)} ${c.is_system ? t('expenseForm.systemTag') : t('expenseForm.personalTag')}`,
            }))}
            disabled={isLoading}
          />

          <Select
            label={t('expenseForm.supplier')}
            name="supplier"
            value={formData.supplier}
            onChange={handleChange}
            placeholder={t('expenseForm.supplierPlaceholder')}
            options={suppliers.map((s) => ({
              value: s.id,
              label: `${s.name} ${s.tax_id ? `(${s.tax_id})` : ''}`,
            }))}
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t('expenseForm.date')}
            name="incurred_at"
            type="datetime-local"
            required
            value={formData.incurred_at}
            onChange={handleChange}
            disabled={isLoading}
          />

          <Select
            label={t('expenseForm.method')}
            name="payment_method"
            value={formData.payment_method}
            onChange={handleChange}
            placeholder={t('expenseForm.methodPlaceholder')}
            options={[
              { value: 'cash', label: t('method.cash') },
              { value: 'card', label: t('method.card') },
              { value: 'transfer', label: t('method.transfer') },
              { value: 'digital', label: t('method.digital') },
              { value: 'other', label: t('method.other') },
            ]}
            disabled={isLoading}
          />
        </div>

        <div className="pt-1 flex flex-col sm:flex-row gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm text-stone-700 dark:text-stone-300">
            <input
              type="checkbox"
              name="is_recurring"
              checked={formData.is_recurring}
              onChange={handleChange}
              className="rounded-sm border-stone-300 dark:border-stone-700 text-emerald-700 focus:ring-emerald-600 dark:text-emerald-400"
              disabled={isLoading}
            />
            <span>{t('expenseForm.recurring')}</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm text-stone-700 dark:text-stone-300">
            <input
              type="checkbox"
              name="is_reimbursable"
              checked={formData.is_reimbursable}
              onChange={handleChange}
              className="rounded-sm border-stone-300 dark:border-stone-700 text-emerald-700 focus:ring-emerald-600 dark:text-emerald-400"
              disabled={isLoading}
            />
            <span>{t('expenseForm.reimbursable')}</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
            {t('expenseForm.notes')}
          </label>
          <textarea
            name="notes"
            rows={2}
            value={formData.notes}
            onChange={handleChange}
            className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3.5 py-2 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
            placeholder={t('expenseForm.notesPlaceholder')}
            disabled={isLoading}
          />
        </div>

        <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-200 dark:border-stone-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {isEditing ? t('common.saveChanges') : t('expenseForm.submitNew')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
