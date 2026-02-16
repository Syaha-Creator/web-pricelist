/**
 * Shared type definitions for the Alita Pricelist app.
 */

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

/** Order / Order Letter (SP) */
export interface OrderLetter {
  id: number;
  no_sp: string;
  customer_name: string;
  extended_amount: number;
  status: string;
}

export interface WorkPlace {
  id: number;
  name: string;
  category: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
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
