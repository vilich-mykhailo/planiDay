import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Search,
  X,
  Scissors,
  Sparkles,
  Hand,
  Eye,
  Smile,
  Brush,
  Dumbbell,
  HeartPulse,
  PawPrint,
  Car,
  ShoppingBag,
  BadgeDollarSign,
  Stethoscope,
  Flower2,
  UserRound,
  Gem,
  CircleEllipsis,
} from "lucide-react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function AnimatedDropdown({
  label,
  value,
  onChange,
  placeholder = "Оберіть",
  options = [],
  regionOptions = [],
  districtOptions = [],
  disabled = false,
  icon: Icon,
  searchable = false,
}) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [locationTab, setLocationTab] = useState("city");
  const rootRef = useRef(null);

  const isCategory = label === "Категорія";
  const isLocation = label === "Місто";

  const selected = useMemo(() => {
    const allOptions = [...options, ...regionOptions, ...districtOptions];
    return allOptions.find((o) => String(o.value) === String(value));
  }, [options, regionOptions, districtOptions, value]);

  const CATEGORY_ICONS = {
    hair: Scissors,
    barber: Scissors,
    beauty_salon: Sparkles,
    nails: Hand,
    brows_lashes: Eye,
    cosmetology: Smile,
    makeup: Brush,
    massage: Hand,
    physiotherapy: HeartPulse,
    depilation: Sparkles,
    tattoo_piercing: Gem,
    spa: Flower2,
    health: HeartPulse,
    fitness_diet: Dumbbell,
    dentistry: Stethoscope,
    podiatry: Stethoscope,
    aesthetic_medicine: Sparkles,
    natural_medicine: Flower2,
    psychotherapy: UserRound,
    pets: PawPrint,
    finance: BadgeDollarSign,
    shopping: ShoppingBag,
    auto: Car,
    other: CircleEllipsis,
  };

function getCategoryIcon(optionValue) {
  const key = String(optionValue || "").toLowerCase();

  if (
    key.includes("манік") ||
    key.includes("nails")
  ) {
    return Hand;
  }

  if (
    key.includes("масаж") ||
    key.includes("massage")
  ) {
    return HeartPulse;
  }

  if (
    key.includes("перук") ||
    key.includes("hair")
  ) {
    return Scissors;
  }

  if (
    key.includes("барбер") ||
    key.includes("barber")
  ) {
    return Scissors;
  }

  if (
    key.includes("spa") ||
    key.includes("wellness")
  ) {
    return Flower2;
  }

  if (
    key.includes("стомат")
  ) {
    return Stethoscope;
  }

  if (
    key.includes("авто")
  ) {
    return Car;
  }

  return CATEGORY_ICONS[key] || CircleEllipsis;
}

const filled = Boolean(value);

let SelectedIcon = Icon;

