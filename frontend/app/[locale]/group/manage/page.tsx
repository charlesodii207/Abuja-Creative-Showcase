"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL;

type TicketRow = {
  seq: number;
  ticket_label: string;
  assigned_name: string | null;
  assigned_email: string | null;
  send_count: number;
  sends_left: number;
};

type Order = {
  reference_number: string;
  buyer_name: string;
  ticket_label: string;
  quantity: number;
  max_sends_per_ticket: number;
  tickets: TicketRow[];
};

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#11152F] px-4 py-3 text-sm text-[#F5EFE6] placeholder:text-[#B8B3AA]/35 outline-none transition-colors focus:border-[#00A5A8]/60";

function ManageContent() {
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [order, setOrder] = useState<Order | null>(null);
  const [loadError, setLoadError] = useState("");
  const [openSeq, setOpenSeq] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [emailingAll, setEmailingAll] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(
    null
  );

  const base = `${API}/group-orders/manage/${encodeURIComponent(token)}`;

  const load = useCallback(async () => {
    try {
      const res = await fetch(base);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Could not load tickets.");
      setOrder(data);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Could not load tickets."
      );
    }
  }, [base]);

  useEffect(() => {
    if (!token) {
      setLoadError("This link is missing its code. Use the link in your email.");
      return;
    }
    load();
  }, [token, load]);

  function openRow(row: TicketRow) {
    setNotice(null);
    setOpenSeq(row.seq);
    setName(row.assigned_name ?? "");
    setEmail(row.assigned_email ?? "");
  }

  async function sendTicket(seq: number) {
    setSending(true);
    setNotice(null);
    try {
      const res = await fetch(`${base}/tickets/${seq}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: name, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof data?.detail === "string"
            ? data.detail
            : "Please check the name and email and try again."
        );
      }
      setNotice({ ok: true, text: data.message });
      setOpenSeq(null);
      await load();
    } catch (err) {
      setNotice({
        ok: false,
        text: err instanceof Error ? err.message : "Could not send the ticket.",
      });
    } finally {
      setSending(false);
    }
  }

  async function emailAll() {
    setEmailingAll(true);
    setNotice(null);
    try {
      const res = await fetch(`${base}/email-all`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Could not send the email.");
      setNotice({ ok: true, text: data.message });
    } catch (err) {
      setNotice({
        ok: false,
        text: err instanceof Error ? err.message : "Could not send the email.",
      });
    } finally {
      setEmailingAll(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#11152F]">
      <div className="mx-auto max-w-4xl px-6 pt-10 pb-20 sm:px-8 md:pt-14 md:pb-28">
        <div className="text-center">
          <div className="tricolor-rule mx-auto mb-7">
            <span />
            <span />
            <span />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#00A5A8]">
            Group Tickets
          </p>
          <h1 className="mt-4 font-display text-4xl leading-[1.05] text-[#F5EFE6] sm:text-5xl">
            Manage Your Tickets
          </h1>
          {order && (
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#B8B3AA]/75">
              {order.quantity} tickets for {order.buyer_name}. Send each ticket
              to the person it is for, or download it yourself.
            </p>
          )}
        </div>

        {loadError && (
          <div className="mt-12 rounded-2xl border border-[#B80319]/30 bg-[#B80319]/10 px-6 py-5 text-center text-sm text-[#F5EFE6]/80">
            {loadError}
          </div>
        )}

        {!order && !loadError && (
          <p className="mt-12 text-center text-[#B8B3AA]/75">Loading…</p>
        )}

        {order && (
          <div className="relative mt-12 overflow-hidden rounded-[2rem] border border-white/10 bg-[#151A3A] shadow-[0_30px_80px_rgba(0,0,0,0.16)]">
            <div
              aria-hidden="true"
              className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#B80319] via-[#E59200] to-[#00A5A8]"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-6 sm:px-8">
              <p className="text-xs text-[#B8B3AA]/55">
                Order {order.reference_number}
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`${base}/pdf`}
                  className="rounded-full bg-[#00A5A8] px-5 py-2.5 text-sm font-semibold text-[#11152F]"
                >
                  Download all (PDF)
                </a>
                <button
                  type="button"
                  onClick={emailAll}
                  disabled={emailingAll}
                  className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-[#F5EFE6] hover:border-[#00A5A8]/60 disabled:opacity-50"
                >
                  {emailingAll ? "Sending..." : "Email me all again"}
                </button>
              </div>
            </div>

            {notice && (
              <div
                className={`mx-6 mt-6 rounded-xl border px-4 py-3 text-sm sm:mx-8 ${
                  notice.ok
                    ? "border-[#00A5A8]/30 bg-[#00A5A8]/10 text-[#F5EFE6]/85"
                    : "border-[#B80319]/30 bg-[#B80319]/10 text-[#F5EFE6]/85"
                }`}
              >
                {notice.text}
              </div>
            )}

            <ul className="divide-y divide-white/10">
              {order.tickets.map((row) => {
                const isOpen = openSeq === row.seq;
                return (
                  <li key={row.seq} className="px-6 py-5 sm:px-8">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-[#F5EFE6]">
                          Ticket {row.seq} of {order.quantity}
                          <span className="ml-3 text-xs font-normal text-[#B8B3AA]/55">
                            {row.ticket_label}
                          </span>
                        </p>
                        <p className="mt-1 text-xs text-[#B8B3AA]/60">
                          {row.assigned_name
                            ? `${row.assigned_name} · ${row.assigned_email}`
                            : "Not assigned yet"}
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <a
                          href={`${base}/tickets/${row.seq}/pdf`}
                          className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-[#F5EFE6] hover:border-[#00A5A8]/60"
                        >
                          Download
                        </a>
                        <button
                          type="button"
                          onClick={() => (isOpen ? setOpenSeq(null) : openRow(row))}
                          disabled={row.sends_left === 0}
                          className="rounded-full bg-[#E59200] px-4 py-2 text-xs font-semibold text-[#11152F] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {row.sends_left === 0
                            ? "Limit reached"
                            : row.send_count > 0
                            ? "Send again"
                            : "Send by email"}
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <input
                          type="text"
                          placeholder="Person's full name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className={inputClass}
                        />
                        <input
                          type="email"
                          placeholder="Their email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={inputClass}
                        />
                        <div className="sm:col-span-2">
                          <button
                            type="button"
                            onClick={() => sendTicket(row.seq)}
                            disabled={sending || !name.trim() || !email.trim()}
                            className="rounded-full bg-[#00A5A8] px-6 py-3 text-sm font-semibold text-[#11152F] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {sending ? "Sending..." : "Send ticket"}
                          </button>
                          <p className="mt-2 text-xs text-[#B8B3AA]/50">
                            Their name will be printed on the ticket. You can
                            send each ticket up to {order.max_sends_per_ticket}{" "}
                            times ({row.sends_left} left).
                          </p>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <p className="mt-8 text-center text-xs leading-relaxed text-[#F5EFE6]/30">
          Keep this page&apos;s link private. Anyone who has it can download or
          send your tickets.
        </p>
      </div>
    </main>
  );
}

export default function GroupManagePage() {
  return (
    <Suspense fallback={null}>
      <ManageContent />
    </Suspense>
  );
}
