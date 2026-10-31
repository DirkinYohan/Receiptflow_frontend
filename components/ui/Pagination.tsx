'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize = 20,
  onPageChange,
  className = '',
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = totalCount ? Math.min(currentPage * pageSize, totalCount) : currentPage * pageSize;

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 text-sm text-zinc-600 dark:text-zinc-400 ${className}`}
    >
      <div>
        {totalCount !== undefined ? (
          <p>
            Mostrando <span className="font-medium text-zinc-900 dark:text-zinc-100">{startItem}</span> a{' '}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{endItem}</span> de{' '}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{totalCount}</span> resultados
          </p>
        ) : (
          <p>
            Página <span className="font-medium text-zinc-900 dark:text-zinc-100">{currentPage}</span> de{' '}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{totalPages}</span>
          </p>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Anterior</span>
        </button>

        <span className="px-3 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          {currentPage} / {totalPages}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium cursor-pointer"
        >
          <span>Siguiente</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
