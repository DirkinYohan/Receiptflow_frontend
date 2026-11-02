'use client';

import { useEffect, useMemo, useRef } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import { documentsService, DocumentQueryParams } from '@/services/documents.service';
import { expensesService, ExpenseQueryParams } from '@/services/expenses.service';
import { categoriesService } from '@/services/categories.service';
import { suppliersService } from '@/services/suppliers.service';
import { budgetsService } from '@/services/budgets.service';
import { reportsService, DateRangeParams } from '@/services/reports.service';
import { Document } from '@/types/document';
import { ExpenseStats } from '@/types/expense';
import { DashboardSummary } from '@/types/report';

const STILL_READING = new Set(['pending', 'processing']);
const POLL_MS = 3500;

function useSupersedingSignal(params: object) {
  const key = JSON.stringify(params);
  const controller = useMemo(() => new AbortController(), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const previous = useRef<AbortController | null>(null);
  useEffect(() => {
    if (previous.current && previous.current !== controller) previous.current.abort();
    previous.current = controller;
  }, [controller]);
  return controller.signal;
}


export function useDocuments(params: DocumentQueryParams) {
  const signal = useSupersedingSignal(params);
  return useQuery({
    queryKey: qk.documents.list(params),
    queryFn: () => documentsService.getDocuments(params, signal),
    placeholderData: keepPreviousData,
    refetchInterval: (query) =>
      query.state.data?.results?.some((doc: Document) => STILL_READING.has(doc.status)) ? POLL_MS : false,
  });
}

export function useDocument(id: number) {
  return useQuery({
    queryKey: qk.documents.detail(id),
    queryFn: () => documentsService.getDocument(id).then((res) => res.data ?? null),
    enabled: Number.isFinite(id) && id > 0,
    refetchInterval: (query) => (query.state.data && STILL_READING.has(query.state.data.status) ? POLL_MS : false),
  });
}

export function useDocumentStats() {
  return useQuery({
    queryKey: qk.documents.stats,
    queryFn: () => documentsService.getStats().then((res) => res.data ?? null),
  });
}

export function useReviewQueue() {
  return useQuery({
    queryKey: qk.documents.review,
    queryFn: () => documentsService.getReviewQueue().then((res) => res.data?.results ?? []),
  });
}

export function usePayables() {
  return useQuery({
    queryKey: qk.documents.payables,
    queryFn: () => documentsService.getPayables().then((res) => res.data ?? null),
  });
}


export function useExpenses(params: ExpenseQueryParams) {
  const signal = useSupersedingSignal(params);
  return useQuery({
    queryKey: qk.expenses.list(params),
    queryFn: () => expensesService.getExpenses(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useExpenseStats(params: ExpenseQueryParams) {
  const signal = useSupersedingSignal(params);
  return useQuery<ExpenseStats | null>({
    queryKey: qk.expenses.stats(params),
    queryFn: () => expensesService.getStats(params, signal).then((res) => res.data ?? null),
    placeholderData: keepPreviousData,
  });
}

export function useExpense(id: number) {
  return useQuery({
    queryKey: qk.expenses.detail(id),
    queryFn: () => expensesService.getExpense(id).then((res) => res.data ?? null),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useRecurringExpenses() {
  return useQuery({
    queryKey: qk.expenses.recurring,
    queryFn: () => expensesService.getRecurring().then((res) => res.data ?? []),
  });
}


export function useAvailableCategories() {
  return useQuery({
    queryKey: qk.categories.available,
    queryFn: () => categoriesService.getAvailableCategories().then((res) => res.data ?? []),
    staleTime: 5 * 60_000,
  });
}

export function useCategories(params: Record<string, string | number>) {
  const signal = useSupersedingSignal(params);
  return useQuery({
    queryKey: qk.categories.list(params),
    queryFn: () => categoriesService.getCategories(params, signal),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });
}

export function useBudgets() {
  return useQuery({
    queryKey: qk.budgets.all,
    queryFn: () => budgetsService.getBudgets().then((res) => res.data ?? []),
  });
}

export function useSuppliers(params: Record<string, string | number | boolean>) {
  const signal = useSupersedingSignal(params);
  return useQuery({
    queryKey: qk.suppliers.list(params),
    queryFn: () => suppliersService.getSuppliers(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useSupplierOptions(enabled = true) {
  return useQuery({
    queryKey: qk.suppliers.autocomplete(''),
    queryFn: () => suppliersService.autocomplete('').then((res) => res.data ?? []),
    enabled,
    staleTime: 5 * 60_000,
  });
}


export function useDashboardSummary(params: DateRangeParams) {
  return useQuery<DashboardSummary | null>({
    queryKey: qk.dashboard.summary(params),
    queryFn: () => reportsService.getDashboardSummary(params).then((res) => res.data ?? null),
    placeholderData: keepPreviousData,
  });
}

export function useMonthlyExpenses(params: DateRangeParams) {
  return useQuery({
    queryKey: qk.dashboard.monthly(params),
    queryFn: () => reportsService.getMonthlyExpenses(params).then((res) => res.data ?? []),
    placeholderData: keepPreviousData,
  });
}

export function useExpensesByCategory(params: DateRangeParams) {
  return useQuery({
    queryKey: qk.dashboard.byCategory(params),
    queryFn: () => reportsService.getExpensesByCategory(params).then((res) => res.data ?? []),
    placeholderData: keepPreviousData,
  });
}

export function useExpensesBySupplier(params: DateRangeParams) {
  return useQuery({
    queryKey: qk.dashboard.bySupplier(params),
    queryFn: () => reportsService.getExpensesBySupplier(params).then((res) => res.data ?? []),
    placeholderData: keepPreviousData,
  });
}

export function useRecentExpenses(limit: number) {
  return useQuery({
    queryKey: qk.dashboard.recentExpenses(limit),
    queryFn: () => reportsService.getRecentExpenses(limit).then((res) => res.data ?? []),
  });
}

export function useRecentDocuments(limit: number) {
  return useQuery({
    queryKey: qk.dashboard.recentDocuments(limit),
    queryFn: () => reportsService.getRecentDocuments(limit).then((res) => res.data ?? []),
  });
}
