let activeLocale = 'es-CO';

export function setFormatLocale(locale: 'es' | 'en') {
  activeLocale = locale === 'en' ? 'en-US' : 'es-CO';
}

export function formatCurrency(
  amount: number | string | null | undefined,
  currency: string = 'COP',
  maximumFractionDigits: number = 2
): string {
  if (amount === null || amount === undefined || amount === '') return '$0.00';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '$0.00';

  try {
    return new Intl.NumberFormat(activeLocale, {
      style: 'currency',
      currency: currency || 'COP',
      maximumFractionDigits,
      minimumFractionDigits: 0,
    }).format(num);
  } catch {
    return `$${num.toLocaleString(activeLocale, { maximumFractionDigits })}`;
  }
}

export function formatDate(
  dateInput: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  };

  return new Intl.DateTimeFormat(activeLocale, defaultOptions).format(date);
}

export function localDateInput(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatMonth(month: string | null | undefined): string {
  if (!month) return '';
  const [year, monthIndex] = month.split('-').map(Number);
  if (!year || !monthIndex) return month;
  return new Intl.DateTimeFormat(activeLocale, { month: 'short', year: 'numeric' }).format(
    new Date(year, monthIndex - 1, 1)
  );
}

export function formatDateTime(dateInput: string | Date | null | undefined): string {
  return formatDate(dateInput, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatPercentage(val: number | null | undefined): string {
  if (val === null || val === undefined) return '0%';
  const prefix = val > 0 ? '+' : '';
  return `${prefix}${val.toFixed(1)}%`;
}
