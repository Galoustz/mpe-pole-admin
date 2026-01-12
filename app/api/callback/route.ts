import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!data || !data.status) {
      console.error("Invalid callback data:", data);
      return NextResponse.json({ success: false }, { status: 200 });
    }

    const transactionId = data.transaction_id || data.id;

    if (data.status === "success" || data.status === "completed") {
      console.log("✅ Payment successful:", {
        transactionId,
        reference: data.reference,
        amount: data.amount,
      });

      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (data.status === "failed" || data.status === "cancelled") {
      console.log("❌ Payment failed:", {
        transactionId,
        reference: data.reference,
        reason: data.reason,
      });

      return NextResponse.json({ success: false }, { status: 200 });
    }

    console.log("⚠️ Unknown status:", data);
    return NextResponse.json({ success: false }, { status: 200 });
  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
