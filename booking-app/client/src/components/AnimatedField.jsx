// AnimatedField.jsx
import { CircleX, Search, X } from "lucide-react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function AnimatedField({
  label,
  value,
  onChange,
  placeholder = "Пошук...",
  type = "text",
  disabled = false,
  inputMode,
}) {
  const filled = String(value ?? "").length > 0;

  return (
    <div
      className={cn(
        "relative w-full",
        disabled && "pointer-events-none opacity-60",
      )}
    >
<div
  className={cn(
    "group relative h-10 w-full rounded-[16px] border border-[#eadfce] bg-white pl-11 pr-9 text-left transition-all duration-200",
    "shadow-[0_8px_22px_rgba(15,23,42,0.035)]",
    "sm:h-[68px] sm:rounded-[26px] sm:pl-[62px] sm:pr-11",
    "active:scale-[0.99]",
    "focus-within:border-[#f1dfbf] focus-within:ring-4 focus-within:ring-orange-200/20",
  )}
>
<label
  className={cn(
    "pointer-events-none absolute left-9 top-1/2 -translate-y-1/2 text-[12px] font-bold text-[#77716b] transition-all duration-200 sm:left-[62px] sm:text-[16px]",
    filled && "opacity-0",
  )}
>
  {label}
</label>

<span
  className={cn(
    "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 sm:left-6",
    filled ? "text-[#ff6b00]" : "text-[#8a8580] group-focus-within:text-[#ff6b00]",
  )}
>
  <Search className="h-4 w-4 sm:h-[22px] sm:w-[22px]" />
</span>

<input
  value={value}
  onChange={(e) => onChange(e.target.value)}
  placeholder=""
  type={type}
  disabled={disabled}
  inputMode={inputMode}
  className="block h-full w-full bg-transparent text-[12px] font-bold text-stone-800 outline-none sm:text-[16px]"
/>

{filled && (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={() => onChange("")}
    disabled={disabled}
    className="absolute right-4 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-[#8a8580] transition hover:bg-stone-100 hover:text-[#111] active:scale-95 disabled:pointer-events-none"
    aria-label="Очистити поле"
  >
    <X className="h-4 w-4" />
  </button>
)}
      </div>
    </div>
  );
}