"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import type {
  Product,
  GetProductsResult,
  OrderLetter,
  WorkPlace,
  User,
  OrderForCreatorChange,
  SPFullOverview,
  OrderLetterDetail,
} from "@/types";

const DB_ERROR_MESSAGE =
  "Database belum dikonfigurasi atau tidak tersedia. Silakan atur DB_HOST, DB_USER, DB_PASSWORD, DB_NAME di file .env (lihat .env.example).";

function isDbError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return (
      msg.includes("database") ||
      msg.includes("connect") ||
      msg.includes("does not exist") ||
      msg.includes("ECONNREFUSED") ||
      msg.includes("timeout")
    );
  }
  return false;
}

const SEARCH_COLUMNS = [
  "brand",
  "tipe",
  "series",
  "ukuran",
  "program",
  "kasur",
  "divan",
  "headboard",
] as const;

export async function getProducts(
  page: number = 1,
  search: string = "",
  brand?: string
): Promise<GetProductsResult> {
  const limit = 20;
  const offset = (Math.max(1, page) - 1) * limit;

  const keywords = search.trim().split(/\s+/).filter(Boolean);
  const params: unknown[] = [];
  const conditions: string[] = [];

  if (keywords.length > 0) {
    keywords.forEach((term, i) => {
      params.push(`%${term}%`);
      const colConditions = SEARCH_COLUMNS.map(
        (col) => `${col} ILIKE $${i + 1}`
      ).join(" OR ");
      conditions.push(`(${colConditions})`);
    });
  }

  const whereClause =
    conditions.length > 0 ? conditions.join(" AND ") : "1=1";

  let brandFilterSql = "";
  const brandValue = brand?.trim();
  if (brandValue && brandValue.toLowerCase() !== "all") {
    params.push(brandValue);
    brandFilterSql = ` AND brand = $${params.length}`;
  }

  params.push(offset);
  const offsetParam = params.length;

  const sql = `
    SELECT id, brand, tipe, ukuran, pricelist, end_user_price, program, kasur, divan, headboard, series
    FROM rawdata_price_lists
    WHERE ${whereClause}${brandFilterSql}
    ORDER BY id DESC
    LIMIT ${limit} OFFSET $${offsetParam}
  `;

  let rows: Record<string, unknown>[];
  try {
    const result = await query<Record<string, unknown>>(sql, params);
    rows = result.rows;
  } catch (err) {
    if (isDbError(err)) throw new Error(DB_ERROR_MESSAGE);
    throw err;
  }

  const products: Product[] = rows.map((row) => ({
    id: Number(row.id ?? 0),
    brand: String(row.brand ?? ""),
    tipe: String(row.tipe ?? ""),
    ukuran: String(row.ukuran ?? ""),
    pricelist: Number(row.pricelist ?? 0),
    end_user_price: Number(row.end_user_price ?? 0),
    program: row.program != null ? String(row.program) : null,
    kasur: String(row.kasur ?? ""),
    divan: String(row.divan ?? ""),
    headboard: String(row.headboard ?? ""),
    series: row.series != null ? String(row.series) : null,
  }));

  const hasMore = rows.length === limit;

  return { products, hasMore };
}

const API_BASE_URL =
  process.env.API_BASE_URL ?? "https://alitav2.massindo.com/api";
const CLIENT_ID = process.env.API_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.API_CLIENT_SECRET ?? "";
const ADMIN_USER_ID = process.env.API_ADMIN_USER_ID ?? "";

