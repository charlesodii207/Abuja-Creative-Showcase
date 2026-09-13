"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

type CheckinResult = {
  result: "approved" | "already_checked_in";
  full_name: string;
  category_tag: string;
  checked_in_at: string | null;
  message: string;
};

type Phase = "idle" | "scanning" | "checking" | "result";

export default function StaffScanPage() {
  const [manualCode, setManualCode] = useState("");
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const scannerRef = useRef<Html5Qrcode | null>(null);

  async function submitCode(code: string) {
    setError("");
    setResult(null);
    setPhase("checking");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_number: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Ticket not found.");
        setPhase("idle");
        return;
      }
      setResult(data);
      setPhase("result");
    } catch {
      setError("Something went wrong checking that ticket.");
      setPhase("idle");
    }
  }

  async function stopCamera() {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // camera may already be stopped — safe to ignore
      }
      scannerRef.current = null;
    }
  }

  function startScanning() {
    setResult(null);
    setError("");
    setPhase("scanning");
  }

  useEffect(() => {
    if (phase !== "scanning") return;

    let cancelled = false;
    let handledOnce = false;

    (async () => {
      try {
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          async (decodedText) => {
            if (handledOnce) return;
            handledOnce = true;

            await stopCamera();
            if (!cancelled) {
              await submitCode(decodedText.trim().toUpperCase());
            }
          },
          () => {}
        );
      } catch (err) {
        if (!cancelled) {
          setError(`Camera error: ${err instanceof Error ? err.message : String(err)}`);
          setPhase("idle");
        }
      }
    })();

    return () => {
      cancelled = true;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="font-display text-3xl text-cream">Door Check-In</h1>
      <p className="mt-2 text-muted">Scan a ticket QR code, or type the ticket number manually.</p>

      <div className="mt-8">
        {phase === "idle" && (
          <button
            onClick={startScanning}
            className="w-full rounded-full bg-teal px-7 py-3.5 text-sm font-medium text-ink"
          >
            Start Camera Scan
          </button>
        )}

        {phase === "scanning" && (
          <>
            <div
              id="qr-reader"
              className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl"
              style={{ minHeight: 300 }}
            />
            <button
              onClick={() => {
                stopCamera();
                setPhase("idle");
              }}
              className="mt-4 w-full rounded-full border border-white/20 px-7 py-3 text-sm text-cream"
            >
              Stop Camera
            </button>
          </>
        )}

        {phase === "checking" && (
          <div className="mx-auto flex w-full max-w-sm flex-col items-center justify-center rounded-2xl border border-white/10 bg-ink-raised py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal/30 border-t-teal" />
            <p className="mt-4 text-muted">Checking ticket...</p>
          </div>
        )}

        {phase === "result" && result && (
          <div
            className={`rounded-2xl border px-6 py-8 text-center ${
              result.result === "approved" ? "border-teal/40 bg-ink-raised" : "border-gold/40 bg-ink-raised"
            }`}
          >
            <p className="font-display text-2xl text-cream">
              {result.result === "approved" ? "✅ Approved" : "⚠️ Already Arrived"}
            </p>
            <p className="mt-3 text-cream">{result.full_name}</p>
            <p className="text-teal">{result.category_tag}</p>
            <p className="mt-3 text-muted">{result.message}</p>

            <button
              onClick={startScanning}
              className="mt-6 w-full rounded-full bg-teal px-7 py-3.5 text-sm font-medium text-ink"
            >
              Scan Next Person
            </button>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (manualCode.trim()) submitCode(manualCode.trim().toUpperCase());
        }}
        className="mt-8 flex gap-2"
      >
        <input
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder="Enter ticket number manually"
          className="flex-1 rounded-lg border border-white/10 bg-ink px-4 py-3 text-cream"
        />
        <button type="submit" className="rounded-full bg-gold px-6 py-3 text-sm font-medium text-ink">
          Check
        </button>
      </form>

      {error && phase === "idle" && <p className="mt-6 text-red">{error}</p>}
    </main>
  );
}