import { NextRequest, NextResponse } from "next/server";
import { fixApproverNames } from "@/lib/fix-approver-names";

/**
 * API route untuk cron job: perbaiki approver_name di order_letter_discounts.
 * Panggil endpoint ini secara berkala (misal: setiap jam atau setiap hari).
 *
 * Keamanan: kirim header Authorization: Bearer <CRON_SECRET>
 * atau x-cron-secret: <CRON_SECRET>
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const cronHeader = request.headers.get("x-cron-secret");

  const providedSecret =
    authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : cronHeader ?? null;

  if (cronSecret && cronSecret.length > 0 && providedSecret !== cronSecret) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Invalid or missing CRON_SECRET" },
      { status: 401 }
    );
  }

  try {
    const result = await fixApproverNames();

    if (result.errors.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          ...result,
          message: `Updated ${result.updated} rows. Errors: ${result.errors.join(", ")}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      ...result,
      message: `Berhasil. Diperbaiki ${result.updated} baris dari ${result.checked} baris yang dicek.`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, error: msg, message: "Gagal menjalankan fix approver names." },
      { status: 500 }
    );
  }
}
