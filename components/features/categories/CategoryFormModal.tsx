'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Category, CategoryCreatePayload } from '@/types/category';
import { categoriesService } from '@/services/categories.service';
import { useToast } from '@/hooks/useToast';
import { ApiError } from '@/types/api';
import { useI18n } from '@/providers/I18nProvider';

const PRESET_COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#f97316',
  '#14b8a6',
  '#64748b',
];

export function CategoryFormModal({
  isOpen,
  onClose,
  category,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  category?: Category | null;
  onSuccess: () => void;
}) {
  const isEditing = !!category;
  const { success: toastSuccess } = useToast();
  const { t } = useI18n();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [icon, setIcon] = useState('tag');
  const [isActive, setIsActive] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (category) {
        setName(category.name || '');
        setDescription(category.description || '');
        setColor(category.color || '#6366f1');
        setIcon(category.icon || 'tag');
        setIsActive(category.is_active ?? true);
      } else {
        setName('');
        setDescription('');
        setColor('#6366f1');
        setIcon('tag');
        setIsActive(true);
      }
      setErrorMessage('');
    }
  }, [isOpen, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    const payload: CategoryCreatePayload = {
      name,
      description,
      color,
      icon,
      is_active: isActive,
    };

    try {
      if (isEditing && category) {
        await categoriesService.updateCategory(category.id, payload);
        toastSuccess(t('categoryForm.updated'));
      } else {
        await categoriesService.createCategory(payload);
        toastSuccess(t('categoryForm.created'));
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setErrorMessage(apiErr.message || t('categoryForm.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? t('categoryForm.editTitle') : t('categoryForm.newTitle')}
      description={t('categoryForm.description')}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <Alert type="danger" onClose={() => setErrorMessage('')}>
            {errorMessage}
          </Alert>
        )}

        <Input
          label={t('categoryForm.name')}
          required
          placeholder={t('categoryForm.namePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
        />

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            {t('categoryForm.color')}
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                  color === c ? 'ring-3 ring-indigo-500 ring-offset-2 scale-110' : 'opacity-80 hover:opacity-100'
                }`}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            {t('categoryForm.descriptionLabel')}
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            placeholder={t('categoryForm.descriptionPlaceholder')}
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="cat_active"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded-sm border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500 dark:text-indigo-400"
            disabled={isLoading}
          />
          <label htmlFor="cat_active" className="text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
            {t('categoryForm.active')}
          </label>
        </div>

        <div className="pt-3 flex items-center justify-end gap-3 border-t border-zinc-200 dark:border-zinc-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {isEditing ? t('common.saveChanges') : t('categoryForm.submitNew')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
