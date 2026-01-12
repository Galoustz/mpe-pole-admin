import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, phone, name } = body || {};

    const validAmounts = [200, 500, 1000, 2000, 5000, 10000, 20000, 50000];
    if (!amount || !validAmounts.includes(Number(amount))) {
      return NextResponse.json({ success: false, message: "Kiasi si sahihi" }, { status: 400 });
    }

    if (!phone || typeof phone !== "string") {
      return NextResponse.json({ success: false, message: "Namba ya simu si sahihi" }, { status: 400 });
    }

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ success: false, message: "Jina si sahihi" }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\s+/g, "");
    const phoneRegex = /^(\+255|0)?[0-9]{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json({ success: false, message: "Namba ya simu si sahihi" }, { status: 400 });
    }

    let formattedPhone = cleanPhone;
    if (cleanPhone.startsWith("0")) {
      formattedPhone = "255" + cleanPhone.slice(1);
    } else if (cleanPhone.startsWith("+255")) {
      formattedPhone = cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith("255")) {
      formattedPhone = "255" + cleanPhone;
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

    const payload = {
      number: formattedPhone,
      amount: Number(amount),
      name: name,
    };

    const response = await fetch(`${baseUrl}/api/create-transaction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    let data: any;
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: "Malipo yameshindwa kuanzishwa", raw: data },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Ombi la malipo limetumwa",
      transactionId: data?.data?.tranID,
    });
  } catch (error) {
    console.error("🔥 Payment error:", error);
    return NextResponse.json(
      { success: false, message: "Kuna shida ya mtandao, jaribu tena" },
      { status: 500 }
    );
  }
}
