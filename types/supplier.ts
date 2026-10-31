export interface Supplier {
  id: number;
  name: string;
  tax_id: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  notes: string;
  is_favorite: boolean;
  document_count?: number;
  expense_count?: number;
  created_at: string;
  updated_at: string;
}

export interface SupplierAutocomplete {
  id: number;
  name: string;
  tax_id: string;
  email: string;
  phone: string;
  address: string;
  is_favorite: boolean;
}

export interface SupplierCreatePayload {
  name: string;
  tax_id?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  notes?: string;
  is_favorite?: boolean;
}

export type SupplierUpdatePayload = Partial<SupplierCreatePayload>;
