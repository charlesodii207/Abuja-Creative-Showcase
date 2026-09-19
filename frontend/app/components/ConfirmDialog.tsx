"use client";

import { useEffect } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "warning" | "default";
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
  variant = "default",
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) {
        onCancel();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  const confirmStyles = {
    danger:
      "bg-red text-cream hover:bg-[#cf071f] focus:ring-red/40",
    warning:
      "bg-gold text-ink hover:bg-[#f0a313] focus:ring-gold/40",
    default:
      "bg-teal text-ink hover:bg-[#00b9bc] focus:ring-teal/40",
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-5"
      role="presentation"
      onClick={() => {
        if (!loading) onCancel();
      }}
    >
      <div className="absolute inset-0 bg-[#080A18]/80 backdrop-blur-sm" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="relative w-full max-w-md overflow-hidden rounded-sm border border-white/10 bg-[#11152F] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="h-1 w-full bg-gradient-to-r from-[#B80319] via-[#E59200] to-[#00A5A8]" />

        <div className="p-6 sm:p-7">
          <div className="mb-5 flex items-start gap-4">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                variant === "danger"
                  ? "border-red/30 bg-red/10 text-red"
                  : variant === "warning"
                    ? "border-gold/30 bg-gold/10 text-gold"
                    : "border-teal/30 bg-teal/10 text-teal"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  d="M12 9v4"
                  strokeLinecap="round"
                />
                <path
                  d="M12 17h.01"
                  strokeLinecap="round"
                />
                <path
                  d="M10.3 4.8 2.9 17.5A1.5 1.5 0 0 0 4.2 20h15.6a1.5 1.5 0 0 0 1.3-2.5L13.7 4.8a2 2 0 0 0-3.4 0Z"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div>
              <h2
                id="confirm-dialog-title"
                className="font-display text-xl text-cream"
              >
                {title}
              </h2>

              <p
                id="confirm-dialog-message"
                className="mt-2 font-body text-sm leading-relaxed text-muted"
              >
                {message}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 rounded-sm border border-white/10 px-4 py-2.5 font-body text-sm text-muted-on-paper transition-colors hover:border-white/20 hover:text-cream focus:outline-none focus:ring-2 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cancelText}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 rounded-sm px-4 py-2.5 font-body text-sm font-medium transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${confirmStyles[variant]}`}
            >
              {loading ? "Please wait…" : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
<div> </div>