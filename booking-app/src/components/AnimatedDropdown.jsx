import { useEffect, useMemo, useRef, useState } from "react";
import "./AnimatedDropdown.css";

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
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const [searchActive, setSearchActive] = useState(false);
  const searchRef = useRef(null);

  function close() {
    setOpen(false);
    setQ("");
    setSearchActive(false);
  }

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      if (!next) setQ("");
      return next;
    });
  }

  const ref = useRef(null);
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
    return options.filter((o) => String(o.label).toLowerCase().includes(s));
  }, [options, q, searchable]);

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
    if (!open || !isMobile) return;

    const prevOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open, isMobile]);

  useEffect(() => {
    if (!open || !isMobile || !searchActive) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        searchRef.current?.focus();
      });
    });
  }, [open, isMobile, searchActive]);

  
  return (
    <div className={`ad ${disabled ? "ad--disabled" : ""}`} ref={ref}>
      <button
        type="button"
        disabled={disabled}
        className={`ad__control ${filled ? "ad__control--filled" : ""} ${open ? "ad__control--open" : ""}`}
        onClick={toggle}
      >
        <span
          className={`ad__value ${filled ? "" : "ad__value--muted"}`}
          title={filled ? selected?.label || "" : ""}
        >
          {filled ? selected?.label : placeholder}
        </span>

        <span className={`ad__chev ${open ? "ad__chev--open" : ""}`} />
      </button>

      <label className={`ad__label ${filled || open ? "ad__label--up" : ""}`}>
        {label}
      </label>

      {open && (
        <>
          <div className="ad__overlay" onClick={close} />

          <div className="ad__dropdown" role="dialog" aria-modal="true">
            {searchable && (
              <div className="ad__search">
                <input
                  ref={searchRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Пошук…"
                  className={`ad__searchInput ${isMobile && !searchActive ? "ad__searchInput--inactive" : ""}`}
                  autoFocus={!isMobile}
                  readOnly={isMobile && !searchActive}
                  onPointerDown={(e) => {
                    e.stopPropagation();

                    if (isMobile && !searchActive) {
                      // ✅ важливо: фокус в межах того ж тапу
                      setSearchActive(true);
                      e.currentTarget.readOnly = false; // на всяк випадок для iOS
                      e.currentTarget.focus();
                    }
                  }}
                />
              </div>
            )}

            <div className="ad__list">
              {filtered.length === 0 ? (
                <div className="ad__empty">Нічого не знайдено</div>
              ) : (
                filtered.map((opt) => {
                  const active = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      className={`ad__option ${active ? "ad__option--active" : ""}`}
                      onClick={() => {
                        onChange(opt.value);
                        close();
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })
              )}
            </div>

            <div className="ad__footer">
              <button
                type="button"
                className="ad__clear"
                onClick={() => {
                  onChange("");
                  close();
                }}
              >
                Очистити
              </button>

              <button type="button" className="ad__close" onClick={close}>
                Закрити
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
