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
          "flex h-9 w-full items-center justify-center rounded-[14px] bg-transparent px-3 text-sm font-semibold text-stone-800 outline-none transition-all",
          "hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-amber-400/30",
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
              "relative z-10 w-[320px] max-w-[92vw]",
              "overflow-hidden rounded-[24px] border border-stone-200 bg-white",
              "shadow-[0_24px_70px_rgba(0,0,0,0.18)]",
              "animate-in fade-in zoom-in-95 duration-200",
            )}
          >
<div className="border-b border-stone-100 bg-gradient-to-b from-amber-50/70 to-white px-4 py-3">
  
  {/* день */}
  {dayLabel && (
    <p className="text-center text-sm font-semibold text-stone-500">
      {dayLabel}
    </p>
  )}

  {/* тип (початок / кінець) */}
  {label && (
    <p className="mt-1 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-amber-600">
      {label}
    </p>
  )}

  {/* вибраний час */}
  <p className="mt-1 text-center text-xl font-black text-stone-800">
    {selectedLabel}
  </p>
</div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-0 p-3">
              <div>
                <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wide text-stone-500">
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
                              ? "bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-[0_10px_24px_rgba(251,146,60,0.28)]"
                              : "text-stone-700 hover:bg-stone-50",
                          )}
                        >
                          {h}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mx-2 w-px bg-stone-100" />

              <div>
                <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wide text-stone-500">
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
                              ? "bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-[0_10px_24px_rgba(251,146,60,0.28)]"
                              : "text-stone-700 hover:bg-stone-50",
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

            <div className="border-t border-stone-100 bg-stone-50/50 p-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 rounded-2xl border border-stone-200 bg-white py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 active:scale-[0.98]"
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
      ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-700 hover:to-emerald-800 active:scale-[0.97]"
      : "cursor-not-allowed bg-stone-100 text-stone-400"
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