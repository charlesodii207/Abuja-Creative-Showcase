// app/admin/(dashboard)/scan/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { checkinTicket, ApiError, type CheckinResult } from "../../../../lib/admin/api";

type Phase = "idle" | "scanning" | "checking" | "result";

export default function ScanPage() {
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
      const data = await checkinTicket(code);
      setResult(data);
      setPhase("result");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Something went wrong checking that ticket."
      );
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
    <div className="px-8 py-8 max-w-xl">
      <h1 className="font-display text-3xl text-cream">Event scan</h1>
      <p className="mt-2 font-body text-sm text-muted">
        Scan a ticket QR code, or type the ticket number manually.
      </p>

      <div className="mt-8">
        {phase === "idle" && (
          <button
            onClick={startScanning}
            className="w-full rounded-sm bg-teal px-7 py-3.5 font-body text-sm font-medium text-ink"
          >
            Start camera scan
          </button>
        )}

        {phase === "scanning" && (
          <>
            <div
              id="qr-reader"
              className="mx-auto w-full max-w-sm overflow-hidden rounded-sm"
              style={{ minHeight: 300 }}
            />
            <button
              onClick={() => {
                stopCamera();
                setPhase("idle");
              }}
              className="mt-4 w-full rounded-sm border border-ink-raised px-7 py-3 font-body text-sm text-cream"
            >
              Stop camera
            </button>
          </>
        )}

        {phase === "checking" && (
          <div className="mx-auto flex w-full max-w-sm flex-col items-center justify-center rounded-sm border border-ink-raised bg-ink-raised/40 py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal/30 border-t-teal" />
            <p className="mt-4 font-body text-sm text-muted">Checking ticket…</p>
          </div>
        )}

        {phase === "result" && result && (
          <div
            className={`rounded-sm border px-6 py-8 text-center ${
              result.result === "approved"
                ? "border-teal/40 bg-ink-raised/40"
                : "border-gold/40 bg-ink-raised/40"
            }`}
          >
            <p className="font-display text-2xl text-cream">
              {result.result === "approved" ? "Approved" : "Already arrived"}
            </p>
            <p className="mt-3 font-body text-cream">{result.full_name}</p>
            <p className="font-body text-teal">{result.category_tag}</p>
            <p className="mt-3 font-body text-sm text-muted">{result.message}</p>

            <button
              onClick={startScanning}
              className="mt-6 w-full rounded-sm bg-teal px-7 py-3.5 font-body text-sm font-medium text-ink"
            >
              Scan next person
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
          className="flex-1 rounded-sm border border-ink-raised bg-ink px-4 py-3 font-body text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold"
        />
        <button
          type="submit"
          className="rounded-sm bg-gold px-6 py-3 font-body text-sm font-medium text-ink"
        >
          Check
        </button>
      </form>

      {error && phase === "idle" && (
        <p className="mt-6 font-body text-sm text-red">{error}</p>
      )}
    </div>
  );
}
