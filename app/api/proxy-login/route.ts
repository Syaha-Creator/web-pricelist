import { NextRequest, NextResponse } from "next/server";

const EXTERNAL_API_URL =
  "https://alitav2.massindo.com/api/sign_in?client_id=UjQrHkqRaXgxrMnsuMQis-nbYp_jEbArPHSIN3QVQC8&client_secret=yOEtsL-v5SEg4WMDcCU6Qv7lDBhVpJIfPBpJKU68dVo";

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

    const response = await fetch(EXTERNAL_API_URL, {
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
