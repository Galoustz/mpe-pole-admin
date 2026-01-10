export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ success: false });
  }

  try {
    const data = req.body;

    console.log("🔔 FastLipa callback:", data);

    if (!data || !data.status) {
      return res.status(200).json({ success: false });
    }

    const transactionId = data.transaction_id || data.id;

    if (data.status === "success" || data.status === "completed") {
      console.log("✅ Payment SUCCESS:", {
        transactionId,
        amount: data.amount,
        reference: data.reference,
      });

      // 👉 hapa unaweza update DB

      return res.status(200).json({ success: true });
    }

    if (data.status === "failed" || data.status === "cancelled") {
      console.log("❌ Payment FAILED:", transactionId);
      return res.status(200).json({ success: false });
    }

    return res.status(200).json({ success: false });

  } catch (error) {
    console.error("🔥 Callback error:", error);
    return res.status(200).json({ success: false });
  }
}
