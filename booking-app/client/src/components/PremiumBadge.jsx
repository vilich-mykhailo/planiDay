// PremiumBadge.jsx
export default function PremiumBadge() {
  return (
    <div
      className="
        absolute top-3 right-3
        z-20
        px-3 py-1
        rounded-full
        text-[11px] font-semibold tracking-wide
        text-white
        bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600
        shadow-lg
        border border-yellow-400/40
        backdrop-blur-sm
      "
    >
      ★ PREMIUM
    </div>
  );
}
