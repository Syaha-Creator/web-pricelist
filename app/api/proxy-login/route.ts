import { NextRequest, NextResponse } from "next/server";

function getSignInUrl(): string {
  const base = process.env.API_BASE_URL ?? "https://alitav2.massindo.com/api";
  const clientId = process.env.API_CLIENT_ID ?? "";
  const clientSecret = process.env.API_CLIENT_SECRET ?? "";
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
  });
  return `${base}/sign_in?${params.toString()}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    const response = await fetch(getSignInUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage =
        data?.message ??
        data?.error ??
        (typeof data === "string" ? data : "Login failed");
      return NextResponse.json(
        { message: typeof errorMessage === "string" ? errorMessage : "Login failed" },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("Proxy login error:", err);
    return NextResponse.json(
      { message: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
