export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const { amount, phone } = req.body;

    // ✅ Validate amount
    const validAmounts = [200, 500, 1000, 2000, 5000, 10000, 20000, 50000];
    if (!amount || !validAmounts.includes(Number(amount))) {
      return res.status(400).json({ success: false, message: "Kiasi si sahihi" });
    }

    // ✅ Validate phone
    if (!phone || typeof phone !== "string") {
      return res.status(400).json({ success: false, message: "Namba ya simu si sahihi" });
    }

    const cleanPhone = phone.replace(/\s+/g, "");
    const phoneRegex = /^(\+255|0)?[0-9]{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({ success: false, message: "Namba ya simu si sahihi" });
    }

    // ✅ Format phone → 2557XXXXXXXX
    let formattedPhone = cleanPhone;
    if (cleanPhone.startsWith("0")) {
      formattedPhone = "255" + cleanPhone.slice(1);
    } else if (cleanPhone.startsWith("+255")) {
      formattedPhone = cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith("255")) {
      formattedPhone = "255" + cleanPhone;
    }

    // ✅ ENV CHECK (HII NDIO MARA NYINGI SABABU YA ERROR)
    const apiKey = process.env.FASTLIPA_API_KEY;
    const baseUrl = process.env.FASTLIPA_BASE_URL;
    const appUrl = process.env.APP_URL;

    if (!apiKey || !baseUrl || !appUrl) {
      console.error("❌ ENV missing", { apiKey, baseUrl, appUrl });
      return res.status(500).json({
        success: false,
        message: "Server haijasanidiwa vizuri",
      });
    }

    const payload = {
      amount: Number(amount),
      phone: formattedPhone,
      reference: `MPE_${Date.now()}`,
      description: "Mchango wa pole",
      callback_url: `${appUrl}/api/callback`,
    };

    console.log("📤 Sending to FastLipa:", payload);

    const response = await fetch(`${baseUrl}/api/payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    console.log("📥 FastLipa response:", data);

    if (!response.ok) {
      return res.status(500).json({
        success: false,
        message: "Malipo yameshindwa kuanzishwa",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Ombi la malipo limetumwa",
      transactionId: data.transaction_id || data.id,
    });

  } catch (error) {
    console.error("🔥 Payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Kuna shida ya mtandao, jaribu tena",
    });
  }
}
