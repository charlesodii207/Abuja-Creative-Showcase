// app/admin/(dashboard)/messages/page.tsx
"use client";

import { useEffect, useState, useRef, type FormEvent } from "react";
import {
  listMessageThreads,
  getMessageThread,
  markThreadRead,
  replyToThread,
  closeThread,
  reopenThread,
  ApiError,
  type MessageThreadSummary,
  type MessageThreadDetail,
  type MessageThreadStatus,
} from "../../../../lib/admin/api";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

export default function MessagesPage() {
  const [threads, setThreads] = useState<MessageThreadSummary[]>([]);
  const [statusFilter, setStatusFilter] = useState<MessageThreadStatus>("open");
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedThread, setSelectedThread] = useState<MessageThreadDetail | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);

  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  function loadThreads() {
    setLoadingList(true);
    setListError(null);
    listMessageThreads({ status: statusFilter })
      .then(setThreads)
      .catch((err) =>
        setListError(err instanceof ApiError ? err.message : "Couldn't load messages.")
      )
      .finally(() => setLoadingList(false));
  }

  useEffect(() => {
    loadThreads();
    setSelectedId(null);
    setSelectedThread(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  function openThread(id: string) {
    setSelectedId(id);
    setLoadingThread(true);
    setThreadError(null);
    setSendError(null);
    setReplyBody("");

    getMessageThread(id)
      .then((detail) => {
        setSelectedThread(detail);
        // mark read in the background, then refresh the list's unread counts
        return markThreadRead(id).then(loadThreads);
      })
      .catch((err) =>
        setThreadError(err instanceof ApiError ? err.message : "Couldn't load this conversation.")
      )
      .finally(() => setLoadingThread(false));
  }

  // Phones show the list or the conversation, one at a time. This takes
  // you back to the list.
  function backToList() {
    setSelectedId(null);
    setSelectedThread(null);
    setThreadError(null);
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedThread]);

  async function handleReply(e: FormEvent) {
    e.preventDefault();
    if (!selectedId || !replyBody.trim()) return;

    setSending(true);
    setSendError(null);
    try {
      await replyToThread(selectedId, replyBody.trim());
      const detail = await getMessageThread(selectedId);
      setSelectedThread(detail);
      setReplyBody("");
      loadThreads();
    } catch (err) {
      setSendError(err instanceof ApiError ? err.message : "Couldn't send that reply.");
    } finally {
      setSending(false);
    }
  }

  async function handleToggleStatus() {
    if (!selectedId || !selectedThread) return;
    try {
      if (selectedThread.status === "open") {
        await closeThread(selectedId);
      } else {
        await reopenThread(selectedId);
      }
      const detail = await getMessageThread(selectedId);
      setSelectedThread(detail);
      loadThreads();
    } catch (err) {
      setThreadError(err instanceof ApiError ? err.message : "Couldn't update the status.");
    }
  }

  return (
    // On phones the page sits under the 3.5rem top bar, so it is sized to
    // the space that is left (dvh follows the phone's moving browser bars).
    <div className="h-[calc(100dvh-3.5rem)] md:h-screen flex flex-col">
      <div className="px-4 pt-4 sm:px-8 sm:pt-8 pb-4 shrink-0">
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <h1 className="font-display text-2xl sm:text-3xl text-cream">Messages</h1>
          <div className="flex border border-ink-raised rounded-sm overflow-hidden">
            {(["open", "closed"] as MessageThreadStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`font-body text-sm px-4 py-1.5 capitalize transition-colors ${
                  statusFilter === s
                    ? "bg-ink-raised text-cream"
                    : "text-muted hover:text-cream"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 px-4 pb-4 sm:px-8 sm:pb-8 flex gap-6">
        {/* Thread list: full width on phones, hidden while a conversation is open */}
        <div
          className={`${
            selectedId ? "hidden" : "block"
          } md:block w-full md:w-80 shrink-0 border border-ink-raised rounded-sm overflow-y-auto`}
        >
          {loadingList && (
            <p className="font-body text-sm text-muted px-4 py-4">Loading…</p>
          )}
          {listError && (
            <p className="font-body text-sm text-red px-4 py-4">{listError}</p>
          )}
          {!loadingList && !listError && threads.length === 0 && (
            <p className="font-body text-sm text-muted px-4 py-4">
              No {statusFilter} conversations.
            </p>
          )}
          {threads.map((t) => (
            <button
              key={t.id}
              onClick={() => openThread(t.id)}
              className={`w-full text-left px-4 py-3 border-b border-ink-raised last:border-b-0 transition-colors ${
                selectedId === t.id ? "bg-ink-raised" : "hover:bg-ink-raised/50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="font-body text-sm text-cream truncate pr-2">
                  {t.sender_name}
                </p>
                {t.unread_count > 0 && (
                  <span className="font-body text-xs bg-gold text-ink rounded-full min-w-[1.1rem] h-[1.1rem] px-1 flex items-center justify-center shrink-0">
                    {t.unread_count}
                  </span>
                )}
              </div>
              <p className="font-body text-xs text-muted truncate mb-1">
                {t.latest_message.body}
              </p>
              <p className="font-body text-xs text-muted-on-paper">
                {timeAgo(t.latest_message.created_at)}
              </p>
            </button>
          ))}
        </div>

        {/* Thread detail: only shown on phones once a conversation is opened */}
        <div
          className={`${
            selectedId ? "flex" : "hidden"
          } md:flex flex-1 min-w-0 border border-ink-raised rounded-sm flex-col`}
        >
          {!selectedId && (
            <div className="flex-1 flex items-center justify-center">
              <p className="font-body text-sm text-muted">
                Select a conversation to read it.
              </p>
            </div>
          )}

          {selectedId && loadingThread && (
            <div className="flex-1 flex items-center justify-center">
              <p className="font-body text-sm text-muted">Loading…</p>
            </div>
          )}

          {selectedId && threadError && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4 text-center">
              <p className="font-body text-sm text-red">{threadError}</p>
              <button
                onClick={backToList}
                className="md:hidden font-body text-xs text-teal hover:underline"
              >
                ← Back to messages
              </button>
            </div>
          )}

          {selectedThread && !loadingThread && !threadError && (
            <>
              <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-ink-raised flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={backToList}
                    aria-label="Back to messages"
                    className="md:hidden shrink-0 font-body text-sm text-teal px-1 py-1"
                  >
                    ← Back
                  </button>
                  <div className="min-w-0">
                    <p className="font-body text-sm text-cream truncate">
                      {selectedThread.sender_name}
                    </p>
                    <p className="font-body text-xs text-muted truncate">
                      {selectedThread.sender_email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleToggleStatus}
                  className="shrink-0 font-body text-xs text-muted-on-paper hover:text-cream border border-ink-raised rounded-sm px-3 py-1.5"
                >
                  {selectedThread.status === "open" ? "Close" : "Reopen"}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3">
                {selectedThread.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[88%] sm:max-w-[75%] ${
                      m.sender === "admin" ? "ml-auto" : ""
                    }`}
                  >
                    <div
                      className={`rounded-sm px-3 py-2 font-body text-sm whitespace-pre-wrap break-words ${
                        m.sender === "admin"
                          ? "bg-gold text-ink"
                          : "bg-ink-raised text-cream"
                      }`}
                    >
                      {m.body}
                    </div>
                    <p
                      className={`font-body text-xs text-muted-on-paper mt-1 ${
                        m.sender === "admin" ? "text-right" : ""
                      }`}
                    >
                      {timeAgo(m.created_at)}
                    </p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={handleReply}
                className="px-4 sm:px-5 py-3 sm:py-4 border-t border-ink-raised shrink-0"
              >
                {sendError && (
                  <p className="font-body text-sm text-red mb-2">{sendError}</p>
                )}
                <div className="flex gap-2">
                  <textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder="Write a reply…"
                    rows={2}
                    className="flex-1 min-w-0 bg-ink border border-ink-raised rounded-sm px-3 py-2 font-body text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold resize-none"
                  />
                  <button
                    type="submit"
                    disabled={sending || !replyBody.trim()}
                    className="font-body text-sm bg-gold text-ink rounded-sm px-4 py-2 disabled:opacity-60 self-end"
                  >
                    {sending ? "Sending…" : "Send"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
