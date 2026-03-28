// Modal.jsx
import { useEffect } from "react";

export default function Modal({
  open,
  onClose,
  children,
  maxWidth = "max-w-md",
}) {
  // close on ESC
  useEffect(() => {
    if (!open) return;

    function handleKey(e) {
      if (e.key === "Escape") {
        onClose?.();
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-black/50 backdrop-blur-[2px]

        transition-all duration-200
        animate-in fade-in
      "
      onClick={onClose}
    >
      <div
        className={`
          w-full ${maxWidth}
          rounded-2xl
          bg-white/95 backdrop-blur
          border border-gray-200
          shadow-xl
          p-5
          animate-in zoom-in-95
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
