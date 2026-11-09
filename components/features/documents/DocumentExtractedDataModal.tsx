'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';
import { DocumentDetail, DocumentUpdateExtractedDataPayload } from '@/types/document';
import { documentsService } from '@/services/documents.service';
import { useAvailableCategories } from '@/hooks/queries';
import { localizeCategoryName } from '@/lib/i18n/categoryNames';
import { useToast } from '@/hooks/useToast';
import { useI18n } from '@/providers/I18nProvider';
import { Save } from 'lucide-react';
import { ApiError } from '@/types/api';

export function DocumentExtractedDataModal({
  isOpen,
  onClose,
  document,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentDetail;
  onSuccess: (updated: DocumentDetail) => void;
}) {
  const { success: toastSuccess } = useToast();
  const { locale, t } = useI18n();

  const [formData, setFormData] = useState({
    title: document.title || '',
    supplier_name: document.supplier_data?.name || '',
    category_id: document.category ? String(document.category) : '',
    document_number: document.document_number || '',
    total_amount: document.total_amount || '',
    subtotal_amount: document.subtotal_amount || '',
    tax_amount: document.tax_amount || '',
    currency: document.currency || 'COP',
    payment_method: document.payment_method || '',
    issued_at: document.issued_at ? document.issued_at.slice(0, 16) : '',
    notes: document.notes || '',
    status: document.status === 'review_required' ? 'completed' : document.status,
  });

  const [isLoading, setIsLoading] = useState(false);
  const { data: categories = [] } = useAvailableCategories();
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    const payload: DocumentUpdateExtractedDataPayload = {
      title: formData.title,
      document_number: formData.document_number,
      total_amount: formData.total_amount ? Number(formData.total_amount) : null,
      subtotal_amount: formData.subtotal_amount ? Number(formData.subtotal_amount) : null,
      tax_amount: formData.tax_amount ? Number(formData.tax_amount) : null,
      currency: formData.currency,
      payment_method: formData.payment_method,
      issued_at: formData.issued_at ? new Date(formData.issued_at).toISOString() : null,
      notes: formData.notes,
      status: formData.status as 'pending' | 'completed' | 'review_required',
      ...(formData.category_id ? { category_id: Number(formData.category_id) } : {}),
      ...(formData.supplier_name.trim() && formData.supplier_name.trim() !== (document.supplier_data?.name || '')
        ? { supplier_name: formData.supplier_name.trim() }
        : {}),
    };

    try {
      const res = await documentsService.updateExtractedData(document.id, payload);
      toastSuccess(t('edit.saved'));
      if (res.data) onSuccess(res.data);
      onClose();
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setErrorMessage(apiErr.message || t('edit.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('edit.title')}
      description={t('edit.description')}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <Alert type="danger" onClose={() => setErrorMessage('')}>
            {errorMessage}
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t('edit.titleField')}
            name="title"
            value={formData.title}
            onChange={handleChange}
            disabled={isLoading}
          />
          <Input
            label={t('edit.number')}
            name="document_number"
            value={formData.document_number}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t('review.supplier')}
            name="supplier_name"
            value={formData.supplier_name}
            onChange={handleChange}
            disabled={isLoading}
          />
          <Select
            label={t('review.category')}
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
            placeholder="—"
            options={categories.map((category) => ({ value: String(category.id), label: localizeCategoryName(category, locale) }))}
            helperText={t('edit.categoryHint')}
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label={t('edit.subtotal')}
            name="subtotal_amount"
            type="number"
            step="0.01"
            value={formData.subtotal_amount}
            onChange={handleChange}
            disabled={isLoading}
          />
          <Input
            label={t('edit.tax')}
            name="tax_amount"
            type="number"
            step="0.01"
            value={formData.tax_amount}
            onChange={handleChange}
            disabled={isLoading}
          />
          <Input
            label={t('edit.total')}
            name="total_amount"
            type="number"
            step="0.01"
            required
            value={formData.total_amount}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label={t('edit.date')}
            name="issued_at"
            type="datetime-local"
            value={formData.issued_at}
            onChange={handleChange}
            disabled={isLoading}
          />
          <Select
            label={t('edit.currency')}
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
          <Select
            label={t('edit.method')}
            name="payment_method"
            value={formData.payment_method}
            onChange={handleChange}
            options={[
              { value: '', label: t('method.empty') },
              { value: 'cash', label: t('method.cash') },
              { value: 'card', label: t('method.card') },
              { value: 'transfer', label: t('method.transfer') },
              { value: 'digital', label: t('method.digital') },
              { value: 'other', label: t('method.other') },
            ]}
            disabled={isLoading}
          />
        </div>

        <div>
          <Select
            label={t('edit.status')}
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={[
              { value: 'completed', label: t('edit.reviewed') },
              { value: 'review_required', label: t('edit.needsReview') },
              { value: 'pending', label: t('edit.pending') },
            ]}
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
            {t('edit.notes')}
          </label>
          <textarea
            name="notes"
            rows={2}
            value={formData.notes}
            onChange={handleChange}
            className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3.5 py-2 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
            disabled={isLoading}
          />
        </div>

        <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-200 dark:border-stone-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" isLoading={isLoading} leftIcon={<Save className="w-4 h-4" />}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
