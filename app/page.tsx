"use client";

import * as React from "react";

export default function Home() {
  return (
    <ContributionPage />
  );
}

function ContributionPage() {
  const AMOUNTS = [200, 500, 1000, 2000, 5000, 10000, 20000, 50000] as const;

  const [selectedAmount, setSelectedAmount] = React.useState<number | null>(null);
  const [fullName, setFullName] = React.useState("");
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);
  const [stage, setStage] = React.useState<"form" | "processing" | "thankyou">("form");
  const [submitting, setSubmitting] = React.useState(false);

  const transactionIdRef = React.useRef<string | null>(null);
  const pollingTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (pollingTimeoutRef.current) {
        window.clearTimeout(pollingTimeoutRef.current);
      }
    };
  }, []);

  const normalizePhone = (raw: string) => raw.replace(/\s+/g, "").trim();

  const shareText = "Mchango wa pole - Tuko pamoja katika kipindi hiki kigumu";
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedAmount) return;

    const name = (fullName || "").trim();
    const cleanPhone = normalizePhone(phoneNumber || "");
    const phoneRegex = /^(\+255|0)?[0-9]{9}$/;

    if (!phoneRegex.test(cleanPhone)) {
      setFormError("Tafadhali ingiza nambari ya simu sahihi.");
      return;
    }

    if (!name) {
      setFormError("Tafadhali ingiza jina lako.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/fastlipa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: selectedAmount,
          phone: cleanPhone,
          name,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        setFormError(data?.message || "Kuna tatizo. Tafadhali jaribu tena.");
        setSubmitting(false);
        return;
      }

      transactionIdRef.current = data.transactionId;
      setStage("processing");
      pollTransactionStatus();
    } catch (err) {
      setFormError("Kuna tatizo la mtandao. Tafadhali jaribu tena.");
      setSubmitting(false);
    }
  };

  const pollTransactionStatus = async () => {
    const tranid = transactionIdRef.current;
    if (!tranid) return;

    let attempts = 0;
    const maxAttempts = 18;
    const pollInterval = 3000;

    const tick = async () => {
      try {
        const res = await fetch(`/api/status-transaction?tranid=${encodeURIComponent(tranid)}`);
        const data = await res.json();
        const status: string | null = (data && (data.payment_status || data.status)) || null;

        if (status === "COMPLETED" || status === "SUCCESS" || status === "COMPLETED_SUCCESS") {
          setStage("thankyou");
          setSubmitting(false);
          return;
        }

        if (status === "FAILED" || status === "CANCELLED" || status === "CANCELED") {
          setStage("form");
          setSubmitting(false);
          setFormError("Malipo yameshindwa. Tafadhali jaribu tena.");
          return;
        }

        attempts++;
        if (attempts >= maxAttempts) {
          setStage("form");
          setSubmitting(false);
          setFormError("Malipo hayajakamilika katika muda ulioagizwa. Tafadhali jaribu tena.");
          return;
        }

        pollingTimeoutRef.current = window.setTimeout(tick, pollInterval);
      } catch (err) {
        setStage("form");
        setSubmitting(false);
        setFormError("Kuna tatizo la mtandao. Tafadhali jaribu tena.");
      }
    };

    pollingTimeoutRef.current = window.setTimeout(tick, pollInterval);
  };

  return (
    <div className="min-h-screen bg-zinc-100 px-5 py-8 text-zinc-900">
      <div className="mx-auto w-full max-w-xl">
        <header className="mb-10 text-center">
          <h1 className="text-2xl font-semibold tracking-wide">MPE POLE ADMIN</h1>
          <p className="mt-2 text-sm text-zinc-700">Tuko pamoja katika kipindi hiki kigumu</p>
        </header>

        <main className="space-y-10">
          {stage === "form" && (
            <section className="space-y-6">
              <h2 className="text-center text-lg font-medium">Chagua Kiasi</h2>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {AMOUNTS.map((amt) => {
                  const selected = selectedAmount === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setSelectedAmount(amt)}
                      className={
                        "rounded border-2 px-4 py-3 text-sm font-medium transition-colors " +
                        (selected
                          ? "border-zinc-900 bg-zinc-900 text-zinc-50"
                          : "border-zinc-400 bg-zinc-100 text-zinc-900 hover:border-zinc-900")
                      }
                    >
                      {amt.toLocaleString("en-US")} TSh
                    </button>
                  );
                })}
              </div>

              <p className="text-center text-xs text-zinc-700/80">
                Mchango ni wa hiari na unatolewa bila kutaja jina.
              </p>

              <form onSubmit={onSubmit} className="space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-2">
                    <label htmlFor="full-name" className="text-sm font-medium">
                      Jina kamili
                    </label>
                    <input
                      id="full-name"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      placeholder="Ingiza jina lako"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded border border-zinc-400 bg-zinc-100 px-3 py-3 text-sm focus:border-zinc-900 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phone-number" className="text-sm font-medium">
                      Namba ya simu
                    </label>
                    <input
                      id="phone-number"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      placeholder="0XXXXXXXXX au +255XXXXXXXXX"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full rounded border border-zinc-400 bg-zinc-100 px-3 py-3 text-sm focus:border-zinc-900 focus:outline-none"
                    />
                  </div>
                </div>

                {formError && (
                  <div role="alert" className="rounded border border-zinc-400 bg-zinc-100 px-3 py-3 text-sm">
                    {formError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!selectedAmount || submitting}
                  className="w-full rounded bg-zinc-900 px-4 py-4 text-sm font-medium text-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Inasubiri..." : "Changia Sasa"}
                </button>
              </form>
            </section>
          )}

          {stage === "processing" && (
            <section className="rounded px-4 py-8 text-center">
              <h2 className="text-base font-normal">Inasubiri malipo yako...</h2>
              <p className="mt-2 text-sm text-zinc-700">Tafadhali subiri kwa dakika 1.5 hadi malipo yakamilike.</p>
              <div className="mx-auto mt-6 h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
            </section>
          )}

          {stage === "thankyou" && (
            <section className="rounded px-4 py-8 text-center">
              <h2 className="text-base font-normal">
                Nashukuru sana kwa mchango wako. Umeonyesha moyo wa upendo na mshikamano.
              </h2>
            </section>
          )}

          <section className="border-t border-zinc-400 pt-8">
            <h3 className="text-center text-sm font-medium">Share via</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <button
                type="button"
                onClick={() => {
                  const url = `https://wa.me/?text=${encodeURIComponent(shareText + " " + currentUrl)}`;
                  window.open(url, "_blank");
                }}
                className="rounded border border-zinc-400 bg-zinc-100 px-3 py-3 text-sm hover:border-zinc-900"
              >
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() => {
                  const url = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareText)}`;
                  window.open(url, "_blank");
                }}
                className="rounded border border-zinc-400 bg-zinc-100 px-3 py-3 text-sm hover:border-zinc-900"
              >
                Telegram
              </button>
              <button
                type="button"
                onClick={() => {
                  const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
                  window.open(url, "_blank");
                }}
                className="rounded border border-zinc-400 bg-zinc-100 px-3 py-3 text-sm hover:border-zinc-900"
              >
                Facebook
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(currentUrl);
                  } catch (err) {
                    const textArea = document.createElement("textarea");
                    textArea.value = currentUrl;
                    document.body.appendChild(textArea);
                    textArea.select();
                    try {
                      document.execCommand("copy");
                    } finally {
                      document.body.removeChild(textArea);
                    }
                  }
                }}
                className="rounded border border-zinc-400 bg-zinc-100 px-3 py-3 text-sm hover:border-zinc-900"
              >
                Copy link
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
