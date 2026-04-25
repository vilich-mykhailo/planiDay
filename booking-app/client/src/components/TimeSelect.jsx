// TimeSelect.jsx
import { useEffect, useMemo, useRef, useState } from "react";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));

const MINUTES_5 = [
  "00",
  "05",
  "10",
  "15",
  "20",
  "25",
  "30",
  "35",
  "40",
  "45",
  "50",
  "55",
];

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function TimeSelect({
  value,
  onChange,
  onCommit,
  className = "",
  label,
  dayLabel,
}) {
  const safeValue = String(value || "08:00");
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [draftValue, setDraftValue] = useState(safeValue);
  const [initialValue, setInitialValue] = useState(safeValue);

  const panelRef = useRef(null);
  const hourActiveRef = useRef(null);
  const minuteActiveRef = useRef(null);

  const [hour, minute] = draftValue.split(":");
  const isChanged = draftValue !== initialValue;
  const selectedLabel = useMemo(() => `${hour}:${minute}`, [hour, minute]);

  function handleOpen() {
    const nextValue = String(value || "08:00");
    setDraftValue(nextValue);
    setInitialValue(nextValue);
    setOpen(true);
  }

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const t = setTimeout(() => {
      hourActiveRef.current?.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });

      minuteActiveRef.current?.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    }, 20);

    return () => clearTimeout(t);
  }, [open, hour, minute]);

  function selectHour(nextHour) {
    setDraftValue(`${nextHour}:${minute}`);
  }

  function selectMinute(nextMinute) {
    setDraftValue(`${hour}:${nextMinute}`);
  }

  async function handleDone() {
    if (!isChanged || submitting) return;

    try {
      setSubmitting(true);

      onChange?.(draftValue);

      if (onCommit) {
        await onCommit(draftValue);
      }

      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setDraftValue(initialValue);
    setOpen(false);
  }

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          "flex h-9 w-full items-center justify-center rounded-[14px] bg-transparent px-3 text-sm font-semibold text-[var(--color-ink)] outline-none transition-all",
          "hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-[rgba(180,140,108,0.22)]",
          className,
        )}
      >
        {value}
      </button>

      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <button
            type="button"
            className="absolute inset-0"
            onClick={handleClose}
            aria-label="Закрити вибір часу"
          />

          <div
            ref={panelRef}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative z-10 w-[320px] max-w-[92vw] overflow-hidden rounded-[24px] border border-[var(--color-cream)] bg-white shadow-[0_24px_70px_rgba(27,27,27,0.18)]",
              "animate-in fade-in zoom-in-95 duration-200",
            )}
          >
            <div className="border-b border-[var(--color-cream)] bg-gradient-to-b from-[var(--color-pending-bg)] to-white px-4 py-3">
              {dayLabel && (
                <p className="text-center text-sm font-semibold text-[var(--color-caramel)]">
                  {dayLabel}
                </p>
              )}

              {label && (
                <p className="mt-1 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-forest)]">
                  {label}
                </p>
              )}

              <p className="mt-1 text-center text-xl font-black text-[var(--color-ink)]">
                {selectedLabel}
              </p>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-0 p-3">
              <div>
                <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wide text-[var(--color-caramel)]">
                  Години
                </p>

                <div className="h-56 overflow-y-auto pr-2">
                  <div className="space-y-1">
                    {HOURS.map((h) => {
                      const active = h === hour;

                      return (
                        <button
                          key={h}
                          ref={active ? hourActiveRef : null}
                          type="button"
                          onClick={() => selectHour(h)}
                          className={cn(
                            "flex h-10 w-full items-center justify-center rounded-2xl text-sm font-semibold transition-all",
                            active
                              ? "bg-[var(--color-ink)] text-white shadow-[var(--shadow-button)]"
                              : "text-[var(--color-ink)] hover:bg-[var(--color-cream)]",
                          )}
                        >
                          {h}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mx-2 w-px bg-[var(--color-cream)]" />

              <div>
                <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wide text-[var(--color-caramel)]">
                  Хвилини
                </p>

                <div className="h-56 overflow-y-auto pl-2">
                  <div className="space-y-1">
                    {MINUTES_5.map((m) => {
                      const active = m === minute;

                      return (
                        <button
                          key={m}
                          ref={active ? minuteActiveRef : null}
                          type="button"
                          onClick={() => selectMinute(m)}
                          className={cn(
                            "flex h-10 w-full items-center justify-center rounded-2xl text-sm font-semibold transition-all",
                            active
                              ? "bg-[var(--color-ink)] text-white shadow-[var(--shadow-button)]"
                              : "text-[var(--color-ink)] hover:bg-[var(--color-cream)]",
                          )}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--color-cream)] bg-[var(--color-cream)]/60 p-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 rounded-2xl border border-[var(--color-cream)] bg-white py-2.5 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-cream)] active:scale-[0.98]"
                >
                  Скасувати
                </button>

                <button
                  type="button"
                  onClick={handleDone}
                  disabled={!isChanged || submitting}
                  className={cn(
                    "flex-1 rounded-2xl py-2.5 text-sm font-bold transition-all duration-200",
                    isChanged && !submitting
                      ? "bg-[var(--color-forest)] text-white hover:bg-[var(--color-forest-dark)] active:scale-[0.97]"
                      : "cursor-not-allowed bg-[var(--color-cream)] text-[var(--color-caramel)]",
                  )}
                >
                  {submitting ? "Збереження..." : "Готово"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