async function findOrderBySPFromAPI(
  spNumber: string,
  accessToken: string
): Promise<OrderLetter | null> {
  try {
    const url = new URL(`${API_BASE_URL}/order_letters`);
    url.searchParams.set("no_sp", spNumber);
    url.searchParams.set("access_token", accessToken);
    url.searchParams.set("client_id", CLIENT_ID);
    url.searchParams.set("client_secret", CLIENT_SECRET);
    url.searchParams.set("user_id", ADMIN_USER_ID);

    const response = await fetch(url.toString());
    const data = (await response.json().catch(() => null)) as unknown;

    if (!response.ok) return null;

    let list: Record<string, unknown>[] = [];
    if (Array.isArray(data)) list = data;
    else if (data && typeof data === "object" && "result" in data && Array.isArray((data as { result: unknown }).result))
      list = (data as { result: Record<string, unknown>[] }).result;
    else if (data && typeof data === "object" && "order_letters" in data && Array.isArray((data as { order_letters: unknown }).order_letters))
      list = (data as { order_letters: Record<string, unknown>[] }).order_letters;
    else if (data && typeof data === "object" && "id" in data)
      list = [data as Record<string, unknown>];

    const row = list.find(
      (r) => String(r?.no_sp ?? r?.no_sp_number ?? "").trim() === spNumber
    ) ?? list[0];
    if (!row) return null;

    return {
      id: Number(row.id ?? 0),
      no_sp: String(row.no_sp ?? row.no_sp_number ?? spNumber),
      customer_name: String(row.customer_name ?? row.customer ?? ""),
      extended_amount: Number(row.extended_amount ?? row.amount ?? 0),
      status: String(row.status ?? ""),
    };
  } catch {
    return null;
  }
}

export async function findOrderBySP(
  spNumber: string,
  accessToken?: string | null
): Promise<OrderLetter | null> {
  const trimmed = spNumber?.trim();
  if (!trimmed) return null;

  try {
    const { rows } = await query<Record<string, unknown>>(
      `SELECT id, no_sp, customer_name, extended_amount, status
       FROM order_letters
       WHERE no_sp = $1
       LIMIT 1`,
      [trimmed]
    );

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      id: Number(row.id ?? 0),
      no_sp: String(row.no_sp ?? ""),
      customer_name: String(row.customer_name ?? ""),
      extended_amount: Number(row.extended_amount ?? 0),
      status: String(row.status ?? ""),
    };
  } catch (err) {
    if (isDbError(err) && accessToken?.trim()) {
      const fromApi = await findOrderBySPFromAPI(trimmed, accessToken);
      if (fromApi) return fromApi;
    }
    if (isDbError(err)) throw new Error(DB_ERROR_MESSAGE);
    throw err;
  }
}

export async function voidOrderViaAPI(
  orderId: number,
  accessToken: string
): Promise<
  | { success: true }
  | { success: false; error: string }
