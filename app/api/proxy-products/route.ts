import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://alitav2.massindo.com/api/rawdata_price_lists/filtered_pl";
const CLIENT_ID = "UjQrHkqRaXgxrMnsuMQis-nbYp_jEbArPHSIN3QVQC8";
const CLIENT_SECRET = "yOEtsL-v5SEg4WMDcCU6Qv7lDBhVpJIfPBpJKU68dVo";

// Slim product shape - only fields needed for the UI (reduces payload ~80%)
interface SlimProduct {
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
}

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=59",
};

function slimProduct(row: Record<string, unknown>): SlimProduct {
  return {
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
  };
}

export async function GET(request: NextRequest) {
  try {
    const token =
      request.nextUrl.searchParams.get("access_token") ??
      request.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized. Missing access token." },
        { status: 401 }
      );
    }

    const url = new URL(BASE_URL);
    url.searchParams.set("access_token", token);
    url.searchParams.set("client_id", CLIENT_ID);
    url.searchParams.set("client_secret", CLIENT_SECRET);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (!response.ok) {
      const errorMessage =
        (data?.message ?? data?.error ?? "Failed to fetch data") as string;
      return NextResponse.json(
        { message: typeof errorMessage === "string" ? errorMessage : "Failed to fetch data" },
        { status: response.status }
      );
    }

    const rawArray = data?.data ?? data?.results ?? data?.items ?? [];
    const arr = Array.isArray(rawArray) ? rawArray : [];
    const slimData: SlimProduct[] = arr.map((row) =>
      slimProduct(typeof row === "object" && row != null ? (row as Record<string, unknown>) : {})
    );

    return NextResponse.json(
      { status: data.status ?? "ok", data: slimData },
      { status: 200, headers: CACHE_HEADERS }
    );
  } catch (err) {
    console.error("Proxy products error:", err);
    return NextResponse.json(
      { message: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
