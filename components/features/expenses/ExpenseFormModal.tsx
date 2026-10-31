'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';
import { Expense, ExpenseCreatePayload } from '@/types/expense';
import { AvailableCategory } from '@/types/category';
import { SupplierAutocomplete } from '@/types/supplier';
import { expensesService } from '@/services/expenses.service';
import { categoriesService } from '@/services/categories.service';
import { suppliersService } from '@/services/suppliers.service';
import { useToast } from '@/hooks/useToast';
import { ApiError } from '@/types/api';

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

  const [categories, setCategories] = useState<AvailableCategory[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierAutocomplete[]>([]);

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

  useEffect(() => {
    if (isOpen) {
      // Load available categories and suppliers
      categoriesService.getAvailableCategories().then((res) => {
        if (res.data) setCategories(res.data);
      });
      suppliersService.autocomplete('').then((res) => {
        if (res.data) setSuppliers(res.data);
      });

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
  }, [isOpen, expense]);

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
      payment_method: (formData.payment_method as any) || '',
      tax_amount: formData.tax_amount ? Number(formData.tax_amount) : 0,
      is_recurring: formData.is_recurring,
      recurring_frequency: formData.is_recurring ? formData.recurring_frequency : '',
      is_reimbursable: formData.is_reimbursable,
      notes: formData.notes,
    };

    try {
      if (isEditing && expense) {
        await expensesService.updateExpense(expense.id, payload);
        toastSuccess('Gasto actualizado correctamente.');
      } else {
        await expensesService.createExpense(payload);
        toastSuccess('Gasto registrado con éxito.');
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setErrorMessage(apiErr.message || 'Error al guardar el gasto.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Gasto' : 'Registrar Nuevo Gasto'}
      description="Registra un gasto manual o edita la información del comprobante."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <Alert type="danger" onClose={() => setErrorMessage('')}>
            {errorMessage}
          </Alert>
        )}

        <Input
          label="Descripción"
          name="description"
          required
          placeholder="Ej: Almuerzo de trabajo con cliente"
          value={formData.description}
          onChange={handleChange}
          disabled={isLoading}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Monto"
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
            label="Moneda"
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            options={[
              { value: 'COP', label: 'COP - Peso Colombiano' },
              { value: 'MXN', label: 'MXN - Peso Mexicano' },
              { value: 'USD', label: 'USD - Dólar Estadounidense' },
              { value: 'EUR', label: 'EUR - Euro' },
            ]}
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Categoría"
            name="category"
            value={formData.category}
            onChange={handleChange}
            placeholder="Selecciona una categoría"
            options={categories.map((c) => ({
              value: c.id,
              label: `${c.name} ${c.is_system ? '(Sistema)' : '(Personal)'}`,
            }))}
            disabled={isLoading}
          />

          <Select
            label="Proveedor"
            name="supplier"
            value={formData.supplier}
            onChange={handleChange}
            placeholder="Selecciona un proveedor"
            options={suppliers.map((s) => ({
              value: s.id,
              label: `${s.name} ${s.tax_id ? `(${s.tax_id})` : ''}`,
            }))}
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Fecha y hora del gasto"
            name="incurred_at"
            type="datetime-local"
            required
            value={formData.incurred_at}
            onChange={handleChange}
            disabled={isLoading}
          />

          <Select
            label="Método de Pago"
            name="payment_method"
            value={formData.payment_method}
            onChange={handleChange}
            placeholder="Selecciona método"
            options={[
              { value: 'cash', label: 'Efectivo' },
              { value: 'card', label: 'Tarjeta' },
              { value: 'transfer', label: 'Transferencia' },
              { value: 'digital', label: 'Pago digital' },
              { value: 'other', label: 'Otro' },
            ]}
            disabled={isLoading}
          />
        </div>

        <div className="pt-1 flex flex-col sm:flex-row gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              name="is_recurring"
              checked={formData.is_recurring}
              onChange={handleChange}
              className="rounded-sm border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500"
              disabled={isLoading}
            />
            <span>Gasto Recurrente</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              name="is_reimbursable"
              checked={formData.is_reimbursable}
              onChange={handleChange}
              className="rounded-sm border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500"
              disabled={isLoading}
            />
            <span>Reembolsable</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Notas
          </label>
          <textarea
            name="notes"
            rows={2}
            value={formData.notes}
            onChange={handleChange}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            placeholder="Comentarios adicionales"
            disabled={isLoading}
          />
        </div>

        <div className="pt-3 flex items-center justify-end gap-3 border-t border-zinc-200 dark:border-zinc-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {isEditing ? 'Guardar Cambios' : 'Registrar Gasto'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
