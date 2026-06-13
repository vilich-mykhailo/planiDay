import { useEffect, useMemo, useRef, useState } from "react";
import { Clock3, X } from "lucide-react";

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
  placeholder = "--:--",
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
  setInitialValue(String(value || ""));
  setOpen(true);
}

  useEffect(() => {
    if (!open) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = original;
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
          "flex h-9 w-full items-center justify-center rounded-[14px] bg-transparent px-3 text-sm font-bold text-[#202020] outline-none transition-all",
          "hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-[#ff6200]/20",
          className,
        )}
      >
       <span className={value ? "text-[#202020]" : "text-[#aaa19a]"}>
  {value || placeholder}
</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-[#202020]/45 px-3 pb-3 backdrop-blur-[6px] sm:items-center sm:p-6">
          <button
            type="button"
            className="absolute inset-0"
            onClick={handleClose}
            aria-label="Закрити вибір часу"
          />

          <div
            ref={panelRef}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-[30px] border border-[#f0e2d3] bg-[#f7f5f1] shadow-[0_30px_90px_rgba(15,23,42,0.24)]"
          >
            <div className="relative overflow-hidden bg-[#f3eee7] px-5 py-5 sm:px-6 sm:py-6">
              <div className="absolute right-[-55px] top-[-70px] h-[180px] w-[180px] rounded-full bg-[#ff6200]/10 blur-3xl" />

              <div className="relative z-10 flex items-start justify-between gap-4">
                <div>
                  <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[11px] font-black uppercase tracking-[0.08em] text-[#ff6200] shadow-[0_8px_20px_rgba(255,98,0,0.08)]">
                    <Clock3 className="h-3.5 w-3.5" />
                    Вибір часу
                  </span>

                  {dayLabel && (
                    <p className="mt-3 text-[13px] font-bold text-[#77716b]">
                      {dayLabel}
                    </p>
                  )}

                  <h3 className="mt-1 text-[32px] font-black leading-[0.95] tracking-[-0.05em] text-[#202020] sm:text-[38px]">
                    {selectedLabel}
                  </h3>

                  {label && (
                    <p className="mt-2 text-[12px] font-black uppercase tracking-[0.12em] text-[#ff6200]">
                      {label}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[#77716b] shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition hover:bg-[#fff3e9] hover:text-[#ff6200] active:scale-[0.96]"
                  aria-label="Закрити"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="bg-white px-5 py-5 sm:px-6">
              <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-0">
                <div>
                  <p className="mb-2 px-2 text-center text-[11px] font-black uppercase tracking-wide text-[#8a847d]">
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
                              "flex h-10 w-full items-center justify-center rounded-2xl text-sm font-bold transition-all",
                              active
                                ? "bg-[#202020] text-white shadow-[0_10px_20px_rgba(15,23,42,0.12)]"
                                : "text-[#202020] hover:bg-[#fff3e9] hover:text-[#ff6200]",
                            )}
                          >
                            {h}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mx-3 w-px bg-[#f0e7da]" />

                <div>
                  <p className="mb-2 px-2 text-center text-[11px] font-black uppercase tracking-wide text-[#8a847d]">
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
                              "flex h-10 w-full items-center justify-center rounded-2xl text-sm font-bold transition-all",
                              active
                                ? "bg-[#202020] text-white shadow-[0_10px_20px_rgba(15,23,42,0.12)]"
                                : "text-[#202020] hover:bg-[#fff3e9] hover:text-[#ff6200]",
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
            </div>

            <div className="flex flex-row gap-2 border-t border-[#f0e7da] bg-[#fbfaf8] px-5 py-4 sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-2xl border border-[#eadfce] bg-white px-4 text-sm font-black text-[#202020] shadow-sm transition hover:bg-[#fff3e9] active:scale-[0.98] sm:flex-none"
              >
                Скасувати
              </button>

              <button
                type="button"
                onClick={handleDone}
                disabled={!isChanged || submitting}
               className={cn(
  "inline-flex h-11 min-w-[155px] items-center justify-center rounded-2xl px-6 text-sm font-black transition active:scale-[0.98]",
                  isChanged && !submitting
                    ? "bg-[var(--color-primary-buttom)] text-white hover:bg-[#4a4a4a]"
                    : "cursor-not-allowed bg-[#f0e7da] text-[#9b9186]",
                )}
              >
                {submitting ? "Збереження..." : "Готово"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}