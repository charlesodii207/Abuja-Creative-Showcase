// app/admin/(dashboard)/messages/page.tsx
"use client";

import { useEffect, useMemo, useState, useRef, type FormEvent } from "react";
import {
  listMessageThreads,
  getMessageThread,
  markThreadRead,
  replyToThread,
  closeThread,
  reopenThread,
  listMyMailboxes,
  composeMessage,
  getMessageHtml,
  getMailboxUnreadCounts,
  ApiError,
  type Message,
  type MailboxOption,
  type MessageThreadSummary,
  type MessageThreadDetail,
  type MessageThreadStatus,
} from "../../../../lib/admin/api";
import {
  applySuggestion,
  greetingFor,
  removeSuggestion,
  signoffFor,
} from "../../../../lib/admin/signoffs";

function timeAgo(iso: string | null | undefined) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

// The backend sends sender_type; older code used `sender`.
function isAdminMessage(m: Message) {
  return (m.sender_type ?? m.sender) === "admin";
}

// "a@x.com, b@y.com; c@z.com" -> ["a@x.com", "b@y.com", "c@z.com"]
function parseAddresses(raw: string): string[] {
  return raw
    .split(/[,;\s]+/)
    .map((a) => a.trim())
    .filter(Boolean);
}

// Where a reply's quoted history starts ("On Sat, ... wrote:", Outlook headers...).
const QUOTE_MARKERS = [
  /(?:^|\n)On [\s\S]{5,200}?wrote:/i,
  /(?:^|\n)-{2,}\s*Original Message\s*-{2,}/i,
  /(?:^|\n)From:[^\n]+\n(?:Sent|Date):/i,
];

