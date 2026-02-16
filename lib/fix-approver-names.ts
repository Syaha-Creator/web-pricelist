/**
 * Memperbaiki kolom approver_name di order_letter_discounts yang bermasalah.
 * Mengambil nama dari tabel contacts: gabungan first_name, middle_name, last_name.
 * Baris bermasalah: approver_name NULL, kosong, terlalu pendek (< 3 karakter),
 * atau tidak cocok dengan nama lengkap di contacts.
 */
import { query } from "@/lib/db";

export interface FixApproverNamesResult {
  updated: number;
  checked: number;
  errors: string[];
}

export async function fixApproverNames(): Promise<FixApproverNamesResult> {
  const errors: string[] = [];
  let updated = 0;
  let checked = 0;

  try {
    // 1. Update baris bermasalah dengan nama dari contacts (first_name + middle_name + last_name)
    // Relasi: users.id = approver, contacts.user_id = users.id
    // Kondisi bermasalah: NULL, kosong, < 3 char, atau tidak sama dengan nama lengkap contacts
    const { rowCount } = await query<Record<string, unknown>>(
      `UPDATE order_letter_discounts o
       SET approver_name = INITCAP(TRIM(CONCAT_WS(' ', c.first_name, c.middle_name, c.last_name))), updated_at = NOW()
       FROM users u
       JOIN contacts c ON c.user_id = u.id
       WHERE (o.approver)::bigint = u.id
         AND (
           o.approver_name IS NULL
           OR TRIM(COALESCE(o.approver_name, '')) = ''
           OR LENGTH(TRIM(o.approver_name)) < 3
           OR TRIM(o.approver_name) != INITCAP(TRIM(CONCAT_WS(' ', c.first_name, c.middle_name, c.last_name)))
         )
         AND o.approver_level_id IN (1, 2, 3)`
    );

    updated = rowCount ?? 0;

    // 2. Hitung total baris yang dicek (order_letter_discounts dengan approver_level_id = 1)
    const countResult = await query<Record<string, unknown>>(
      `SELECT COUNT(*)::int as cnt FROM order_letter_discounts WHERE approver_level_id IN (1, 2, 3)`
    );
    checked = Number(countResult.rows[0]?.cnt ?? 0);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(msg);
  }

  return { updated, checked, errors };
}
