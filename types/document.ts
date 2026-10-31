import { SupplierAutocomplete } from './supplier';

export type DocumentType = 'receipt' | 'invoice' | 'ticket' | 'other';

export type DocumentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'review_required'
  | 'failed';

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'digital' | 'other';

export interface ExpenseItem {
  id?: number;
  sequence: number;
  sku?: string;
  description: string;
  quantity: number | string | null;
  unit_price: number | string | null;
  unit?: string;
  tax_rate?: number | string | null;
  tax_amount?: number | string | null;
  discount_amount?: number | string;
  total_amount: number | string | null;
  notes?: string;
  extra?: Record<string, unknown>;
}

export interface Document {
  id: number;
  title: string;
  document_number: string;
  document_type: DocumentType;
  original_filename: string;
  file_size: number | null;
  mime_type: string;
  status: DocumentStatus;
  processing_attempts: number;
  processing_error: string;
  supplier: number | null;
  supplier_name: string | null;
  category: number | null;
  category_name: string | null;
  issued_at: string | null;
  due_date: string | null;
  subtotal_amount: string | null;
  total_amount: string | null;
  tax_amount: string | null;
  discount_amount: string | null;
  tip_amount: string | null;
  currency: string;
  payment_method: PaymentMethod | '';
  is_paid: boolean;
  has_line_items: boolean;
  notes: string;
  line_items_count: number;
  expense_id: number | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExtractedSection {
  name?: string | null;
  columns?: string[];
  rows?: { cells?: { column?: string | null; value?: string | null }[] }[];
}

export interface StructuredOCRData {
  document_type?: string;
  document_number?: string;
  supplier_name?: string;
  supplier_tax_id?: string;
  supplier_nit?: string;
  supplier_verification_digit?: string;
  cufe?: string;
  supplier_email?: string;
  supplier_phone?: string;
  supplier_website?: string;
  supplier_address?: string;
  category?: string;
  issued_at?: string;
  issue_date?: string;
  issue_time?: string;
  due_date?: string;
  subtotal_amount?: string | number;
  tax_amount?: string | number;
  iva_amount?: string | number;
  discount_amount?: string | number;
  tip_amount?: string | number;
  withholdings_amount?: string | number;
  withholdings?: Record<string, string | number>;
  total_amount?: string | number;
  currency?: string;
  payment_method?: string;
  line_items?: ExpenseItem[];
  sections?: ExtractedSection[];
  document_class?: string;
  notes?: string;
  requires_review?: boolean;
  review_reasons?: string[];
  [key: string]: unknown;
}

export interface DocumentDetail extends Document {
  file: string;
  file_url: string | null;
  raw_ocr_data: Record<string, unknown>;
  structured_data: StructuredOCRData;
  processing_started_at: string | null;
  processing_time_ms: number | null;
  line_items: ExpenseItem[];
  supplier_data: SupplierAutocomplete | null;
  is_processed: boolean;
  requires_review: boolean;
  checksum: string;
}

export interface DocumentStatusResponse {
  id: number;
  status: DocumentStatus;
  status_display: string;
  processing_started_at: string | null;
  processed_at: string | null;
  processing_time_ms: number | null;
  processing_attempts: number;
  processing_error: string;
  requires_review: boolean;
  is_processed: boolean;
}

export interface DocumentStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  review_required: number;
  failed: number;
  paid: number;
  unpaid: number;
  total_amount_sum: string | number;
}

export interface DocumentUploadPayload {
  file: File;
  title?: string;
  document_type?: DocumentType;
  notes?: string;
}

export interface DocumentUpdateExtractedDataPayload {
  title?: string;
  document_number?: string;
  supplier_id?: number | null;
  category_id?: number | null;
  issued_at?: string | null;
  due_date?: string | null;
  subtotal_amount?: number | string | null;
  total_amount?: number | string | null;
  tax_amount?: number | string | null;
  discount_amount?: number | string | null;
  tip_amount?: number | string | null;
  currency?: string;
  payment_method?: string;
  notes?: string;
  status?: 'pending' | 'completed' | 'review_required';
  line_items?: ExpenseItem[];
  supplier_name?: string;
  is_paid?: boolean;
}

export type MissingField = 'total_amount' | 'supplier' | 'issued_at' | 'category';

export interface ReviewQueueItem extends DocumentDetail {
  review_reasons: string[];
  missing_fields: MissingField[];
}

export type DueState = 'overdue' | 'due_soon' | 'upcoming' | 'no_due_date';

export interface PayableItem {
  id: number;
  title: string;
  supplier_name: string | null;
  category_name: string | null;
  total_amount: number | string;
  currency: string;
  due_date: string | null;
  days_until_due: number | null;
  state: DueState;
}

export interface PayablesOverview {
  buckets: Record<DueState, PayableItem[]>;
  totals: Record<DueState, number | string>;
}
