/**
 * Shared type definitions for the Alita Pricelist app.
 */

export interface User {
  id: number;
  name: string;
  email: string;
  /** Nama lengkap dari tabel contacts (first + middle + last), untuk tampilan di Ganti Sales */
  fullName?: string;
}

export interface Product {
  id: number;
  brand: string;
  tipe: string;
  ukuran: string;
  pricelist: number;
  end_user_price: number;
  program: string | null;
  kasur: string;
  divan: string;
  headboard: string;
  series?: string | null;
}

export interface GetProductsResult {
  products: Product[];
  hasMore: boolean;
}

/** Order / Order Letter (SP) - base fields from order_letters */
export interface OrderLetter {
  id: number;
  no_sp: string;
  customer_name: string;
  extended_amount: number;
  status: string;
}

/** Extended Order with creator & work_place for admin views */
export interface Order {
  id: number;
  no_sp: string;
  creator?: number;
  work_place_id?: number;
  customer_name?: string;
  extended_amount?: number;
  status?: string;
}

export interface WorkPlace {
  id: number;
  name: string;
  category: string;
}

export interface OrderForCreatorChange {
  id: number;
  no_sp: string;
  creator: number;
  creator_name: string;
}

export type ApiResult<T> =
  | { success: true; data?: T }
  | { success: false; error: string };

/** Generic action response for server actions */
export interface ActionResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

/** Order letter detail (item row) */
export interface OrderLetterDetail {
  id: number;
  order_letter_id: number;
  item_number: string;
  item_description: string;
  qty: number;
  unit_price: number;
  extended_price: number;
  brand?: string;
  net_price?: number;
  customer_price?: number;
}

/** Order letter payment */
export interface OrderLetterPayment {
  id: number;
  order_letter_id: number;
  payment_amount: number;
  payment_method: string;
  created_at?: string;
}

/** Order letter discount (approval) */
export interface OrderLetterDiscount {
  id: number;
  order_letter_id: number;
  approver_name: string;
  approver_level_id: number;
  discount?: number;
  status?: string;
}

/** Full SP overview for Edit Order modal */
export interface SPFullOverview {
  header: {
    id: number;
    no_sp: string;
    customer_name: string;
    extended_amount: number;
    status: string;
    phone?: string;
    email?: string;
    address?: string;
    address_ship_to?: string;
    order_date?: string;
    request_date?: string;
    sales_code?: string;
    note?: string;
    take_away?: boolean;
  };
  items: OrderLetterDetail[];
  payments: OrderLetterPayment[];
  approvals: OrderLetterDiscount[];
}
