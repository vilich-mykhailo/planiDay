// AnimatedDropdown.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false,
  );

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < breakpoint);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
}

export default function AnimatedDropdown({
  label,
  value,
  onChange,
  placeholder = "Оберіть...",
  options = [],
  disabled = false,
  searchable = false,
  icon: Icon,
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [searchActive, setSearchActive] = useState(false);

  const ref = useRef(null);
  const searchRef = useRef(null);
  const isMobile = useIsMobile();

  const filled = String(value ?? "").length > 0;

  const selected = useMemo(
    () => options.find((o) => o.value === value) || null,
    [options, value],
  );

  const filtered = useMemo(() => {
    if (!searchable) return options;

    const s = q.trim().toLowerCase();
    if (!s) return options;

    return options.filter((o) =>
      String(o.label || "")
        .toLowerCase()
        .includes(s),
    );
  }, [options, q, searchable]);

  function close() {
    setOpen(false);
    setQ("");
    setSearchActive(false);
  }

  function toggle() {
    if (disabled) return;

    setOpen((prev) => {
      const next = !prev;

      if (!next) {
        setQ("");
        setSearchActive(false);
      }

      return next;
    });
  }

  useEffect(() => {
    function onDocClick(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) close();
    }

    function onEsc(e) {
      if (e.key === "Escape") close();
    }

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);

    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !isMobile || !searchActive) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        searchRef.current?.focus();
      });
    });
  }, [open, isMobile, searchActive]);

  return (
    <div
      ref={ref}
      className={cn(
        "relative w-full",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={toggle}
       className={cn(
  "relative h-[48px] w-full rounded-[18px] border pl-4 pt-2 text-left transition-all duration-200",
  "sm:h-[50px] sm:rounded-[20px] ",
  "lg:h-[55px] lg:rounded-[18px]",
          "bg-gradient-to-b from-white to-stone-50",
          "shadow-[0_6px_22px_rgba(15,23,42,0.045)]",
          "active:scale-[0.99]",
          open
            ? "border-amber-300/70 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-4 ring-amber-400/10"
            : "border-stone-200/80 hover:-translate-y-[1px] hover:border-stone-300 hover:shadow-[0_10px_28px_rgba(15,23,42,0.07)]",
        )}
      >
        <label
          className={cn(
            "pointer-events-none absolute left-4 transition-all duration-200",
            filled || open
              ? "top-2 text-[9px] font-bold uppercase tracking-[0.16em] text-amber-600 sm:top-2.5 sm:text-[10px]"
              : "top-1/2 -translate-y-1/2 text-[13px] font-semibold text-stone-500 sm:text-sm",
          )}
        >
          {label}
        </label>

        <span
          className={cn(
            "block truncate pr-8 text-sm font-bold",
            filled ? "text-stone-800" : "text-transparent",
          )}
          title={filled ? selected?.label || "" : ""}
        >
          {filled ? selected?.label : placeholder}
        </span>

        <span
          className={cn(
            "pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 transition-all duration-200",
            open && "rotate-180 text-amber-700",
          )}
        >
         {Icon ? (
  <Icon className="h-4 w-4" />
) : (
  <ChevronDown className="h-4 w-4" />
)}
        </span>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Закрити"
            onClick={close}
            className="fixed inset-0 z-[70] bg-stone-950/35 backdrop-blur-[6px]"
          />

          <div
            role="dialog"
            aria-modal="true"
            className={cn(
              "fixed z-[80] overflow-hidden border border-stone-200/90 bg-white/95 backdrop-blur-xl",
              "shadow-[0_24px_80px_rgba(15,23,42,0.16)] rounded-[30px]",
              "left-4 right-4 top-1/2 max-h-[78vh] -translate-y-1/2",
              "sm:left-1/2 sm:right-auto sm:w-[min(520px,calc(100vw-32px))] sm:-translate-x-1/2",
            )}
          >
            <div className="h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-70" />

            <div className="px-4 pb-2 pt-4 sm:px-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-600">
                Фільтр
              </p>
              <h3 className="mt-1 text-lg font-bold text-stone-800 sm:text-xl">
                {label}
              </h3>
            </div>

            {searchable && (
              <div className="px-4 pb-3 sm:px-5">
                <div className="relative">
                  <input
                    ref={searchRef}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Пошук..."
                    autoFocus={!isMobile}
                    readOnly={isMobile && !searchActive}
                    onPointerDown={(e) => {
                      e.stopPropagation();

                      if (isMobile && !searchActive) {
                        setSearchActive(true);
                        e.currentTarget.readOnly = false;
                        e.currentTarget.focus();
                      }
                    }}
                    className={cn(
                      "h-12 w-full rounded-[18px] border border-stone-300/80 bg-gradient-to-b from-white to-stone-50 px-4",
                      "text-[15px] font-medium text-stone-800 outline-none transition-all duration-200",
                      "placeholder:text-stone-400",
                      "focus:border-amber-300/80 focus:ring-4 focus:ring-amber-400/10",
                      isMobile && !searchActive && "cursor-text",
                    )}
                  />
                </div>
              </div>
            )}

            <div
              className={cn(
                "overflow-y-auto overscroll-contain px-3 pb-2",
                isMobile ? "max-h-[42vh]" : "max-h-[320px]",
              )}
            >
              {filtered.length === 0 ? (
                <div className="rounded-[20px] bg-stone-100/90 px-4 py-5 text-center text-sm text-stone-500">
                  Нічого не знайдено
                </div>
              ) : (
                <div className="space-y-1">
                  {filtered.map((opt) => {
                    const active = opt.value === value;

                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          onChange(opt.value);
                          close();
                        }}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-[20px] px-4 py-3 text-left transition-all duration-200",
                          "text-[16px] font-semibold sm:text-[17px]",
                          active
                            ? "bg-white text-stone-900 shadow-[0_8px_22px_rgba(15,23,42,0.06)]"
                            : "text-stone-600 hover:-translate-y-[1px] hover:bg-white/90 hover:text-stone-900",
                        )}
                      >
                        <span>{opt.label}</span>

                        {active && (
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-3 px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  close();
                }}
                className="flex h-11 flex-1 items-center justify-center rounded-[18px] border border-stone-300 bg-white px-5 text-sm font-bold text-red-500 shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:border-red-200 hover:bg-red-50 hover:shadow-[0_8px_22px_rgba(15,23,42,0.06)] active:scale-95"
              >
                Очистити
              </button>

              <button
                type="button"
                onClick={close}
                className="flex h-11 flex-1 items-center justify-center rounded-[18px] border border-stone-300 bg-white px-5 text-sm font-bold text-stone-800 shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:bg-stone-50 hover:shadow-[0_8px_22px_rgba(15,23,42,0.06)] active:scale-95"
              >
                Закрити
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
