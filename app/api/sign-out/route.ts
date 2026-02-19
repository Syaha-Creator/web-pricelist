import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy untuk sign_out / revoke token.
 * access_token = token user dari login (dikirim dari frontend).
 * client_id & client_secret diambil dari env (server-side).
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const accessToken = body?.access_token ?? body?.accessToken ?? null;

    if (!accessToken || typeof accessToken !== "string") {
      return NextResponse.json(
        { message: "access_token diperlukan" },
        { status: 400 }
      );
    }

    const base = process.env.API_BASE_URL ?? "https://alitav2.massindo.com/api";
    const clientId = process.env.API_CLIENT_ID ?? "";
    const clientSecret = process.env.API_CLIENT_SECRET ?? "";

    const response = await fetch(`${base}/sign_out`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        access_token: accessToken,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage =
        (data as { message?: string })?.message ??
        (data as { error?: string })?.error ??
        "Logout gagal";
      return NextResponse.json(
        { message: typeof errorMessage === "string" ? errorMessage : "Logout gagal" },
        { status: response.status }
      );
    }

    return NextResponse.json(
      { message: "Token berhasil di-revoke" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Sign out error:", err);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat logout" },
      { status: 500 }
    );
  }
}
