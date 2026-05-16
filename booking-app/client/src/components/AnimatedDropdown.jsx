// AnimatedDropdown.jsx
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
const shouldUseModal = isCategory;
const isLocation = label === "Місто";
const shouldUseLocationModal = isLocation;
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

function getCategoryIcon(value) {
  return CATEGORY_ICONS[String(value)] || CircleEllipsis;
}

const selectedIconName = String(value || "");
  const filled = Boolean(value);
const SelectedIcon = label === "Категорія" && filled
  ? CATEGORY_ICONS[selectedIconName] || CircleEllipsis
  : Icon;
const currentOptions = useMemo(() => {
  if (label !== "Місто") return options;

  if (locationTab === "region") return regionOptions;
  if (locationTab === "district") return districtOptions;

  return options;
}, [label, locationTab, options, regionOptions, districtOptions]);

const filteredOptions = useMemo(() => {
  const q = searchValue.trim().toLowerCase();

  if (!q) return currentOptions;

  return currentOptions.filter((option) => {
    const label = String(option.label || "").toLowerCase();
    const value = String(option.value || "").toLowerCase();
    const meta = String(option.meta || "").toLowerCase();

    return label.includes(q) || value.includes(q) || meta.includes(q);
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
             "relative h-10 w-full rounded-[16px] border border-[#eadfce] bg-white pl-9 pr-6 text-left transition-all duration-200",
          "shadow-[0_8px_22px_rgba(15,23,42,0.035)]",
          "sm:h-[68px] sm:rounded-[26px] sm:pl-[62px] sm:pr-11",
          "active:scale-[0.99]",
          open
            ? "border-[#f1dfbf] ring-4 ring-orange-200/20"
            : "hover:border-[#eadfce]",
        )}
      >
{SelectedIcon && (
  <span
    className={cn(
      "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 sm:left-6",
      filled ? "text-[#ff6b00]" : "text-[#8a8580]",
    )}
  >
    <SelectedIcon className="h-4 w-4 sm:h-[22px] sm:w-[22px]" />
  </span>
)}

{open && searchable && !shouldUseModal && !shouldUseLocationModal ? (
  <input
    value={searchValue}
    onChange={(e) => setSearchValue(e.target.value)}
    onClick={(e) => e.stopPropagation()}
    autoFocus
    placeholder={placeholder || label}
    className="block h-full w-full bg-transparent text-[12px] font-bold text-[#141414] outline-none placeholder:text-[#77716b] sm:text-[16px]"
  />
) : (
  <span className="block truncate text-[12px] font-bold text-[#77716b] sm:text-[16px]">
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
            className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-[#8a8580] transition hover:bg-stone-100 hover:text-[#111] sm:right-5 sm:h-8 sm:w-8"
            aria-label="Очистити"
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#c56b5f]" />
          </span>
        ) : null}

{!filled && (
  <span
    className={cn(
      "pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#77716b] transition-all duration-200 sm:right-6",
      open && "rotate-180",
    )}
  >
    <ChevronDown className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-[#8a8580]" />
  </span>
)}
      </button>

{open && (
shouldUseModal ? (
<>
  <button
    type="button"
    aria-label="Закрити"
    onClick={close}
    className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-[5px]"
  />

<div className="fixed left-1/2 top-1/2 z-[9999] w-[calc(100vw-24px)] max-w-md max-h-[84dvh] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[30px] border border-[#eee7dc] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.26)]">
      <div className="h-[3px] bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500" />

      <div className="flex items-start justify-between gap-4 border-b border-[#f0e8dc] px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-50 text-[#ff6b00]">
            {Icon ? <Icon className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#c56b5f]">
              Фільтр категорії
            </p>
            <h3 className="mt-1 text-xl font-black tracking-[-0.04em] text-[#111]">
              Оберіть напрям
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={close}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f7f3ec] text-[#8a8580] transition hover:bg-[#efe7dc] hover:text-[#111] active:scale-95"
          aria-label="Закрити"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {searchable && (
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8580]" />

<input
  value={searchValue}
  onChange={(e) => setSearchValue(e.target.value)}
  placeholder="Пошук категорії..."
  className="h-12 w-full rounded-[20px] border border-[#eee7dc] bg-[#faf8f4] pl-11 pr-4 text-sm font-bold text-[#111] outline-none transition placeholder:text-[#9b948b] focus:border-[#f1dfbf] focus:bg-white focus:ring-4 focus:ring-orange-200/20"
/>
          </div>
        </div>
      )}

     <div className="h-[52dvh] overflow-y-auto overscroll-contain px-3 pb-3">
        {filteredOptions.length === 0 ? (
          <div className="rounded-[22px] border-2 border-dashed border-[#eee7dc] bg-[#faf8f4] px-4 py-8 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#c56b5f]">
              <Search className="h-5 w-5" />
            </div>

            <p className="mt-3 text-sm font-black text-[#111]">
              Категорію не знайдено
            </p>
          </div>
        ) : (
<div className="grid grid-cols-3 gap-2">
  {filteredOptions.map((option) => {
    const active = String(option.value) === String(value);
    const CategoryIcon = getCategoryIcon(option.value);

    return (
      <button
        key={option.value}
        type="button"
        onClick={() => handleSelect(option)}
className={cn(
  "relative min-h-[92px] rounded-[18px] border p-2 text-center transition active:scale-[0.98]",
  active
    ? "border-[#ffb26b] bg-[#fff3e6] text-[#ff6b00] shadow-[0_12px_28px_rgba(255,107,0,0.12)]"
    : "border-[#eee7dc] bg-white text-[#5f5a54] shadow-[0_8px_20px_rgba(15,23,42,0.035)] hover:bg-[#faf8f4]",
)}
      >
<div
  className={cn(
    "mx-auto grid h-9 w-9 place-items-center rounded-[14px] transition",
    active
      ? "bg-white text-[#ff6b00]"
      : " text-[#8a8580]",
  )}
>
  <CategoryIcon className="h-5 w-5" />
</div>

<span className="mt-2 line-clamp-2 block text-[11px] font-black leading-[13px] tracking-[-0.01em]">
  {option.label}
</span>

        {active && (
<span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[#ff6b00] text-white shadow-[0_8px_18px_rgba(255,107,0,0.24)]">
  <Check className="h-3 w-3" />
</span>
        )}
      </button>
    );
  })}
</div>
        )}
      </div>

      <div className="flex gap-2 border-t border-[#f0e8dc] bg-[#faf8f4] px-4 py-3">
        <button
          type="button"
          onClick={() => {
            onChange("");
            close();
          }}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[18px] border border-[#eee7dc] bg-white text-sm font-black text-[#c56b5f] transition hover:bg-red-50 active:scale-95"
        >
          <X className="h-4 w-4" />
          Очистити
        </button>

        <button
          type="button"
          onClick={close}
          className="flex h-11 flex-1 items-center justify-center rounded-[18px] bg-[#111] text-sm font-black text-white transition hover:bg-black active:scale-95"
        >
          Готово
        </button>
      </div>
    </div>
  </>
) : shouldUseLocationModal ? (
    <>
  <button
    type="button"
    aria-label="Закрити"
    onClick={close}
    className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-[5px]"
  />

  <div className="fixed left-1/2 top-1/2 z-[9999] h-[84dvh] w-[calc(100vw-24px)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[30px] border border-[#eee7dc] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.26)]">
    <div className="h-[3px] bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500" />

    <div className="flex items-start justify-between gap-4 border-b border-[#f0e8dc] px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-50 text-[#ff6b00]">
          {Icon ? <Icon className="h-5 w-5" /> : <Search className="h-5 w-5" />}
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#c56b5f]">
            Локація
          </p>
          <h3 className="mt-1 text-xl font-black tracking-[-0.04em] text-[#111]">
            Оберіть місце
          </h3>
        </div>
      </div>

      <button
        type="button"
        onClick={close}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f7f3ec] text-[#8a8580] transition hover:bg-[#efe7dc] hover:text-[#111] active:scale-95"
        aria-label="Закрити"
      >
        <X className="h-5 w-5" />
      </button>
    </div>

    <div className="px-4 py-3">
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
                ? "bg-white text-[#ff6b00] shadow-[0_8px_20px_rgba(15,23,42,0.06)]"
                : "text-[#8a8580] hover:text-[#111]",
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
              ? "Пошук міста..."
              : locationTab === "region"
                ? "Пошук області..."
                : "Пошук району..."
          }
          className="h-12 w-full rounded-[20px] border border-[#eee7dc] bg-[#faf8f4] pl-11 pr-4 text-sm font-bold text-[#111] outline-none transition placeholder:text-[#9b948b] focus:border-[#f1dfbf] focus:bg-white focus:ring-4 focus:ring-orange-200/20"
        />
      </div>
    </div>

    <div className="h-[52dvh] overflow-y-auto overscroll-contain px-3 pb-3">
      {filteredOptions.length === 0 ? (
        <div className="rounded-[22px] border-2 border-dashed border-[#eee7dc] bg-[#faf8f4] px-4 py-8 text-center">
          <p className="text-sm font-black text-[#111]">Нічого не знайдено</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {filteredOptions.map((option) => {
            const active = String(option.value) === String(value);

            return (
<button
  key={option.value}
  type="button"
  onClick={() => handleSelect(option)}
  className={cn(
    "relative flex min-h-[82px] flex-col items-center justify-center rounded-[20px] border p-3 text-center transition active:scale-[0.98]",
    active
      ? "border-[#ffb26b] bg-[#fff3e6] text-[#ff6b00]"
      : "border-[#eee7dc] bg-white text-[#5f5a54] hover:bg-[#faf8f4]",
  )}
>
                <span className="block text-sm font-black leading-5">
                  {option.label}
                </span>

                {option.meta && (
                  <span className="mt-1 block text-[11px] font-bold text-[#8a8580]">
                    {option.meta}
                  </span>
                )}

                {active && (
                  <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-[#ff6b00] text-white">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>

    <div className="flex gap-2 border-t border-[#f0e8dc] bg-[#faf8f4] px-4 py-3">
      <button
        type="button"
        onClick={() => {
          onChange("");
          close();
        }}
        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[18px] border border-[#eee7dc] bg-white text-sm font-black text-[#c56b5f] transition hover:bg-red-50 active:scale-95"
      >
        <X className="h-4 w-4" />
        Очистити
      </button>

      <button
        type="button"
        onClick={close}
        className="flex h-11 flex-1 items-center justify-center rounded-[18px] bg-[#111] text-sm font-black text-white transition hover:bg-black active:scale-95"
      >
        Готово
      </button>
    </div>
  </div>
</>
  )
: ( filteredOptions.length > 0 ? (
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
  ) : null
))}
    </div>
  );
}