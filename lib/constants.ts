export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const DOCUMENT_STATUS_MAP: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  pending: {
    label: 'Pendiente',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800',
  },
  processing: {
    label: 'Procesando OCR',
    color: 'text-sky-700 dark:text-sky-300',
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    border: 'border-sky-200 dark:border-sky-800',
  },
  completed: {
    label: 'Procesado',
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  review_required: {
    label: 'Requiere Revisión',
    color: 'text-orange-700 dark:text-orange-300',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    border: 'border-orange-200 dark:border-orange-800',
  },
  failed: {
    label: 'Error',
    color: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-800',
  },
};

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  receipt: 'Recibo',
  invoice: 'Factura',
  ticket: 'Ticket POS',
  other: 'Otro documento',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta (Crédito/Débito)',
  transfer: 'Transferencia Bancaria',
  digital: 'Billetera Digital',
  other: 'Otro método',
};

export const NAVIGATION_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Documentos', href: '/documents', icon: 'FileText' },
  { label: 'Gastos', href: '/expenses', icon: 'Receipt' },
  { label: 'Categorías', href: '/categories', icon: 'FolderTree' },
  { label: 'Proveedores', href: '/suppliers', icon: 'Building2' },
  { label: 'Reportes', href: '/reports', icon: 'BarChart3' },
  { label: 'Configuración', href: '/settings', icon: 'Settings' },
];