> {
  if (!accessToken?.trim()) {
    return { success: false, error: "Access token is required." };
  }

  const url = new URL(
    `${API_BASE_URL}/order_letters/${orderId}/order_letters_rejected`
  );
  url.searchParams.set("user_id", ADMIN_USER_ID);
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("client_secret", CLIENT_SECRET);

  const response = await fetch(url.toString(), { method: "GET" });
  const data = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    const msg =
      (data?.message ??
        data?.error ??
        data?.error_description ??
        (Array.isArray(data?.errors)
          ? (data.errors as unknown[]).map((e) => String(e)).join(", ")
          : null) ??
        `HTTP ${response.status}`) as string | null;
    const errorMsg = msg && typeof msg === "string" ? msg : "Void request failed.";
    console.error("[voidOrderViaAPI] Failed:", response.status, url, data);
    return { success: false, error: errorMsg };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function searchWorkPlaces(
  keyword: string
): Promise<WorkPlace[]> {
  const trimmed = keyword?.trim();
  if (!trimmed) return [];

  const terms = trimmed.split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const params: unknown[] = [];
  const conditions: string[] = [];

  terms.forEach((term) => {
    params.push(`%${term}%`);
    const idx = params.length;
    conditions.push(`(name ILIKE $${idx} OR category ILIKE $${idx})`);
  });

  const whereClause = conditions.join(" AND ");
  const sql = `SELECT id, name, category
   FROM work_places
   WHERE ${whereClause}
   LIMIT 5`;

  try {
    const { rows } = await query<Record<string, unknown>>(sql, params);
    return rows.map((row) => ({
      id: Number(row.id ?? 0),
      name: String(row.name ?? ""),
      category: String(row.category ?? ""),
    }));
  } catch (err) {
    if (isDbError(err)) throw new Error(DB_ERROR_MESSAGE);
    throw err;
  }
}

export async function updateOrderWorkPlace(
  spNumber: string,
  workPlaceId: number
): Promise<{ success: true } | { success: false; error: string }> {
  const trimmedSp = spNumber?.trim();
  if (!trimmedSp) {
    return { success: false, error: "Nomor SP diperlukan." };
  }

  try {
    const { rowCount } = await query<Record<string, unknown>>(
      `UPDATE order_letters
       SET work_place_id = $1, updated_at = NOW()
       WHERE no_sp = $2`,
      [workPlaceId, trimmedSp]
    );

    if (rowCount === 0) {
      return { success: false, error: "Nomor SP tidak ditemukan." };
    }
  } catch (err) {
    if (isDbError(err)) return { success: false, error: DB_ERROR_MESSAGE };
    throw err;
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function findUserByEmail(
  email: string,
  accessToken?: string | null
): Promise<User | null> {
  const trimmed = email?.trim();
  if (!trimmed) return null;

  // Step A: Get user from local DB (id, name as fallback, email)
  let rows: Record<string, unknown>[];
  try {
    const result = await query<Record<string, unknown>>(
      `SELECT id, name, email
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [trimmed]
    );
    rows = result.rows;
  } catch (err) {
    if (isDbError(err)) throw new Error(DB_ERROR_MESSAGE);
    throw err;
  }

  if (rows.length === 0) return null;

  const row = rows[0];
  const userId = Number(row.id ?? 0);
  const dbName = String(row.name ?? "");
  const userEmail = String(row.email ?? "");

  // Step B & C: Fetch official name from contact_work_experiences API (pakai token dari login)
  let apiName: string | null = null;
  const token = accessToken?.trim();
  if (token) {
    try {
      const url = new URL(`${API_BASE_URL}/contact_work_experiences`);
      url.searchParams.set("access_token", token);
      url.searchParams.set("client_id", CLIENT_ID);
      url.searchParams.set("client_secret", CLIENT_SECRET);
      url.searchParams.set("user_id", String(userId));

      const response = await fetch(url.toString());
      const data = (await response.json().catch(() => null)) as Record<
        string,
        unknown
      > | null;

      if (data?.result && Array.isArray(data.result) && data.result.length > 0) {
        const first = data.result[0] as Record<string, unknown> | null;
        const user = first?.user as Record<string, unknown> | null;
        if (user?.name != null) {
          apiName = String(user.name);
        }
      }
    } catch {
      // Fallback to DB name; no need to log for expected network/API issues
    }
  }

  // Step D: Return with official name or DB fallback
  return {
    id: userId,
    name: apiName?.trim() || dbName,
    email: userEmail,
  };
}

export async function getOrderForCreatorChange(
  spNumber: string
): Promise<OrderForCreatorChange | null> {
  const trimmed = spNumber?.trim();
  if (!trimmed) return null;

  try {
    const { rows } = await query<Record<string, unknown>>(
      `SELECT
         o.id,
         o.no_sp,
         o.creator,
         COALESCE(u.name, 'Unknown User (' || COALESCE(o.creator, '?') || ')') as creator_name
       FROM order_letters o
       LEFT JOIN users u ON (o.creator)::bigint = u.id
       WHERE o.no_sp = $1
       LIMIT 1`,
      [trimmed]
    );

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      id: Number(row.id ?? 0),
      no_sp: String(row.no_sp ?? ""),
      creator: Number(row.creator ?? 0),
      creator_name: String(row.creator_name ?? `User #${row.creator}`),
    };
  } catch (error) {
    if (isDbError(error)) throw new Error(DB_ERROR_MESSAGE);
    console.error("CRITICAL ERROR in getOrderForCreatorChange:", error);
    throw new Error("Database query failed");
  }
}

export async function updateOrderCreator(
  spNumber: string,
  newUserId: number,
  newUserName: string
): Promise<{ success: true } | { success: false; error: string }> {
  const trimmedSp = spNumber?.trim();
  if (!trimmedSp) {
    return { success: false, error: "Nomor SP diperlukan." };
  }

  try {
    const { rows } = await query<Record<string, unknown>>(
      `SELECT id FROM order_letters WHERE no_sp = $1 LIMIT 1`,
      [trimmedSp]
    );

    if (rows.length === 0) {
      return { success: false, error: "Nomor SP tidak ditemukan." };
    }

    const orderId = Number(rows[0].id ?? 0);

    await query<Record<string, unknown>>(
      `UPDATE order_letters
       SET creator = $2, updated_at = NOW()
       WHERE id = $1`,
      [orderId, newUserId]
    );

    await query<Record<string, unknown>>(
      `UPDATE order_letter_discounts
       SET approver = $2, approver_name = $3, updated_at = NOW()
       WHERE order_letter_id = $1 AND approver_level_id = 1`,
      [orderId, newUserId, newUserName]
    );
  } catch (err) {
    if (isDbError(err)) return { success: false, error: DB_ERROR_MESSAGE };
    throw err;
  }

  revalidatePath("/dashboard");
  return { success: true };
}

// ─── Edit Order (SP Full Overview) ────────────────────────────────────────

export async function getSPFullOverview(
  spNumber: string
): Promise<SPFullOverview | null> {
  const trimmed = spNumber?.trim();
  if (!trimmed) return null;

  try {
    const { rows: orderRows } = await query<Record<string, unknown>>(
      `SELECT id, no_sp, customer_name, extended_amount, status,
              phone, email, address, address_ship_to,
              order_date, request_date, sales_code, take_away,
              COALESCE(note, keterangan) as note
       FROM order_letters
       WHERE no_sp = $1
       LIMIT 1`,
      [trimmed]
    );

    if (orderRows.length === 0) return null;

    const ol = orderRows[0];
    const orderId = Number(ol.id ?? 0);

    const [detailsResult, paymentsResult, discountsResult] =
      await Promise.all([
        query<Record<string, unknown>>(
          `SELECT d.id, d.order_letter_id, d.item_number,
                  COALESCE(NULLIF(d.item_description, ''), NULLIF(d.desc_1, ''), 'Item Tanpa Nama') as item_name,
                  d.qty, d.unit_price, d.customer_price, d.net_price,
                  (d.net_price * d.qty) as total, d.brand
           FROM order_letter_details d
           WHERE d.order_letter_id = $1
           ORDER BY d.id`,
          [orderId]
        ),
        query<Record<string, unknown>>(
          `SELECT id, order_letter_id, payment_amount, payment_method, created_at
           FROM order_letter_payments
           WHERE order_letter_id = $1
           ORDER BY id`,
          [orderId]
        ),
        query<Record<string, unknown>>(
          `SELECT id, order_letter_id, approver_name, approver_level_id, discount
           FROM order_letter_discounts
           WHERE order_letter_id = $1
           ORDER BY approver_level_id`,
          [orderId]
        ),
      ]);


    const items = detailsResult.rows.map((r) => ({
      id: Number(r.id ?? 0),
      order_letter_id: Number(r.order_letter_id ?? 0),
      item_number: String(r.item_number ?? ""),
      item_description: String(r.item_name ?? "Item Tanpa Nama"),
      qty: Number(r.qty ?? 0),
      unit_price: Number(r.unit_price ?? 0),
      extended_price: Number(r.total ?? 0),
      brand: r.brand != null ? String(r.brand) : undefined,
      net_price: r.net_price != null ? Number(r.net_price) : undefined,
      customer_price: r.customer_price != null ? Number(r.customer_price) : undefined,
    }));

    const payments = paymentsResult.rows.map((r) => ({
      id: Number(r.id ?? 0),
      order_letter_id: Number(r.order_letter_id ?? 0),
      payment_amount: Number(r.payment_amount ?? 0),
      payment_method: String(r.payment_method ?? ""),
      created_at: r.created_at != null ? String(r.created_at) : undefined,
    }));

    const approvals = discountsResult.rows.map((r) => ({
      id: Number(r.id ?? 0),
      order_letter_id: Number(r.order_letter_id ?? 0),
      approver_name: String(r.approver_name ?? ""),
      approver_level_id: Number(r.approver_level_id ?? 0),
      discount: r.discount != null ? Number(r.discount) : undefined,
    }));

    return {
      header: {
        id: orderId,
        no_sp: String(ol.no_sp ?? ""),
        customer_name: String(ol.customer_name ?? ""),
        extended_amount: Number(ol.extended_amount ?? 0),
        status: String(ol.status ?? ""),
        phone: ol.phone != null ? String(ol.phone) : undefined,
        email: ol.email != null ? String(ol.email) : undefined,
        address: ol.address != null ? String(ol.address) : undefined,
        address_ship_to: ol.address_ship_to != null ? String(ol.address_ship_to) : undefined,
        order_date: ol.order_date != null ? String(ol.order_date) : undefined,
        request_date: ol.request_date != null ? String(ol.request_date) : undefined,
        sales_code: ol.sales_code != null ? String(ol.sales_code) : undefined,
        note: ol.note != null ? String(ol.note) : undefined,
        take_away: ol.take_away != null ? Boolean(ol.take_away) : undefined,
      },
      items,
      payments,
      approvals,
    };
  } catch (err) {
    if (isDbError(err)) throw new Error(DB_ERROR_MESSAGE);
    throw err;
  }
}

export async function swapItemProduct(
  detailId: number,
  newProductId: number
): Promise<{ success: true } | { success: false; error: string }> {
  if (!detailId || !newProductId) {
    return { success: false, error: "detailId dan productId diperlukan." };
  }

  try {
    const { rows: productRows } = await query<Record<string, unknown>>(
      `SELECT id, brand, tipe, ukuran, end_user_price
       FROM rawdata_price_lists
       WHERE id = $1
       LIMIT 1`,
      [newProductId]
    );

    if (productRows.length === 0) {
      return { success: false, error: "Produk tidak ditemukan." };
    }

    const p = productRows[0];
    const itemDescription = [p.brand, p.tipe, p.ukuran]
      .filter(Boolean)
      .join(" ");
    const unitPrice = Number(p.end_user_price ?? 0);

    const { rows: detailRows } = await query<Record<string, unknown>>(
      `SELECT qty FROM order_letter_details WHERE id = $1 LIMIT 1`,
      [detailId]
    );

    if (detailRows.length === 0) {
      return { success: false, error: "Detail item tidak ditemukan." };
    }

    const qty = Number(detailRows[0].qty ?? 0);
    const extendedPrice = qty * unitPrice;

    await query<Record<string, unknown>>(
      `UPDATE order_letter_details
       SET
         item_description = $2,
         item_number = $3,
         brand = $4,
         unit_price = $5,
         net_price = $5,
         customer_price = $5,
         extended_price = $6,
         updated_at = NOW()
       WHERE id = $1`,
      [
        detailId,
        itemDescription || "—",
        String(p.id ?? ""),
        String(p.brand ?? ""),
        unitPrice,
        extendedPrice,
      ]
    );

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    if (isDbError(err)) return { success: false, error: DB_ERROR_MESSAGE };
    throw err;
  }
}
