'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Supplier, SupplierCreatePayload } from '@/types/supplier';
import { suppliersService } from '@/services/suppliers.service';
import { useToast } from '@/hooks/useToast';
import { useI18n } from '@/providers/I18nProvider';
import { ApiError } from '@/types/api';

export function SupplierFormModal({
  isOpen,
  onClose,
  supplier,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  supplier?: Supplier | null;
  onSuccess: () => void;
}) {
  const isEditing = !!supplier;
  const { success: toastSuccess } = useToast();
  const { t } = useI18n();

  const [formData, setFormData] = useState({
    name: '',
    tax_id: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    notes: '',
    is_favorite: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (supplier) {
        setFormData({
          name: supplier.name || '',
          tax_id: supplier.tax_id || '',
          email: supplier.email || '',
          phone: supplier.phone || '',
          address: supplier.address || '',
          website: supplier.website || '',
          notes: supplier.notes || '',
          is_favorite: supplier.is_favorite || false,
        });
      } else {
        setFormData({
          name: '',
          tax_id: '',
          email: '',
          phone: '',
          address: '',
          website: '',
          notes: '',
          is_favorite: false,
        });
      }
      setErrorMessage('');
    }
  }, [isOpen, supplier]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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

    const payload: SupplierCreatePayload = {
      name: formData.name,
      tax_id: formData.tax_id,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      website: formData.website,
      notes: formData.notes,
      is_favorite: formData.is_favorite,
    };

    try {
      if (isEditing && supplier) {
        await suppliersService.updateSupplier(supplier.id, payload);
        toastSuccess(t('supplierForm.updated'));
      } else {
        await suppliersService.createSupplier(payload);
        toastSuccess(t('supplierForm.created'));
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setErrorMessage(apiErr.message || t('supplierForm.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? t('supplierForm.editTitle') : t('supplierForm.newTitle')}
      description={t('supplierForm.description')}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <Alert type="danger" onClose={() => setErrorMessage('')}>
            {errorMessage}
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t('supplierForm.name')}
            name="name"
            required
            placeholder={t('supplierForm.namePlaceholder')}
            value={formData.name}
            onChange={handleChange}
            disabled={isLoading}
          />
          <Input
            label={t('suppliers.id')}
            name="tax_id"
            placeholder={t('supplierForm.taxIdPlaceholder')}
            value={formData.tax_id}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t('supplierForm.email')}
            name="email"
            type="email"
            placeholder="contacto@empresa.com"
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
          />
          <Input
            label={t('supplierForm.phone')}
            name="phone"
            placeholder="+57 (601) 555-0199"
            value={formData.phone}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        <Input
          label={t('supplierForm.address')}
          name="address"
          placeholder={t('supplierForm.addressPlaceholder')}
          value={formData.address}
          onChange={handleChange}
          disabled={isLoading}
        />

        <Input
          label={t('supplierForm.website')}
          name="website"
          placeholder="https://empresa.com"
          value={formData.website}
          onChange={handleChange}
          disabled={isLoading}
        />

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="is_favorite"
            name="is_favorite"
            checked={formData.is_favorite}
            onChange={handleChange}
            className="rounded-sm border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer dark:text-indigo-400"
            disabled={isLoading}
          />
          <label htmlFor="is_favorite" className="text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
            {t('supplierForm.favorite')}
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            {t('supplierForm.notes')}
          </label>
          <textarea
            name="notes"
            rows={2}
            value={formData.notes}
            onChange={handleChange}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            placeholder={t('supplierForm.notesPlaceholder')}
            disabled={isLoading}
          />
        </div>

        <div className="pt-3 flex items-center justify-end gap-3 border-t border-zinc-200 dark:border-zinc-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {isEditing ? t('common.saveChanges') : t('supplierForm.submitNew')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
