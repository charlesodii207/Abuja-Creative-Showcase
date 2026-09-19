"use client";

import { useEffect } from "react";

type AlertDialogProps = {
  open: boolean;
  title: string;
  message: string;
  buttonText?: string;
  onClose: () => void;
  variant?: "error" | "success" | "info";
};

export default function AlertDialog({
  open,
  title,
  message,
  buttonText = "Close",
  onClose,
  variant = "info",
}: AlertDialogProps) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const accentStyles = {
    error: "border-red/30 bg-red/10 text-red",
    success: "border-teal/30 bg-teal/10 text-teal",
    info: "border-gold/30 bg-gold/10 text-gold",
  };

  const buttonStyles = {
    error: "bg-red text-cream hover:bg-[#cf071f]",
    success: "bg-teal text-ink hover:bg-[#00b9bc]",
    info: "bg-gold text-ink hover:bg-[#f0a313]",
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-5"
      role="presentation"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-[#080A18]/80 backdrop-blur-sm" />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-message"
        className="relative w-full max-w-md overflow-hidden rounded-sm border border-white/10 bg-[#11152F] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="h-1 w-full bg-gradient-to-r from-[#B80319] via-[#E59200] to-[#00A5A8]" />

        <div className="p-6 sm:p-7">
          <div className="mb-6 flex items-start gap-4">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${accentStyles[variant]}`}
            >
              {variant === "error" ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    d="M12 8v5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 16.5h.01"
                    strokeLinecap="round"
                  />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              ) : variant === "success" ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    d="m7 12 3 3 7-7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    d="M12 8v8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 5.5h.01"
                    strokeLinecap="round"
                  />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              )}
            </div>

            <div>
              <h2
                id="alert-dialog-title"
                className="font-display text-xl text-cream"
              >
                {title}
              </h2>

              <p
                id="alert-dialog-message"
                className="mt-2 font-body text-sm leading-relaxed text-muted"
              >
                {message}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`w-full rounded-sm px-4 py-2.5 font-body text-sm font-medium transition-colors focus:outline-none focus:ring-2 ${buttonStyles[variant]}`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}