// Splits an email body into what the person actually wrote and the quoted
// history below it. Also squeezes runs of blank lines.
function splitQuoted(raw: string | null | undefined) {
  const body = (raw || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  let cut = -1;
  for (const re of QUOTE_MARKERS) {
    const m = re.exec(body);
    if (m && m.index > 0 && (cut === -1 || m.index < cut)) cut = m.index;
  }

  if (cut === -1) return { main: body, quoted: "" };
  return { main: body.slice(0, cut).trim(), quoted: body.slice(cut).trim() };
}

const DEFAULT_MAILBOX = "info"; // website-form messages

// Small label showing where a conversation came from.
function SourceBadge({
  channel,
  mailboxLabel,
  long = false,
}: {
  channel?: string | null;
  mailboxLabel?: string;
  long?: boolean;
}) {
  const isEmail = channel === "email";
  const text = isEmail
    ? long
      ? `Email · ${mailboxLabel || "Mailbox"} mailbox`
      : "Email"
    : "Contact form";
  return (
    <span
      className={`inline-block font-body text-[10px] uppercase tracking-wide rounded-sm px-1.5 py-0.5 border whitespace-nowrap ${
        isEmail
          ? "text-teal border-teal/50 bg-teal/10"
          : "text-gold border-gold/50 bg-gold/10"
      }`}
    >
      {text}
    </span>
  );
}

export default function MessagesPage() {
  const [mailboxes, setMailboxes] = useState<MailboxOption[]>([]);
  const [mailboxesLoaded, setMailboxesLoaded] = useState(false);
  const [mailboxFilter, setMailboxFilter] = useState<string>("all");
  const [unreadByMailbox, setUnreadByMailbox] = useState<Record<string, number>>({});

  const [threads, setThreads] = useState<MessageThreadSummary[]>([]);
  const [statusFilter, setStatusFilter] = useState<MessageThreadStatus>("open");
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedThread, setSelectedThread] = useState<MessageThreadDetail | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);

  const [replyBody, setReplyBody] = useState("");
  const [replySuggest, setReplySuggest] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Which messages have their quoted history expanded
  const [quotedOpen, setQuotedOpen] = useState<Record<string, boolean>>({});

  // Original-HTML viewer (one message at a time)
  const [htmlOpenId, setHtmlOpenId] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [htmlLoading, setHtmlLoading] = useState(false);
  const [htmlError, setHtmlError] = useState<string | null>(null);

  // Compose
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeFrom, setComposeFrom] = useState("");
  const [composeTo, setComposeTo] = useState("");
  const [composeCc, setComposeCc] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeSuggest, setComposeSuggest] = useState(false);
  const [composeSending, setComposeSending] = useState(false);
  const [composeError, setComposeError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendable = useMemo(() => mailboxes.filter((m) => m.can_send), [mailboxes]);
  const sendableKeys = useMemo(() => new Set(sendable.map((m) => m.key)), [sendable]);
  const mailboxLabelFor = (key?: string | null) =>
    mailboxes.find((m) => m.key === key)?.label ?? key ?? "";

  // Which mailboxes does this person have? (Backend decides; this drives the UI.)
  useEffect(() => {
    listMyMailboxes()
      .then((list) => {
        setMailboxes(list);
        const firstSendable = list.find((m) => m.can_send);
        if (firstSendable) setComposeFrom(firstSendable.key);
      })
      .catch(() => setMailboxes([]))
      .finally(() => setMailboxesLoaded(true));
  }, []);

  function loadUnreadCounts() {
    getMailboxUnreadCounts()
      .then((r) => setUnreadByMailbox(r.by_mailbox))
      .catch(() => {});
  }

  function loadThreads() {
    setLoadingList(true);
    setListError(null);
    listMessageThreads({
      status: statusFilter,
      mailbox: mailboxFilter === "all" ? undefined : mailboxFilter,
    })
      .then(setThreads)
      .catch((err) =>
        setListError(err instanceof ApiError ? err.message : "Couldn't load messages.")
      )
      .finally(() => setLoadingList(false));
    loadUnreadCounts();
  }

  useEffect(() => {
    loadThreads();
    setSelectedId(null);
    setSelectedThread(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, mailboxFilter]);

  function resetHtmlViewer() {
    setHtmlOpenId(null);
    setHtmlContent(null);
    setHtmlError(null);
    setHtmlLoading(false);
  }

  function openThread(id: string) {
    setSelectedId(id);
    setLoadingThread(true);
    setThreadError(null);
    setSendError(null);
    setReplyBody("");
    setReplySuggest(false);
    setQuotedOpen({});
    resetHtmlViewer();

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
    resetHtmlViewer();
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedThread]);

  const threadMailbox = selectedThread?.mailbox ?? DEFAULT_MAILBOX;
  const canSendThread = sendableKeys.has(threadMailbox);

  // --- Suggested greeting / sign-off (reply) ---
  const replyGreeting = greetingFor({
    channel: selectedThread?.channel,
    name: selectedThread?.sender_name,
  });
  const replySignoff = signoffFor(threadMailbox);

  function toggleReplySuggest() {
    if (replySuggest) {
      setReplyBody(removeSuggestion(replyBody, replyGreeting, replySignoff));
      setReplySuggest(false);
    } else {
      setReplyBody(applySuggestion(replyBody, replyGreeting, replySignoff));
      setReplySuggest(true);
    }
  }

  // --- Suggested greeting / sign-off (compose) ---
  const composeGreeting = greetingFor({ channel: "email" });

  function toggleComposeSuggest() {
    const signoff = signoffFor(composeFrom);
    if (composeSuggest) {
      setComposeBody(removeSuggestion(composeBody, composeGreeting, signoff));
      setComposeSuggest(false);
    } else {
      setComposeBody(applySuggestion(composeBody, composeGreeting, signoff));
      setComposeSuggest(true);
    }
  }

  // Changing the sender swaps the sign-off if the suggestion is switched on.
  function changeComposeFrom(next: string) {
    if (composeSuggest) {
      const stripped = removeSuggestion(composeBody, composeGreeting, signoffFor(composeFrom));
      setComposeBody(applySuggestion(stripped, composeGreeting, signoffFor(next)));
    }
    setComposeFrom(next);
  }

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
      setReplySuggest(false);
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

  async function toggleOriginal(messageId: string) {
    if (htmlOpenId === messageId) {
      resetHtmlViewer();
      return;
    }
    setHtmlOpenId(messageId);
    setHtmlContent(null);
    setHtmlError(null);
    setHtmlLoading(true);
    try {
      const res = await getMessageHtml(messageId);
      setHtmlContent(res.html);
      if (!res.html) setHtmlError("No original formatting available for this message.");
    } catch (err) {
      setHtmlError(err instanceof ApiError ? err.message : "Couldn't load the original email.");
    } finally {
      setHtmlLoading(false);
    }
  }

  function openCompose() {
    setComposeError(null);
    setNotice(null);
    if (!composeFrom && sendable[0]) setComposeFrom(sendable[0].key);
    setComposeOpen(true);
  }

  async function handleCompose(e: FormEvent) {
    e.preventDefault();
    setComposeError(null);

    const to = parseAddresses(composeTo);
    const cc = parseAddresses(composeCc);

    if (!composeFrom) return setComposeError("Choose a sender.");
    if (to.length === 0) return setComposeError("Add at least one recipient.");
    if (!composeSubject.trim()) return setComposeError("Add a subject.");
    if (!composeBody.trim()) return setComposeError("Write a message.");

    // Name the bad address instead of a vague error.
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const bad = [...to, ...cc].find((a) => !emailRe.test(a));
    if (bad) return setComposeError(`"${bad}" isn't a valid email address.`);

    setComposeSending(true);
    try {
      await composeMessage({
        mailbox: composeFrom,
        to,
        cc,
        subject: composeSubject.trim(),
        body: composeBody.trim(),
      });
      setComposeOpen(false);
      setComposeTo("");
      setComposeCc("");
      setComposeSubject("");
      setComposeBody("");
      setComposeSuggest(false);
      setNotice("Email sent.");
      loadThreads();
    } catch (err) {
      // 422 from the server = a recipient isn't a valid email address.
      setComposeError(
        err instanceof ApiError
          ? err.status === 422
            ? "Check the email addresses. One of them isn't valid."
            : err.message
          : "Couldn't send that email."
      );
    } finally {
      setComposeSending(false);
    }
  }

  // Nothing assigned yet
  if (mailboxesLoaded && mailboxes.length === 0) {
    return (
      <div className="px-4 pt-4 sm:px-8 sm:pt-8">
        <h1 className="font-display text-2xl sm:text-3xl text-cream mb-4">Messages</h1>
        <div className="border border-ink-raised rounded-sm px-4 py-6">
          <p className="font-body text-sm text-cream mb-1">No mailboxes assigned yet.</p>
          <p className="font-body text-sm text-muted">
            Ask the System Owner to give you access to a mailbox (for example Info) so
            you can read and reply to messages.
          </p>
        </div>
      </div>
    );
  }

  const suggestButtonClass = (on: boolean) =>
    `font-body text-xs rounded-sm px-3 py-1.5 border transition-colors ${
      on
        ? "border-gold text-gold bg-gold/10"
        : "border-ink-raised text-muted hover:text-cream"
    }`;

  return (
    // On phones the page sits under the 3.5rem top bar, so it is sized to
    // the space that is left (dvh follows the phone's moving browser bars).
    <div className="h-[calc(100dvh-3.5rem)] md:h-screen flex flex-col">
      <div className="px-4 pt-4 sm:px-8 sm:pt-8 pb-4 shrink-0">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h1 className="font-display text-2xl sm:text-3xl text-cream">Messages</h1>
          <div className="flex items-center gap-2">
            {sendable.length > 0 && (
              <button
                onClick={openCompose}
                className="font-body text-sm bg-gold text-ink rounded-sm px-4 py-1.5"
              >
                Compose
              </button>
            )}
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

        {/* Mailbox tabs: only the mailboxes this person can read */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[{ key: "all", label: "All" }, ...mailboxes].map((m) => {
            const unread =
              m.key === "all"
                ? Object.values(unreadByMailbox).reduce((a, b) => a + b, 0)
                : unreadByMailbox[m.key] ?? 0;
            return (
              <button
                key={m.key}
                onClick={() => setMailboxFilter(m.key)}
                className={`shrink-0 font-body text-sm px-3 py-1 rounded-sm border transition-colors flex items-center gap-2 ${
                  mailboxFilter === m.key
                    ? "bg-ink-raised text-cream border-ink-raised"
                    : "text-muted border-ink-raised hover:text-cream"
                }`}
              >
                {m.label}
                {unread > 0 && (
                  <span className="text-xs bg-gold text-ink rounded-full min-w-[1.1rem] h-[1.1rem] px-1 flex items-center justify-center">
                    {unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {notice && (
          <p className="font-body text-sm text-teal mt-2">{notice}</p>
        )}
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
              {t.subject && (
                <p className="font-body text-xs text-cream/80 truncate mb-0.5">
                  {t.subject}
                </p>
              )}
              <p className="font-body text-xs text-muted truncate mb-1">
                {splitQuoted(t.latest_message?.body).main}
              </p>
              <div className="flex items-center justify-between gap-2">
                <p className="font-body text-xs text-muted-on-paper">
                  {timeAgo(t.latest_message?.created_at ?? t.updated_at)}
                </p>
                <div className="flex items-center gap-1.5">
                  <SourceBadge channel={t.channel} />
                  {mailboxFilter === "all" && t.mailbox && (
                    <span className="font-body text-[10px] uppercase tracking-wide text-muted border border-ink-raised rounded-sm px-1.5 py-0.5">
                      {mailboxLabelFor(t.mailbox)}
                    </span>
                  )}
                </div>
              </div>
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
                    <div className="mb-1">
                      <SourceBadge
                        channel={selectedThread.channel}
                        mailboxLabel={mailboxLabelFor(threadMailbox)}
                        long
                      />
                    </div>
                    <p className="font-body text-sm text-cream truncate">
                      {selectedThread.sender_name}
                    </p>
                    <p className="font-body text-xs text-muted truncate">
                      {selectedThread.sender_email}
                    </p>
                    {selectedThread.subject && (
                      <p className="font-body text-xs text-cream/70 truncate">
                        {selectedThread.subject}
                      </p>
                    )}
                  </div>
                </div>
                {canSendThread && (
                  <button
                    onClick={handleToggleStatus}
                    className="shrink-0 font-body text-xs text-muted-on-paper hover:text-cream border border-ink-raised rounded-sm px-3 py-1.5"
                  >
                    {selectedThread.status === "open" ? "Close" : "Reopen"}
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3">
                {selectedThread.messages.map((m) => {
                  const admin = isAdminMessage(m);
                  const { main, quoted } = splitQuoted(m.body);
                  return (
                    <div
                      key={m.id}
                      className={`max-w-[88%] sm:max-w-[75%] ${admin ? "ml-auto" : ""}`}
                    >
                      <div
                        className={`rounded-sm px-3 py-2 font-body text-sm whitespace-pre-wrap break-words ${
                          admin ? "bg-gold text-ink" : "bg-ink-raised text-cream"
                        }`}
                      >
                        {main || m.body}
                      </div>

                      {quoted && (
                        <>
                          <button
                            onClick={() =>
                              setQuotedOpen((prev) => ({ ...prev, [m.id]: !prev[m.id] }))
                            }
                            className="font-body text-xs text-muted hover:text-cream mt-1"
                          >
                            {quotedOpen[m.id] ? "Hide quoted text" : "··· Show quoted text"}
                          </button>
                          {quotedOpen[m.id] && (
                            <div className="mt-1 rounded-sm border border-ink-raised px-3 py-2 font-body text-xs text-muted whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
                              {quoted}
                            </div>
                          )}
                        </>
                      )}

                      {!admin && m.has_html && (
                        <button
                          onClick={() => toggleOriginal(m.id)}
                          className="block font-body text-xs text-teal hover:underline mt-1"
                        >
                          {htmlOpenId === m.id ? "Hide original email" : "View original email"}
                        </button>
                      )}

                      {htmlOpenId === m.id && (
                        <div className="mt-2">
                          {htmlLoading && (
                            <p className="font-body text-xs text-muted">Loading…</p>
                          )}
                          {htmlError && (
                            <p className="font-body text-xs text-red">{htmlError}</p>
                          )}
                          {htmlContent && (
                            // sandbox="" = no scripts, no forms, no navigation.
                            // Incoming email is written by strangers: never
                            // render it with dangerouslySetInnerHTML.
                            <iframe
                              title="Original email"
                              sandbox=""
                              srcDoc={htmlContent}
                              className="w-full h-96 bg-white rounded-sm border border-ink-raised"
                            />
                          )}
                        </div>
                      )}

                      <p
                        className={`font-body text-xs text-muted-on-paper mt-1 ${
                          admin ? "text-right" : ""
                        }`}
                      >
                        {admin && m.sender_name ? `${m.sender_name} · ` : ""}
                        {timeAgo(m.created_at)}
                      </p>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {canSendThread ? (
                <form
                  onSubmit={handleReply}
                  className="px-4 sm:px-5 py-3 sm:py-4 border-t border-ink-raised shrink-0"
                >
                  {sendError && (
                    <p className="font-body text-sm text-red mb-2">{sendError}</p>
                  )}
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <p className="font-body text-[11px] text-muted">
                      Replying from {mailboxes.find((m) => m.key === threadMailbox)?.address}
                    </p>
                    <button
                      type="button"
                      onClick={toggleReplySuggest}
                      className={suggestButtonClass(replySuggest)}
                    >
                      {replySuggest ? "✓ Greeting & sign-off added" : "+ Add greeting & sign-off"}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <textarea
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      placeholder="Write your reply. Nothing is added automatically."
                      rows={replySuggest ? 8 : 3}
                      className="flex-1 min-w-0 bg-ink border border-ink-raised rounded-sm px-3 py-2 font-body text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold resize-y"
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
              ) : (
                <div className="px-4 sm:px-5 py-3 sm:py-4 border-t border-ink-raised shrink-0">
                  <p className="font-body text-sm text-muted">
                    You can read this mailbox but not reply from it. Ask the System Owner
                    for send access.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Compose */}
      {composeOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => !composeSending && setComposeOpen(false)}
        >
          <form
            onSubmit={handleCompose}
            onClick={(e) => e.stopPropagation()}
            className="bg-ink border border-ink-raised rounded-t-sm sm:rounded-sm w-full sm:max-w-xl max-h-[92dvh] overflow-y-auto p-4 sm:p-6 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-cream">New email</h2>
              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                disabled={composeSending}
                className="font-body text-sm text-muted hover:text-cream"
              >
                Cancel
              </button>
            </div>

            <label className="block">
              <span className="font-body text-xs text-muted">From</span>
              <select
                value={composeFrom}
                onChange={(e) => changeComposeFrom(e.target.value)}
                className="mt-1 w-full bg-ink border border-ink-raised rounded-sm px-3 py-2 font-body text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold"
              >
                {sendable.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label} — {m.address}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="font-body text-xs text-muted">To (separate with commas)</span>
              <input
                type="text"
                value={composeTo}
                onChange={(e) => setComposeTo(e.target.value)}
                placeholder="name@example.com"
                className="mt-1 w-full bg-ink border border-ink-raised rounded-sm px-3 py-2 font-body text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </label>

            <label className="block">
              <span className="font-body text-xs text-muted">Cc (optional)</span>
              <input
                type="text"
                value={composeCc}
                onChange={(e) => setComposeCc(e.target.value)}
                className="mt-1 w-full bg-ink border border-ink-raised rounded-sm px-3 py-2 font-body text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </label>

            <label className="block">
              <span className="font-body text-xs text-muted">Subject</span>
              <input
                type="text"
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                maxLength={200}
                className="mt-1 w-full bg-ink border border-ink-raised rounded-sm px-3 py-2 font-body text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </label>

            <div className="block">
              <div className="flex items-center justify-between gap-3">
                <span className="font-body text-xs text-muted">Message</span>
                <button
                  type="button"
                  onClick={toggleComposeSuggest}
                  className={suggestButtonClass(composeSuggest)}
                >
                  {composeSuggest ? "✓ Greeting & sign-off added" : "+ Add greeting & sign-off"}
                </button>
              </div>
              <textarea
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                rows={10}
                placeholder="Write your message. Nothing is added automatically."
                className="mt-1 w-full bg-ink border border-ink-raised rounded-sm px-3 py-2 font-body text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold resize-y"
              />
            </div>

            <p className="font-body text-[11px] text-muted">
              Only the logo header and the footer are added automatically. Replies come
              back to the sending mailbox.
            </p>

            {composeError && (
              <p className="font-body text-sm text-red">{composeError}</p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={composeSending}
                className="font-body text-sm bg-gold text-ink rounded-sm px-5 py-2 disabled:opacity-60"
              >
                {composeSending ? "Sending…" : "Send email"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}