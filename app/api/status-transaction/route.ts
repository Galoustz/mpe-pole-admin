import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const tranid = url.searchParams.get("tranid");

    if (!tranid) {
      return NextResponse.json(
        { success: false, message: "Transaction ID required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.FASTLIPA_API_KEY;
    const baseUrl = process.env.FASTLIPA_BASE_URL;

    if (!apiKey || !baseUrl) {
      console.error("❌ ENV missing", { hasApiKey: !!apiKey, hasBaseUrl: !!baseUrl });
      return NextResponse.json(
        { success: false, message: "Server haijasanidiwa vizuri" },
        { status: 500 }
      );
    }

    const response = await fetch(`${baseUrl}/api/status-transaction?tranid=${encodeURIComponent(tranid)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    let data: any;
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: (data && (data.message || data.error)) || "Failed to fetch transaction status",
          raw: data,
        },
        { status: 500 }
      );
    }

    const normalizedPaymentStatus =
      (data &&
        (data.payment_status ||
          (data.data && data.data.payment_status) ||
          (data.data && data.data.data && data.data.data.payment_status))) ||
      null;

    const normalizedStatus =
      (data && (data.status || (data.data && data.data.status) || (data.data && data.data.data && data.data.data.status))) ||
      null;

    return NextResponse.json({
      success: true,
      payment_status: normalizedPaymentStatus,
      status: normalizedStatus,
      data,
    });
  } catch (error) {
    console.error("🔥 Transaction status error:", error);
    return NextResponse.json(
      { success: false, message: "Kuna shida ya mtandao, jaribu tena" },
      { status: 500 }
    );
  }
}
