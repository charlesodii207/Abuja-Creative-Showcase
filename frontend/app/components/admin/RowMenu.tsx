"use client";

import { useEffect, useRef, useState } from "react";

export type MenuItem = {
  label: string;
  onClick: () => void;
  tone?: "default" | "gold" | "danger";
};

type Position = { top?: number; bottom?: number; right: number };

const TONE_CLASSES: Record<NonNullable<MenuItem["tone"]>, string> = {
  default: "text-cream hover:bg-ink-raised",
  gold: "text-gold hover:bg-gold/10",
  danger: "text-red hover:bg-red/10",
};

// One "Manage" button that opens a small menu of actions. The menu is
// positioned on screen (not inside the table), so it is never clipped by a
// scrolling table, and it flips upward near the bottom of the screen.
export default function RowMenu({
  items,
  label = "Manage",
}: {
  items: MenuItem[];
  label?: string;
}) {
  const [pos, setPos] = useState<Position | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const open = pos !== null;

  useEffect(() => {
    if (!open) return;

    const close = () => setPos(null);

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) {
        return;
      }
      close();
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  if (items.length === 0) return null;

  function toggle() {
    if (open) {
      setPos(null);
      return;
    }

    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    const right = Math.max(8, window.innerWidth - rect.right);
    const menuHeight = items.length * 42 + 20;
    const spaceBelow = window.innerHeight - rect.bottom;

    setPos(
      spaceBelow < menuHeight && rect.top > menuHeight
        ? { bottom: window.innerHeight - rect.top + 4, right }
        : { top: rect.bottom + 4, right }
    );
  }

  const normal = items.filter((i) => i.tone !== "danger");
  const dangerous = items.filter((i) => i.tone === "danger");

  function renderItem(item: MenuItem) {
    return (
      <button
        key={item.label}
        type="button"
        role="menuitem"
        onClick={() => {
          setPos(null);
          item.onClick();
        }}
        className={`block w-full px-4 py-2.5 text-left font-body text-sm transition-colors ${
          TONE_CLASSES[item.tone ?? "default"]
        }`}
      >
        {item.label}
      </button>
    );
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 rounded-sm border px-3 py-1.5 font-body text-xs transition-colors ${
          open
            ? "border-gold text-gold bg-gold/10"
            : "border-ink-raised text-muted hover:border-teal/60 hover:text-cream"
        }`}
      >
        {label}
        <span aria-hidden="true" className="text-[10px]">
          ▾
        </span>
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          style={{ position: "fixed", top: pos.top, bottom: pos.bottom, right: pos.right }}
          className="z-[60] w-60 rounded-sm border border-ink-raised bg-ink py-1 shadow-xl shadow-black/40"
        >
          {normal.map(renderItem)}
          {normal.length > 0 && dangerous.length > 0 && (
            <div className="my-1 border-t border-ink-raised" role="separator" />
          )}
          {dangerous.map(renderItem)}
        </div>
      )}
    </>
  );
}