if (isCategory && filled) {
  SelectedIcon =
    CATEGORY_ICONS[String(value)] || CircleEllipsis;
}

  const currentOptions = useMemo(() => {
    if (!isLocation) return options;

    if (locationTab === "region") return regionOptions;
    if (locationTab === "district") return districtOptions;

    return options;
  }, [isLocation, locationTab, options, regionOptions, districtOptions]);

  const filteredOptions = useMemo(() => {
    const q = searchValue.trim().toLowerCase();

    if (!q) return currentOptions;

    return currentOptions.filter((option) => {
      const optionLabel = String(option.label || "").toLowerCase();
      const optionValue = String(option.value || "").toLowerCase();
      const optionMeta = String(option.meta || "").toLowerCase();

      return (
        optionLabel.includes(q) ||
        optionValue.includes(q) ||
        optionMeta.includes(q)
      );
    });
  }, [currentOptions, searchValue]);

  function close() {
    setOpen(false);
    setSearchValue("");
  }

  function handleSelect(option) {
    onChange(option.value);
    close();
  }

  function toggle() {
    if (disabled) return;

    if (!open && isLocation) {
      setLocationTab("city");
    }

    setOpen((v) => !v);
  }

  function handleClear(e) {
    e.preventDefault();
    e.stopPropagation();

    onChange("");
    setSearchValue("");
    setLocationTab("city");
    close();
  }

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) {
        close();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!isCategory && !isLocation) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = original;
    };
  }, [open, isCategory, isLocation]);

  return (
    <div
      ref={rootRef}
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
          "group relative h-10 w-full rounded-[10px] border border-[#eadfce] bg-white pl-11 pr-9 text-left transition-all duration-200",
          "shadow-[0_8px_22px_rgba(15,23,42,0.035)]",
          "sm:h-[54px] sm:rounded-[15px] sm:pl-[52px] sm:pr-9",
          "active:scale-[0.99]",
          open
            ? "border-[#f1dfbf] ring-4 ring-orange-200/20"
            : "hover:border-[#eadfce]",
        )}
      >
        {SelectedIcon && (
          <span
            className={cn(
              "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 sm:left-6",
              filled
                ? "text-[#ff6b00]"
                : "text-[#8a8580] group-hover:text-[#ff6b00]",
            )}
          >
            <SelectedIcon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
          </span>
        )}

        {open && searchable && !isCategory && !isLocation ? (
          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            placeholder={placeholder || label}
            className="block h-full w-full bg-transparent text-[12px] font-bold text-stone-800 outline-none placeholder:text-[#77716b] sm:text-[14px]"
          />
        ) : (
          <span
            className={cn(
              "block truncate text-[12px] font-bold sm:text-[14px]",
              filled ? "text-stone-800" : "text-[#77716b]",
            )}
          >
            {filled ? selected?.label : placeholder || label}
          </span>
        )}

        {filled ? (
          <span
            role="button"
            tabIndex={0}
            onClick={handleClear}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleClear(e);
            }}
            className="absolute right-0 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-[#8a8580] transition hover:bg-stone-100 hover:text-[#c56b5f] active:scale-95 sm:right-3"
            aria-label="Очистити"
          >
            <X className="h-3.5 w-3.5 text-[#c56b5f] sm:h-4 sm:w-4" />
          </span>
        ) : (
          <span
            className={cn(
              "pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[#747684] transition-all duration-200 sm:right-4",
              open && "rotate-180",
            )}
          >
            <ChevronDown className="h-3.5 w-3.5 text-[#8a8580] transition-colors duration-200 group-hover:text-[#ff6200] sm:h-5 sm:w-5" />
          </span>
        )}
      </button>

      {open && isCategory ? (
        <>
          <button
            type="button"
            aria-label="Закрити"
            onClick={close}
            className="fixed inset-0 z-[220] bg-[#202020]/45 backdrop-blur-[7px]"
          />

          <div
  className="
fixed inset-0 z-[221]
flex h-[100dvh] w-screen flex-col overflow-hidden
bg-[#f7f5f1]

sm:inset-auto
sm:left-1/2 sm:top-1/2
sm:h-[88dvh]
sm:w-[600px]
sm:-translate-x-1/2 sm:-translate-y-1/2
sm:rounded-[34px]
sm:border sm:border-[#f0e2d3]
sm:shadow-[0_30px_90px_rgba(15,23,42,0.24)]

lg:h-[90dvh]
lg:w-[860px]
"
>
            <div className="relative overflow-hidden bg-[#f3eee7] px-5 py-5 sm:px-6 sm:py-6">
              <div className="absolute right-[-55px] top-[-70px] h-[180px] w-[180px] rounded-full bg-[#ff6200]/10 blur-3xl" />

              <div className="relative z-10 flex items-start justify-between gap-4">
                <div>
                  <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[11px] font-black uppercase tracking-[0.08em] text-[#ff6200] shadow-[0_8px_20px_rgba(255,98,0,0.08)]">
                    <Sparkles className="h-3.5 w-3.5" />
                    Фільтри
                  </span>

                  <h3 className="mt-3 text-[26px] font-black leading-[0.95] tracking-[-0.05em] text-[#202020] sm:text-[32px]">
                    Оберіть напрям
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={close}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[#77716b] shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition hover:bg-[#fff3e9] hover:text-[#ff6200] active:scale-[0.96]"
                  aria-label="Закрити"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {searchable && (
              <div className="bg-white px-5 py-4 sm:px-6">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8580]" />

                  <input
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Пошук категорії..."
                    className="h-12 w-full rounded-[20px] border border-[#efe4d8] bg-[#fbfaf8] pl-11 pr-4 text-sm font-bold text-[#202020] outline-none transition placeholder:text-[#b8afa5] focus:border-[#ff6200] focus:bg-white focus:ring-4 focus:ring-[#ff6200]/10"
                  />
                </div>
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white px-4 pb-4 sm:px-5 sm:pb-5">
              {filteredOptions.length === 0 ? (
                <div className="rounded-[22px] border-2 border-dashed border-[#eee7dc] bg-[#faf8f4] px-4 py-8 text-center">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#ff6200]">
                    <Search className="h-5 w-5" />
                  </div>

                  <p className="mt-3 text-sm font-black text-[#202020]">
                    Категорію не знайдено
                  </p>
                </div>
              ) : (
               <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5 sm:gap-3">
                  {filteredOptions.map((option) => {
                    const active = String(option.value) === String(value);
                    const CategoryIcon = getCategoryIcon(option.value);

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleSelect(option)}
className={cn(
  "group relative min-h-[92px] rounded-[18px] border p-2 text-center transition-all duration-200 active:scale-[0.98]",
  active
    ? "border-[#ffb26b] bg-[#fff3e9] text-[#ff6200] shadow-[0_12px_28px_rgba(255,98,0,0.12)]"
    : "border-[#eee7dc] bg-white text-[#5f5a54] shadow-[0_8px_20px_rgba(15,23,42,0.035)] hover:border-[#ffd2b3] hover:bg-[#fff8f3] hover:text-[#ff6200]",
)}
                      >
                        <div
                          className={cn(
                            "mx-auto grid h-9 w-9 place-items-center rounded-[14px] transition",
active
  ? "bg-white text-[#ff6200]"
  : "text-[#8a8580] group-hover:text-[#ff6200]",
                          )}
                        >
                          <CategoryIcon className="h-5 w-5" />
                        </div>

                        <span className="mt-2 line-clamp-2 block text-[11px] font-black leading-[13px] tracking-[-0.01em]">
                          {option.label}
                        </span>

                        {active && (
                          <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[#ff6200] text-white shadow-[0_8px_18px_rgba(255,98,0,0.24)]">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-row gap-2 border-t border-[#f0e7da] bg-[#fbfaf8] px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  close();
                }}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-[18px] border border-[#eadfce] bg-white px-5 text-sm font-black text-[#77716b] transition hover:border-[#ffd8bd] hover:bg-[#fff3e9] hover:text-[#ff6200] active:scale-[0.98]"
              >
                <X className="h-4 w-4" />
                Очистити
              </button>

              <button
                type="button"
                onClick={close}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-[18px] bg-[#ff6200] px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(255,98,0,0.25)] transition hover:bg-[#f25c00] active:scale-[0.98]"
              >
                Готово
              </button>
            </div>
          </div>
        </>
      ) : open && isLocation ? (
        <>
          <button
            type="button"
            aria-label="Закрити"
            onClick={close}
            className="fixed inset-0 z-[220] bg-[#202020]/45 backdrop-blur-[7px]"
          />

          <div
  className="
fixed inset-0 z-[221]
flex h-[100dvh] w-screen flex-col overflow-hidden
bg-[#f7f5f1]

sm:inset-auto
sm:left-1/2 sm:top-1/2
sm:h-[88dvh]
sm:w-[600px]
sm:-translate-x-1/2 sm:-translate-y-1/2
sm:rounded-[34px]
sm:border sm:border-[#f0e2d3]
sm:shadow-[0_30px_90px_rgba(15,23,42,0.24)]

lg:h-[90dvh]
lg:w-[860px]
"
>
            <div className="relative overflow-hidden bg-[#f3eee7] px-5 py-5 sm:px-6 sm:py-6">
              <div className="absolute right-[-55px] top-[-70px] h-[180px] w-[180px] rounded-full bg-[#ff6200]/10 blur-3xl" />

              <div className="relative z-10 flex items-start justify-between gap-4">
                <div>
                  <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[11px] font-black uppercase tracking-[0.08em] text-[#ff6200] shadow-[0_8px_20px_rgba(255,98,0,0.08)]">
                    <Sparkles className="h-3.5 w-3.5" />
                    Фільтри
                  </span>

                  <h3 className="mt-3 text-[26px] font-black leading-[0.95] tracking-[-0.05em] text-[#202020] sm:text-[32px]">
                    Оберіть місце
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={close}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[#77716b] shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition hover:bg-[#fff3e9] hover:text-[#ff6200] active:scale-[0.96]"
                  aria-label="Закрити"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="bg-white px-5 py-4 sm:px-6">
              <div className="grid grid-cols-3 gap-2 rounded-[22px] bg-[#f7f3ec] p-1">
                {[
                  { key: "city", label: "Міста" },
                  { key: "region", label: "Області" },
                  { key: "district", label: "Райони" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setLocationTab(tab.key);
                      setSearchValue("");
                    }}
                    className={cn(
                      "h-10 rounded-[18px] text-xs font-black transition active:scale-95",
                      locationTab === tab.key
                        ? "bg-white text-[#ff6200] shadow-[0_8px_20px_rgba(15,23,42,0.06)]"
                        : "text-[#8a8580] hover:text-[#202020]",
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative mt-3">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8580]" />

                <input
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={
                    locationTab === "city"
                      ? "Пошук місця..."
                      : locationTab === "region"
                        ? "Пошук області..."
                        : "Пошук району..."
                  }
                  className="h-12 w-full rounded-[20px] border border-[#efe4d8] bg-[#fbfaf8] pl-11 pr-4 text-sm font-bold text-[#202020] outline-none transition placeholder:text-[#b8afa5] focus:border-[#ff6200] focus:bg-white focus:ring-4 focus:ring-[#ff6200]/10"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white px-4 pb-4 sm:px-5 sm:pb-5">
              {filteredOptions.length === 0 ? (
                <div className="rounded-[22px] border-2 border-dashed border-[#eee7dc] bg-[#faf8f4] px-4 py-8 text-center">
                  <p className="text-sm font-black text-[#202020]">
                    Нічого не знайдено
                  </p>
                </div>
              ) : (
                <div className="grid gap-1.5 sm:grid-cols-2 sm:gap-2">
                  {filteredOptions.map((option) => {
                    const active = String(option.value) === String(value);

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleSelect(option)}
className={cn(
  "group relative flex min-h-[46px] w-full items-center justify-between gap-3 rounded-[16px] border px-4 py-2 text-left transition-all duration-200 active:scale-[0.98]",
  active
    ? "border-[#ffb26b] bg-[#fff3e9] text-[#ff6200]"
    : "border-[#eee7dc] bg-white text-[#5f5a54] hover:border-[#ffd2b3] hover:bg-[#fff8f3] hover:text-[#ff6200]",
)}
                      >
<div className="min-w-0">
  <span className="block truncate text-[13px] font-black leading-4 sm:text-sm">
    {option.label}
  </span>

  {option.meta && (
    <span className="mt-0.5 block truncate text-[10px] font-bold text-[#8a8580]">
      {option.meta}
    </span>
  )}
</div>

{active && (
  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#ff6200] text-white">
    <Check className="h-3 w-3" />
  </span>
)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-row gap-2 border-t border-[#f0e7da] bg-[#fbfaf8] px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  close();
                }}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-[18px] border border-[#eadfce] bg-white px-5 text-sm font-black text-[#77716b] transition hover:border-[#ffd8bd] hover:bg-[#fff3e9] hover:text-[#ff6200] active:scale-[0.98]"
              >
                <X className="h-4 w-4" />
                Очистити
              </button>

              <button
                type="button"
                onClick={close}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-[18px] bg-[#ff6200] px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(255,98,0,0.25)] transition hover:bg-[#f25c00] active:scale-[0.98]"
              >
                Готово
              </button>
            </div>
          </div>
        </>
      ) : open && filteredOptions.length > 0 ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[80] w-full overflow-hidden rounded-[20px] border border-[#eee7dc] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.14)] sm:rounded-[24px]">
          <div className="max-h-[320px] overflow-y-auto overscroll-contain p-1.5 sm:max-h-[360px] sm:p-2">
            {filteredOptions.map((option) => {
              const active = String(option.value) === String(value);

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-[14px] px-3 py-2.5 text-left text-[13px] font-bold leading-5 transition sm:rounded-[16px] sm:px-4 sm:py-3 sm:text-sm",
                    active
                      ? "bg-orange-50 text-[#ff6b00]"
                      : "text-[#5f5a54] hover:bg-[#fff7ed]",
                  )}
                >
                  <span className="min-w-0 flex-1 whitespace-normal leading-5">
                    {option.label}
                  </span>

                  {active && (
                    <span className="ml-3 h-2 w-2 shrink-0 rounded-full bg-[#ff6b00]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}