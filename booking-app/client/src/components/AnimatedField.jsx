// AnimatedField.jsx
import { Search } from "lucide-react";

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
          "group relative h-[48px] w-full rounded-[18px] border pl-4  pr-10 text-left transition-all duration-200",
          "sm:h-[50px] sm:rounded-[20px]",
          "lg:h-[55px] lg:rounded-[18px]",
          "bg-gradient-to-b from-white to-stone-50",
          "shadow-[0_6px_22px_rgba(15,23,42,0.045)]",
          "active:scale-[0.99]",
          "border-stone-200/80 hover:-translate-y-[1px] hover:border-stone-300 hover:shadow-[0_10px_28px_rgba(15,23,42,0.07)]",
          "focus-within:border-amber-300/70 focus-within:ring-4 focus-within:ring-amber-400/10",
        )}
      >
        <label
          className={cn(
            "pointer-events-none absolute left-4 transition-all duration-200",
            filled
              ? "top-2 text-[9px] font-bold uppercase tracking-[0.16em] text-amber-600 sm:top-2.5 sm:text-[10px]"
              : "top-1/2 -translate-y-1/2 text-[13px] font-semibold text-stone-500 sm:text-sm",
            !filled &&
              "group-focus-within:top-2 group-focus-within:-translate-y-0 group-focus-within:text-[9px] group-focus-within:font-bold group-focus-within:uppercase group-focus-within:tracking-[0.16em] group-focus-within:text-amber-600 sm:group-focus-within:top-2.5 sm:group-focus-within:text-[10px]",
          )}
        >
          {label}
        </label>

        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder=""
          type={type}
          disabled={disabled}
          inputMode={inputMode}
          className={cn(
            "block h-full w-full bg-transparent pr-1 text-sm font-bold text-stone-800 outline-none",
            filled ? "pt-3" : "pt-0",
            "group-focus-within:pt-3",
          )}
        />

        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 transition-all duration-200">
          <Search className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}