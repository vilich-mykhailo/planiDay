import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Cropper from "react-easy-crop";
import {
  Sparkles,
  ChevronDown,
  Plus,
  X,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Building2,
  MapPin,
  Phone,
  Mail,
  PencilLine,
  FileText,
  Eye,
  Pencil,
  Trash2,
  DoorOpen,
  House,
  Signpost,
  MapPinned,
} from "lucide-react";
import { useStudio } from "../../context/studio/useStudio";
import { api } from "../../api/http";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_DESC = 400;
const MAX_PORTFOLIO = 6;
const PUBLIC = import.meta.env.VITE_R2_PUBLIC_BASE_URL;

const STUDIO_CATEGORIES = [
  { value: "hair", label: "Перукарня" },
  { value: "barber", label: "Барбершоп" },
  { value: "beauty_salon", label: "Салон краси" },
  { value: "nails", label: "Манікюр і педикюр" },
  { value: "brows_lashes", label: "Брови та вії" },
  { value: "cosmetology", label: "Косметологія" },
  { value: "makeup", label: "Макіяж" },
  { value: "massage", label: "Масаж" },
  { value: "physiotherapy", label: "Фізіотерапія" },
  { value: "depilation", label: "Депіляція" },
  { value: "tattoo_piercing", label: "Тату і пірсинг" },
  { value: "spa", label: "SPA і wellness" },
  { value: "health", label: "Здоровʼя" },
  { value: "fitness_diet", label: "Тренування і дієта" },
  { value: "dentistry", label: "Стоматологія" },
  { value: "podiatry", label: "Подологія" },
  { value: "aesthetic_medicine", label: "Естетична медицина" },
  { value: "natural_medicine", label: "Натуральна медицина" },
  { value: "psychotherapy", label: "Психотерапія" },
  { value: "pets", label: "Тварини" },
  { value: "finance", label: "Фінансові послуги" },
  { value: "shopping", label: "Покупки" },
  { value: "auto", label: "Автосервіс" },
  { value: "other", label: "Інше" },
];

const SORTED_STUDIO_CATEGORIES = [...STUDIO_CATEGORIES].sort((a, b) =>
  a.label.localeCompare(b.label, "uk"),
);

const getCategoryLabel = (value) => {
  return STUDIO_CATEGORIES.find((c) => c.value === value)?.label || value;
};

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function fileToPreviewUrl(file) {
  return file ? URL.createObjectURL(file) : "";
}

async function compressImage(
  file,
  {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.82,
    type = "image/jpeg",
  } = {},
) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas error"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Compression failed"));
            return;
          }

          resolve(
            new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
              type,
              lastModified: Date.now(),
            }),
          );
        },
        type,
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image load failed"));
    };

    img.src = objectUrl;
  });
}

function toPublicUrl(v) {
  const s = String(v || "").trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  return PUBLIC ? `${PUBLIC}/${s}` : s;
}

function SectionCard({
  title,
  subtitle,
  badge,
  actions,
  children,
  className = "",
}) {
  return (
    <section
className={cn(
  "group relative overflow-hidden rounded-[32px] border border-[#ebe7df] bg-white shadow-[0_14px_44px_rgba(15,23,42,0.05)] transition-all duration-300 hover:shadow-[0_20px_60px_rgba(15,23,42,0.08)]",
  className,
)}
    >
      <div className="absolute inset-x-0 top-0 h-[3px] bg-[#ff5a00]" />

      <div className="flex flex-col gap-3 border-b border-[#eadbc9] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black tracking-tight text-[#202020]">{title}</h2>
            {badge && (
              <span className="inline-flex items-center rounded-full border border-[#ffd6bd] bg-[#fff1e8] px-2.5 py-0.5 text-xs font-black text-[#ff5a00]">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="mt-0.5 text-sm font-medium text-[#77716b]">{subtitle}</p>}
        </div>

        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}

function Button({
  variant = "secondary",
  size = "md",
  className = "",
  children,
  ...props
}) {
  const variants = {
    primary:
      "bg-[#ff5a00] text-white shadow-[0_16px_34px_rgba(255,90,0,0.24)] hover:bg-[#ef4f00]",
    secondary:
      "border border-[#eadbc9] bg-white text-[#202020] hover:border-[#ffd6bd] hover:bg-[#fff7f0]",
    danger:
      "border border-[#ffd6bd] bg-[#fff1e8] text-[#ff5a00] hover:border-[#ff5a00] hover:bg-[#ffe5d4]",
    ghost: "text-[#77716b] hover:bg-[#fff7f0] hover:text-[#202020]",
    warning:
      "border border-[#ffd6bd] bg-[#fff1e8] text-[#ff5a00] hover:bg-[#ffe5d4]",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-xl",
    md: "px-4 py-2.5 text-sm rounded-2xl",
    lg: "px-6 py-3 text-sm rounded-2xl",
  };

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 font-black transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function IconButton({
  variant = "secondary",
  className = "",
  children,
  ...props
}) {
  const variants = {
    secondary:
      "border border-[#eadbc9] bg-white text-[#77716b] hover:bg-[#fff7f0] hover:text-[#202020]",
    danger:
      "border border-[#ffd8d8] bg-[#fff7f7] text-[#e5484d] hover:bg-[#fff1f1]",
  };

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center rounded-xl p-2.5 transition-all duration-200 active:scale-95",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function CustomSelect({
  id,
  value,
  onChange,
  options,
  placeholder = "Оберіть",
  className = "",
  menuClassName = "",
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [menuPosition, setMenuPosition] = useState({
    top: undefined,
    bottom: undefined,
    left: 0,
    width: 0,
  });

  const rootRef = useRef(null);

  const selected = options.find((opt) => String(opt.value) === String(value));

  const sortedOptions = useMemo(() => {
    return [...options].sort((a, b) => a.label.localeCompare(b.label, "uk"));
  }, [options]);

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return sortedOptions;

    return sortedOptions.filter((opt) =>
      opt.label.toLowerCase().includes(q),
    );
  }, [search, sortedOptions]);

  function updateMenuPosition() {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;

    const dropdownHeight = 380;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const shouldOpenUp =
      spaceBelow < dropdownHeight && spaceAbove > dropdownHeight;

    setMenuPosition({
      left: rect.left,
      width: rect.width,
      top: shouldOpenUp ? undefined : rect.bottom + 8,
      bottom: shouldOpenUp ? window.innerHeight - rect.top + 8 : undefined,
    });
  }

  function toggleOpen() {
    if (open) {
      setOpen(false);
      setSearch("");
      return;
    }

    updateMenuPosition();
    setOpen(true);
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (!rootRef.current?.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    }

    function handleEscape(e) {
      if (e.key === "Escape") {
        setOpen(false);
        setSearch("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleUpdate = () => {
      updateMenuPosition();
    };

    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true);

    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={toggleOpen}
        className={cn(
          "group flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium outline-none transition-all duration-200",
          open
            ? "border-[#ff5a00] bg-white shadow-[0_10px_30px_rgba(255,90,0,0.16)] ring-2 ring-[#ff5a00]/10"
            : "border-[#eadbc9] bg-white hover:border-[#ffd6bd] hover:bg-[#fff7f0]",
          className,
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="min-w-0 truncate text-[#202020]">
          {selected?.label || placeholder}
        </span>

        <ChevronDown
          className={cn(
            "h-4.5 w-4.5 shrink-0 text-[#ff5a00] transition-all duration-200",
            "group-hover:text-[#202020]",
            open && "rotate-180 text-[#ff5a00]",
          )}
        />
      </button>

      {open && (
        <div
          className={cn(
            "fixed z-[200] overflow-hidden rounded-2xl border border-[#eadbc9] bg-white shadow-[0_24px_70px_rgba(17,17,17,0.16)]",
            menuClassName,
          )}
          style={{
            top: menuPosition.top,
            bottom: menuPosition.bottom,
            left: menuPosition.left,
            width: menuPosition.width,
          }}
        >
          <div className="border-b border-[#f0e7da] bg-white p-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Пошук категорії..."
              className="w-full rounded-xl border border-[#eadbc9] bg-white px-3 py-2 text-sm font-semibold text-[#202020] outline-none transition-all duration-200 placeholder:text-[#9b948c] focus:border-[#ff5a00] focus:ring-2 focus:ring-[#ff5a00]/10"
              autoFocus
            />
          </div>

          <div className="max-h-72 overflow-y-auto py-2">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors duration-150",
                      isSelected
                        ? "bg-[#fff1e8] text-[#ff5a00]"
                        : "text-[#202020] hover:bg-[#fff7f0]",
                    )}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span
                      className="min-w-0 text-left"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {opt.label}
                    </span>

                    {isSelected && (
                      <Check className="h-4 w-4 shrink-0 text-[#ff5a00]" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-5 text-center text-sm font-bold text-[#77716b]">
                Нічого не знайдено
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, hint, error, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-black text-[#202020]">{label}</label>
        {hint && <span className="text-xs font-medium text-[#77716b]">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs font-semibold text-[#e5484d]">{error}</p>}
    </div>
  );
}

function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-[#f2eee8]", className)}
      aria-hidden="true"
    />
  );
}

function StudioPreviewSkeleton() {
  return (
    <section className="overflow-hidden rounded-[28px] border border-[#eadbc9] bg-white shadow-[0_18px_50px_rgba(17,17,17,0.06)]">
      <div className="relative h-44 bg-[#f2eee8]">
        <SkeletonBlock className="h-full w-full rounded-none" />

        <div className="absolute -bottom-10 left-3 right-3 flex items-end gap-2">
          <SkeletonBlock className="h-20 w-20 shrink-0 rounded-[22px]" />

          <div className="min-h-[44px] min-w-0 flex-1 rounded-2xl border border-[#eadbc9] bg-white px-3 py-2 shadow-sm">
            <SkeletonBlock className="h-5 w-40 max-w-full" />
            <SkeletonBlock className="mt-2 h-4 w-28 max-w-full" />
          </div>
        </div>
      </div>

      <div className="px-3 pb-3 pt-14">
        <div className="rounded-2xl border border-[#eadbc9] bg-[#fff7f0] p-4">
          <SkeletonBlock className="h-3 w-14" />
          <SkeletonBlock className="mt-2 h-4 w-full" />
          <SkeletonBlock className="mt-1 h-4 w-4/5" />

          <SkeletonBlock className="mt-4 h-3 w-12" />
          <SkeletonBlock className="mt-2 h-4 w-full" />
          <SkeletonBlock className="mt-1 h-4 w-11/12" />
          <SkeletonBlock className="mt-1 h-4 w-2/3" />
        </div>
      </div>
    </section>
  );
}

function StudioProfileFormSkeleton() {
  return (
    <SectionCard
      title="Профіль"
      subtitle="Назва, категорія та опис — ключові для довіри клієнтів."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock className="h-12 w-full rounded-2xl" />
        </div>

        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock className="h-12 w-full rounded-2xl" />
        </div>

        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-32" />
          <SkeletonBlock className="h-12 w-full rounded-2xl" />
        </div>

        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-20" />
          <SkeletonBlock className="h-12 w-full rounded-2xl" />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <SkeletonBlock className="h-4 w-16" />
          <SkeletonBlock className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    </SectionCard>
  );
}

function StudioLocationFormSkeleton() {
  return (
    <SectionCard
      title="Локація"
      subtitle="Адреса відображається клієнтам і впливає на пошук."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-20" />
          <SkeletonBlock className="h-12 w-full rounded-2xl" />
        </div>

        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-20" />
          <SkeletonBlock className="h-12 w-full rounded-2xl" />
        </div>

        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock className="h-12 w-full rounded-2xl" />
        </div>

        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-28" />
          <SkeletonBlock className="h-12 w-full rounded-2xl" />
        </div>

        <div className="sm:col-span-2 rounded-2xl border border-[#eadbc9] bg-[#fff7f0] p-4">
          <SkeletonBlock className="h-3 w-16" />
          <SkeletonBlock className="mt-2 h-4 w-full" />
        </div>
      </div>
    </SectionCard>
  );
}

function StudioPortfolioSkeleton() {
  return (
    <SectionCard
      title="Портфоліо"
      subtitle="Додай 4–12 фото робіт — це сильніше за будь-який текст."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <SkeletonBlock className="h-11 w-36 rounded-2xl" />
          <SkeletonBlock className="h-11 w-28 rounded-2xl" />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock
              key={i}
              className="aspect-square w-full rounded-[22px]"
            />
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

function completeness(form) {
  const hasCover = Boolean(form.coverFile || form.coverUrl?.trim());
  const hasLogo = Boolean(form.logoFile || form.logoUrl?.trim());
  const portfolioCount =
    (form.portfolioUrls?.length || 0) + (form.portfolioFiles?.length || 0);

  const items = [
    { key: "name", label: "Назва студії", ok: Boolean(form.name?.trim()) },
    { key: "category", label: "Категорія", ok: Boolean(form.category) },
    { key: "phone", label: "Номер телефону", ok: Boolean(form.phone?.trim()) },
    { key: "email", label: "Пошта", ok: Boolean(form.email?.trim()) },
    { key: "description", label: "Опис", ok: Boolean(form.description?.trim()) },
    { key: "coverUrl", label: "Обкладинка", ok: hasCover },
    { key: "logoUrl", label: "Логотип", ok: hasLogo },
    {
      key: "address",
      label: "Адреса",
      ok: Boolean(form.city?.trim() && form.street?.trim() && form.building?.trim()),
    },
    { key: "portfolio", label: "Портфоліо", ok: portfolioCount >= 1 },
  ];

  const done = items.filter((i) => i.ok).length;
  const total = items.length;
  const percent = Math.round((done / total) * 100);
  const next = items.find((i) => !i.ok);

  return { items, done, total, percent, next };
}

export default function StudioSettings() {
  const { studio, updateStudio } = useStudio();
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const tabFromUrl = searchParams.get("tab");
  const initialTab = ["profile", "location", "links"].includes(tabFromUrl)
    ? tabFromUrl
    : "profile";
  const [menuOpen, setMenuOpen] = useState(false);
const [editModal, setEditModal] = useState({
  open: false,
  field: "",
  title: "",
  value: "",
});
  const [tab, setTab] = useState(initialTab);
const [cropModal, setCropModal] = useState({
  open: false,
  imageUrl: "",
  target: "",
});

const [crop, setCrop] = useState({ x: 0, y: 0 });
const [zoom, setZoom] = useState(1);
const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  function setTabUrl(nextTab) {
    setTab(nextTab);
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.set("tab", nextTab);
        return p;
      },
      { replace: true },
    );
  }

  const [form, setForm] = useState({
    name: "",
    category: "",
    phone: "",
    email: "",
    description: "",
    city: "",
    street: "",
    building: "",
    apartment: "",
    coverUrl: "",
    logoUrl: "",
    portfolioUrls: [],
    coverFile: null,
    logoFile: null,
    portfolioFiles: [],
  });

  const [highlightId, setHighlightId] = useState("");
  const [highlightAddress, setHighlightAddress] = useState(false);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("");
  const [logoPreviewUrl, setLogoPreviewUrl] = useState("");
  const [portfolioPreviewUrls, setPortfolioPreviewUrls] = useState([]);
  const [highlightTone, setHighlightTone] = useState("green");



  const highlightClass =
    highlightTone === "green"
      ? "ring-2 ring-[#ff5a00]/25 bg-[#fff1e8] border-[#ffd6bd]"
      : "ring-2 ring-[#ff5a00]/20 bg-[#fff7f0] border-[#ffd6bd]";

  const baseFieldClass =
    "w-full rounded-2xl border border-[#eadbc9] bg-white p-3 text-sm font-semibold text-[#202020] outline-none transition-all duration-200 placeholder:text-[#9b948c] hover:border-[#ffd6bd] hover:bg-[#fff7f0] focus:border-[#ff5a00] focus:bg-white focus:ring-4 focus:ring-[#ff5a00]/10";

  const [pendingDeletes, setPendingDeletes] = useState([]);

  function stageDelete(key) {
    const k = String(key || "").trim();
    if (!k) return;
    if (/^https?:\/\//i.test(k)) return;
    setPendingDeletes((prev) => (prev.includes(k) ? prev : [...prev, k]));
  }

  function fieldClass(id) {
    const isAddressField =
      id === "studio-field-city" ||
      id === "studio-field-street" ||
      id === "studio-field-building" ||
      id === "studio-field-apartment";

    const shouldHighlight =
      highlightId === id || (highlightAddress && isAddressField);

    return [baseFieldClass, shouldHighlight ? highlightClass : ""].join(" ");
  }

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({
    id: 0,
    open: false,
    type: "success",
    title: "",
    text: "",
    duration: 3000,
  });

  function showToast({ type = "success", title, text }) {
    const duration = 2600;

    setToast({
      id: Date.now(),
      open: true,
      type,
      title,
      text,
      duration,
    });

    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      setToast((prev) => ({ ...prev, open: false }));
    }, duration);
  }

  const [errorModal, setErrorModal] = useState({
    open: false,
    title: "",
    message: "",
  });

const hasCover = Boolean(form.coverFile || form.coverUrl?.trim());
const hasLogo = Boolean(form.logoFile || form.logoUrl?.trim());
const coverSrc = coverPreviewUrl || toPublicUrl(form.coverUrl);
const logoSrc = logoPreviewUrl || toPublicUrl(form.logoUrl);

const addressPreview = [
  form.city,
  form.street,
  form.building,
  form.apartment,
]
  .filter(Boolean)
  .join(", ") || "Адреса студії";
  const [portfolioPreview, setPortfolioPreview] = useState({
    open: false,
    src: "",
  });

  
  useEffect(() => {
  const isAnyModalOpen =
    editModal.open ||
    cropModal.open ||
    portfolioPreview.open ||
    errorModal.open;

  if (isAnyModalOpen) {
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
  } else {
    document.body.style.overflow = "";
    document.body.style.touchAction = "";
  }

  return () => {
    document.body.style.overflow = "";
    document.body.style.touchAction = "";
  };
}, [
  editModal.open,
  cropModal.open,
  portfolioPreview.open,
  errorModal.open,
]);

  useEffect(() => {
    if (!form.coverFile) {
      setCoverPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(form.coverFile);
    setCoverPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [form.coverFile]);

  useEffect(() => {
    if (!form.logoFile) {
      setLogoPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(form.logoFile);
    setLogoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [form.logoFile]);

  const hasAnyPortfolio =
    (form.portfolioUrls?.length || 0) + (form.portfolioFiles?.length || 0) > 0;

  useEffect(() => {
    const files = form.portfolioFiles || [];
    if (!files.length) {
      setPortfolioPreviewUrls([]);
      return;
    }

    const urls = files.map((f) => URL.createObjectURL(f));
    setPortfolioPreviewUrls(urls);

    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [form.portfolioFiles]);

  useEffect(() => {
    if (!portfolioPreview.open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") setPortfolioPreview({ open: false, src: "" });
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.classList.add("modal-open");

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("modal-open");
    };
  }, [portfolioPreview.open]);

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (studio === undefined) {
      setInitialLoading(true);
      return;
    }

    if (!studio) {
      setInitialLoading(false);
      setHydrated(true);
      return;
    }

    setForm({
      name: studio?.name || "",
      category: studio?.category || "",
      phone: studio?.phone || "",
      email: studio?.email || "",
      description: studio?.description || "",
      city: studio?.city || "",
      street: studio?.street || "",
      building: studio?.building || "",
      apartment: studio?.apartment || "",
      coverUrl: studio?.coverUrl || "",
      logoUrl: studio?.logoUrl || "",
      portfolioUrls: Array.isArray(studio?.portfolioUrls)
        ? studio.portfolioUrls
        : [],
      coverFile: null,
      logoFile: null,
      portfolioFiles: [],
    });

    setHydrated(true);
    setInitialLoading(false);
  }, [studio]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const me = await api("/auth/me", { token });
        const email = me?.account?.email || "";

        if (!alive) return;

        setForm((p) => ({
          ...p,
          email: p.email || email,
        }));
      } catch {
        //
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const urls = [];
    if (form.coverFile) urls.push(fileToPreviewUrl(form.coverFile));
    if (form.logoFile) urls.push(fileToPreviewUrl(form.logoFile));
    form.portfolioFiles?.forEach((f) => urls.push(fileToPreviewUrl(f)));
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [form.coverFile, form.logoFile, form.portfolioFiles]);

  const errors = useMemo(() => {
    const e = {};
    if (form.phone && !/^\+?\d[\d\s()-]{8,}$/.test(form.phone.trim())) {
      e.phone = "Вкажи коректний номер телефону.";
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      e.email = "Вкажи коректну пошту.";
    }

    if (form.description.length > MAX_DESC) e.description = "Опис завеликий.";

    if ((form.portfolioUrls?.length || 0) > MAX_PORTFOLIO) {
      e.portfolioUrls = `Максимум ${MAX_PORTFOLIO} фото.`;
    }

    return e;
  }, [form]);

  const rawDirty = useMemo(() => {
    const currentPortfolio = Array.isArray(studio?.portfolioUrls)
      ? studio.portfolioUrls
      : [];

    return (
      (studio?.name || "") !== form.name ||
      (studio?.category || "") !== form.category ||
      (studio?.phone || "") !== form.phone ||
      (studio?.email || "") !== form.email ||
      (studio?.description || "") !== form.description ||
      (studio?.city || "") !== form.city ||
      (studio?.street || "") !== form.street ||
      (studio?.building || "") !== form.building ||
      (studio?.apartment || "") !== form.apartment ||
      (studio?.coverUrl || "") !== form.coverUrl ||
      (studio?.logoUrl || "") !== form.logoUrl ||
      JSON.stringify(currentPortfolio) !== JSON.stringify(form.portfolioUrls || []) ||
      Boolean(form.coverFile) ||
      Boolean(form.logoFile) ||
      (form.portfolioFiles?.length || 0) > 0
    );
  }, [studio, form]);

  function resetChanges() {
    if (!studio) return;

    setPendingDeletes([]);
    setForm({
      name: studio?.name || "",
      category: studio?.category || "",
      phone: studio?.phone || "",
      email: studio?.email || "",
      description: studio?.description || "",
      city: studio?.city || "",
      street: studio?.street || "",
      building: studio?.building || "",
      apartment: studio?.apartment || "",
      coverUrl: studio?.coverUrl || "",
      logoUrl: studio?.logoUrl || "",
      portfolioUrls: Array.isArray(studio?.portfolioUrls) ? studio.portfolioUrls : [],
      coverFile: null,
      logoFile: null,
      portfolioFiles: [],
    });
  }

  const dirty = hydrated ? rawDirty : false;
  const hasPendingChanges =
  dirty &&
  !saving &&
  !cropModal.open &&
  !editModal.open;
  const canSave = dirty && Object.keys(errors).length === 0 && !saving;
  const [clearingPortfolio, setClearingPortfolio] = useState(false);

  function setField(name, value) {
    if (name === "description" && value.length > MAX_DESC) return;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function uploadOne(studioId, file, kind, token) {
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/media/studio-${kind}/${studioId}`,
      {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      },
    );

    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message || "Upload failed");
    return data;
  }

  async function getCroppedImage(imageSrc, cropPixels) {
  const image = new Image();
  image.src = imageSrc;

  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 900;

  const ctx = canvas.getContext("2d");

  ctx.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    900,
    900,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Crop failed"));
          return;
        }

        resolve(
          new File([blob], "studio-image.jpg", {
            type: "image/jpeg",
            lastModified: Date.now(),
          }),
        );
      },
      "image/jpeg",
      0.82,
    );
  });
}

  async function uploadMany(studioId, files, token) {
    const fd = new FormData();
    for (const f of files) fd.append("files", f);

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/media/studio-portfolio/${studioId}`,
      {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      },
    );

    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message || "Upload failed");
    return data;
  }

  function pickImage(e, fieldKey) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE) {
      setErrorModal({
        open: true,
        title: "Файл завеликий",
        message: "До 5 MB.",
      });
      return;
    }

    if (!file.type?.startsWith("image/")) {
      setErrorModal({
        open: true,
        title: "Невірний формат",
        message: "Обери зображення.",
      });
      return;
    }

const imageUrl = URL.createObjectURL(file);

setCrop({ x: 0, y: 0 });
setZoom(1);
setCroppedAreaPixels(null);

setCropModal({
  open: true,
  imageUrl,
  target: fieldKey,
});
  }

async function confirmCrop() {
  if (!cropModal.imageUrl || !croppedAreaPixels) return;

  const croppedFile = await getCroppedImage(
    cropModal.imageUrl,
    croppedAreaPixels,
  );

  const target = cropModal.target;

  URL.revokeObjectURL(cropModal.imageUrl);

  setCropModal({
    open: false,
    imageUrl: "",
    target: "",
  });

  setCrop({ x: 0, y: 0 });
  setZoom(1);
  setCroppedAreaPixels(null);

  const nextForm = {
    ...form,
    ...(target === "coverUrl" ? { coverFile: croppedFile } : {}),
    ...(target === "logoUrl" ? { logoFile: croppedFile } : {}),
  };

  setForm(nextForm);

  setTimeout(() => {
    save({ preventDefault: () => {} }, nextForm);
  }, 0);
}

  function pickPortfolioImages(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;

    const left =
      MAX_PORTFOLIO -
      ((form.portfolioUrls?.length || 0) + (form.portfolioFiles?.length || 0));

    const take = files.slice(0, Math.max(0, left));

    const okFiles = [];
    let skipped = 0;

    for (const f of take) {
      if (!f.type?.startsWith("image/") || f.size > MAX_IMAGE_SIZE) {
        skipped++;
        continue;
      }
      okFiles.push(f);
    }

    if (!okFiles.length) {
      setErrorModal({
        open: true,
        title: "Не вдалося додати фото",
        message: "Фото завеликі або не підтримуються. Обери інші (до 5MB).",
      });
      return;
    }

const nextForm = {
  ...form,
  portfolioFiles: [...(form.portfolioFiles || []), ...okFiles].slice(
    0,
    MAX_PORTFOLIO,
  ),
};

setForm(nextForm);

setTimeout(() => {
  save({ preventDefault: () => {} }, nextForm);
}, 0);

    if (skipped) {
      showToast({
        type: "error",
        title: "Деякі фото пропущено",
        text: `Пропущено ${skipped} файл(и) — завеликі або не підходять.`,
      });
    }
  }

  async function deleteFromR2(key) {
    const token = localStorage.getItem("token");

    const res = await fetch(`${import.meta.env.VITE_API_URL}/media/delete`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ key }),
    });

    if (!res.ok) throw new Error("Delete failed");
  }

  async function deleteManyFromR2(keys) {
    const list = (keys || [])
      .map((k) => String(k || "").trim())
      .filter(Boolean)
      .filter((k) => !/^https?:\/\//i.test(k));

    if (!list.length) return;

    const BATCH = 5;
    for (let i = 0; i < list.length; i += BATCH) {
      const chunk = list.slice(i, i + BATCH);
      await Promise.allSettled(chunk.map((k) => deleteFromR2(k)));
    }
  }

  function movePortfolioMixed(from, to) {
    const remoteCount = form.portfolioUrls?.length || 0;
    const localCount = form.portfolioFiles?.length || 0;
    const total = remoteCount + localCount;

    if (to < 0 || to >= total) return;

    const combined = [
      ...(form.portfolioUrls || []).map((_, i) => ({ type: "remote", i })),
      ...(form.portfolioFiles || []).map((_, i) => ({ type: "local", i })),
    ];

    const arr = [...combined];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);

    const nextUrls = [];
    const nextFiles = [];

    for (const x of arr) {
      if (x.type === "remote") nextUrls.push(form.portfolioUrls[x.i]);
      else nextFiles.push(form.portfolioFiles[x.i]);
    }

const nextForm = {
  ...form,
  portfolioUrls: nextUrls.slice(0, MAX_PORTFOLIO),
  portfolioFiles: nextFiles.slice(0, MAX_PORTFOLIO),
};

setForm(nextForm);

setTimeout(() => {
  save({ preventDefault: () => {} }, nextForm);
}, 0);
  }

  function removePortfolioMixed(idx) {
    const remoteCount = form.portfolioUrls?.length || 0;

    if (idx < remoteCount) {
      const key = form.portfolioUrls[idx];
      if (!key) return;

      stageDelete(key);

const nextForm = {
  ...form,
  portfolioUrls: (form.portfolioUrls || []).filter((_, i) => i !== idx),
};

setForm(nextForm);

setTimeout(() => {
  save({ preventDefault: () => {} }, nextForm);
}, 0);

      showToast({
        type: "warning",
        title: "Зміна підготовлена",
        text: "Фото буде видалено після “Зберегти”.",
      });

      return;
    }

    const localIndex = idx - remoteCount;

    setForm((p) => ({
      ...p,
      portfolioFiles: (p.portfolioFiles || []).filter((_, i) => i !== localIndex),
    }));
  }

  const portfolioCount =
    (form.portfolioUrls?.length || 0) + (form.portfolioFiles?.length || 0);

  async function clearPortfolio() {
    const remoteKeys = form.portfolioUrls || [];
    const localCount = form.portfolioFiles?.length || 0;

    if (!remoteKeys.length && !localCount) return;

    const hadRemote = remoteKeys.length > 0;
    const hadLocal = localCount > 0;

    setClearingPortfolio(true);

    try {
      if (hadRemote) remoteKeys.forEach(stageDelete);

      setForm((p) => ({
        ...p,
        portfolioUrls: [],
        portfolioFiles: [],
      }));

      await new Promise((r) => setTimeout(r, 350));

      if (hadRemote && hadLocal) {
        showToast({
          type: "success",
          title: "Профіль оновлено",
          text: "Зміни збережено.",
        });
      } else if (hadRemote) {
        showToast({
          type: "warning",
          title: "Портфоліо очищено",
          text: "Фото будуть видалені після “Зберегти”.",
        });
      } else {
        showToast({
          type: "success",
          title: "Портфоліо очищено",
          text: "Додані фото видалені.",
        });
      }
    } finally {
      setClearingPortfolio(false);
    }
  }

  async function removeImage(fieldKey) {
    const key = form[fieldKey];
    if (!key) return;

    stageDelete(key);

    setForm((prev) => ({
      ...prev,
      [fieldKey]: "",
      ...(fieldKey === "coverUrl" ? { coverFile: null } : {}),
      ...(fieldKey === "logoUrl" ? { logoFile: null } : {}),
    }));

    showToast({
      type: "warning",
      title: "Зміна підготовлена",
      text: "Файл буде видалено після натискання “Зберегти”.",
    });
  }

async function save(e, overrideForm = null) {
  e?.preventDefault?.();

  const data = overrideForm || form;

  if (!studio?.id) return;

  setSaving(true);

  try {
    const token = localStorage.getItem("token");

    let nextCoverKey = data.coverUrl || "";
    let nextLogoKey = data.logoUrl || "";
    let nextPortfolioKeys = Array.isArray(data.portfolioUrls)
      ? [...data.portfolioUrls]
      : [];

    const deletesAfterSave = [...pendingDeletes];

    if (data.coverFile) {
      const out = await uploadOne(studio.id, data.coverFile, "cover", token);
      nextCoverKey = out.key;
    }

    if (data.logoFile) {
      const out = await uploadOne(studio.id, data.logoFile, "logo", token);
      nextLogoKey = out.key;
    }

    if ((data.portfolioFiles?.length || 0) > 0) {
      const out = await uploadMany(studio.id, data.portfolioFiles, token);
      const newKeys = out.keys || [];
      nextPortfolioKeys = [...nextPortfolioKeys, ...newKeys].slice(0, MAX_PORTFOLIO);
    }

    await updateStudio({
      name: data.name.trim(),
      category: data.category,
      phone: data.phone.trim(),
      email: data.email.trim(),
      description: data.description.trim(),
      city: data.city.trim(),
      street: data.street.trim(),
      building: data.building.trim(),
      apartment: data.apartment.trim(),
      coverUrl: nextCoverKey,
      logoUrl: nextLogoKey,
      portfolioUrls: nextPortfolioKeys,
    });
setPendingDeletes([]);
setHighlightId("");
setHighlightAddress(false);
    setForm((p) => ({
      ...p,
      ...data,
      coverUrl: nextCoverKey,
      logoUrl: nextLogoKey,
      portfolioUrls: nextPortfolioKeys,
      coverFile: null,
      logoFile: null,
      portfolioFiles: [],
    }));

    setPendingDeletes([]);

    showToast({
      type: "success",
      title: "Збережено",
      text: "Профіль оновлено",
    });
  } catch (error) {
    console.error(error);

    showToast({
      type: "error",
      title: "Помилка",
      text: "Не вдалося зберегти зміни",
    });
  } finally {
    setSaving(false);
  }
}

  const headerTriggerRef = useRef(null);
  const [showTopSave, setShowTopSave] = useState(false);
  const floatingVisible = showTopSave || hasPendingChanges;

  useEffect(() => {
    const el = headerTriggerRef.current;
    if (!el) return;

    function getRootMargin() {
      const w = window.innerWidth;
      if (w < 640) return "-620px 0px 0px 0px";
      if (w < 768) return "-400px 0px 0px";
      return "-50px 0px 0px 0px";
    }

    let observer = new IntersectionObserver(
      ([entry]) => {
        setShowTopSave(!entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: getRootMargin(),
      },
    );

    observer.observe(el);

    function handleResize() {
      observer.disconnect();

      observer = new IntersectionObserver(
        ([entry]) => {
          setShowTopSave(!entry.isIntersecting);
        },
        {
          threshold: 0,
          rootMargin: getRootMargin(),
        },
      );

      observer.observe(el);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const AddressLine = useMemo(() => {
    const parts = [
      form.city?.trim(),
      [form.street?.trim(), form.building?.trim()].filter(Boolean).join(" "),
      form.apartment?.trim() ? `офіс/кв. ${form.apartment.trim()}` : "",
    ].filter(Boolean);
    return parts.length ? parts.join(", ") : "Адреса не заповнена";
  }, [form]);

  const profile = useMemo(() => completeness(form), [form]);

const FIELD_ID = {
  name: "studio-field-name",
  category: "studio-field-category",
  phone: "studio-field-phone",
  email: "studio-field-email",
  description: "studio-field-description",

  city: "studio-field-city",
  street: "studio-field-street",
  building: "studio-field-building",
  apartment: "studio-field-apartment",

  coverUrl: "studio-field-coverUrl",
  logoUrl: "studio-field-logoUrl",
  portfolio: "studio-field-portfolio-add",
  address: "studio-field-city",
};

  function highlightAddressFields() {
    setHighlightTone("green");
    setHighlightAddress(true);
    window.setTimeout(() => setHighlightAddress(false), 2800);
  }

  function resolveTabByKey(key) {
    if (["city", "street", "building", "apartment", "address"].includes(key)) {
      return "location";
    }
    if (["portfolio"].includes(key)) {
      return "links";
    }

    return "profile";
  }

  function goToNextIncomplete() {
    if (!profile?.next?.key) return;
    goToField(profile.next.key, { tone: "green" });
  }

function goToField(key, opts = {}) {
  const tone = opts.tone || "green";
  setHighlightTone(tone);

  if (["name", "category", "phone", "email", "description"].includes(key)) {
    setTabUrl("profile");

    requestAnimationFrame(() => {
      setTimeout(() => {
        const id = FIELD_ID[key];

        if (id) {
          document.getElementById(id)?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });

          setHighlightId(id);
          window.setTimeout(() => setHighlightId(""), 1800);
        }

        openStudioEditModal(key);
      }, 180);
    });

    return;
  }

  if (key === "address") {
    setTabUrl("location");

    requestAnimationFrame(() => {
      setTimeout(() => {
        highlightAddressFields();

        const firstEmpty =
          !form.city?.trim()
            ? "city"
            : !form.street?.trim()
              ? "street"
              : !form.building?.trim()
                ? "building"
                : "apartment";

        const targetId = FIELD_ID[firstEmpty] || "studio-field-city";

        document.getElementById(targetId)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        setHighlightId(targetId);
        window.setTimeout(() => setHighlightId(""), 1800);

        openStudioEditModal(firstEmpty);
      }, 180);
    });

    return;
  }

  if (key === "coverUrl") {
    setTabUrl("profile");

    requestAnimationFrame(() => {
      setTimeout(() => {
        document.getElementById("studio-field-coverUrl")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        setHighlightId("studio-field-coverUrl");
        window.setTimeout(() => setHighlightId(""), 1800);

        openCoverPicker();
      }, 180);
    });

    return;
  }

  if (key === "logoUrl") {
    setTabUrl("profile");

    requestAnimationFrame(() => {
      setTimeout(() => {
        document.getElementById("studio-field-logoUrl")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        setHighlightId("studio-field-logoUrl");
        window.setTimeout(() => setHighlightId(""), 1800);

        openLogoPicker();
      }, 180);
    });

    return;
  }

  if (key === "portfolio") {
    setTabUrl("links");

    requestAnimationFrame(() => {
      setTimeout(() => {
        document.getElementById("studio-field-portfolio")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        setHighlightId("studio-field-portfolio-add");
        window.setTimeout(() => setHighlightId(""), 1800);
      }, 180);
    });
  }
}

  const coverInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const openCoverPicker = () => coverInputRef.current?.click();
  const openLogoPicker = () => logoInputRef.current?.click();

  const onKeyboardPick = (fn) => (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
    }
  };

  function pickCoverFromPreview() {
    setHighlightId("studio-field-coverUrl");
    window.setTimeout(() => setHighlightId(""), 2800);
    openCoverPicker();
  }

  function pickLogoFromPreview() {
    setHighlightId("studio-field-logoUrl");
    window.setTimeout(() => setHighlightId(""), 2800);
    openLogoPicker();
  }

  const portfolioItems = useMemo(() => {
    const remote = (form.portfolioUrls || []).map((k) => ({
      type: "remote",
      src: toPublicUrl(k),
      key: k,
      value: k,
    }));

    const local = (portfolioPreviewUrls || []).map((url, i) => ({
      type: "local",
      src: url,
      key: `local-${i}`,
      value: form.portfolioFiles?.[i],
    }));

    return [...remote, ...local].slice(0, MAX_PORTFOLIO);
  }, [form.portfolioUrls, form.portfolioFiles, portfolioPreviewUrls]);

  useEffect(() => {
    const syncMenuState = () => {
      setMenuOpen(document.body.classList.contains("menu-open"));
    };

    syncMenuState();

    const observer = new MutationObserver(syncMenuState);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const categoryLabel = form.category
    ? getCategoryLabel(form.category)
    : "Категорія";

    function openStudioEditModal(field) {
  const config = {
    name: {
      title: "Назва студії",
      value: form.name,
    },
    category: {
      title: "Категорія",
      value: form.category,
    },
    phone: {
      title: "Номер телефону",
      value: form.phone,
    },
    email: {
      title: "Електронна пошта",
      value: form.email,
    },
    description: {
      title: "Опис студії",
      value: form.description,
    },
    city: {
      title: "Місто",
      value: form.city,
    },
    street: {
      title: "Вулиця",
      value: form.street,
    },
    building: {
      title: "Будинок",
      value: form.building,
    },
    apartment: {
      title: "Квартира / Офіс",
      value: form.apartment,
    },
  };

  setEditModal({
    open: true,
    field,
    title: config[field]?.title || "Редагування",
    value: config[field]?.value || "",
  });
}

function closeStudioEditModal() {
  setEditModal({
    open: false,
    field: "",
    title: "",
    value: "",
  });
}

async function saveStudioEditModal() {
  if (!editModal.field) return;

  const field = editModal.field;
  const value = editModal.value;

  closeStudioEditModal();

  setForm((prev) => {
    const next = { ...prev, [field]: value };

    setTimeout(() => {
      save({ preventDefault: () => {} }, next);
    }, 0);

    return next;
  });
}

  return (
    <div className="min-h-screen ">
     <div className="mx-auto max-w-5xl space-y-6">
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => pickImage(e, "coverUrl")}
          className="hidden"
        />

        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => pickImage(e, "logoUrl")}
          className="hidden"
        />

        <div className="mb-6">
<div
  ref={headerTriggerRef}
  className="relative overflow-hidden rounded-[32px] border border-[#ebe7df] bg-white/95 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-7"
>
  <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#ff7a18] via-[#ff6200] to-[#ff8c42]" />

            <div className="absolute -right-7 -top-10 hidden h-28 w-28 rounded-full bg-white/40 sm:block" />
            <div className="absolute bottom-4 right-24 hidden h-5 w-5 rounded-full bg-[#ff5a00]/20 sm:block" />


            <div className="relative max-w-2xl">
              <h1 className="max-w-xl text-4xl font-black leading-[0.95] tracking-tight text-[#202020] sm:text-6xl">
                Профіль <span className="text-[#ff5a00]">студії</span>
              </h1>

  <p className="mt-3 max-w-[640px] text-[14px] leading-6 text-[#7b766f] sm:text-[16px]">
  Налаштуйте профіль студії, контактні дані, адресу та портфоліо робіт.
</p>
            </div>
          </div>

         <div className="mt-4 rounded-[32px] border border-[#ebe7df] bg-white p-2 shadow-[0_10px_32px_rgba(15,23,42,0.04)]">
          <div
  className={cn(
    "flex flex-col gap-3 md:flex-row md:items-center",
    profile.percent === 100
      ? "justify-center"
      : "md:justify-between",
  )}
>
              <div className="flex justify-center gap-1 overflow-x-auto px-0 sm:gap-2">
                {[
                  { id: "profile", label: "Профіль" },
                  { id: "location", label: "Локація" },
                  { id: "links", label: "Портфоліо" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTabUrl(t.id)}
                    className={cn(
                      "shrink-0 whitespace-nowrap rounded-2xl px-3 py-2 text-[13px] font-black transition-all duration-200 sm:px-4 sm:py-2.5 sm:text-sm",
                      tab === t.id
                        ? "bg-[#ff5a00] text-white"
                        : "bg-white text-[#77716b] hover:bg-[#fff7f0] hover:text-[#202020]",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {profile.percent !== 100 && (
                <div className="mx-auto flex w-fit max-w-full shrink-0 items-center gap-3 rounded-2xl border border-[#ffd6bd] bg-[#fff1e8] px-3 py-2 sm:mx-0 sm:w-auto sm:min-w-[220px] sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
                      <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-[#ff5a00] opacity-75" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-[#ff5a00]" />
                    </div>

                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#ff5a00]">
                        Заповненість
                      </p>

                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-[#202020]">
                          {profile.percent}%
                        </p>

                        <span className="text-xs font-medium text-[#77716b]">
                          {profile.done}/{profile.total}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button variant="primary" size="sm" onClick={goToNextIncomplete}>
                    Заповнити
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {tab === "profile" && (
            <div className="space-y-6">
              {initialLoading ? (
                <StudioPreviewSkeleton />
              ) : (
<section className="overflow-hidden rounded-[30px] border border-[#eadbc9] bg-white p-3 shadow-[0_18px_50px_rgba(17,17,17,0.06)]">
  <div className="relative h-[410px] overflow-hidden rounded-[30px] bg-[#202020] text-white shadow-[0_14px_34px_rgba(0,0,0,0.16)] max-[639px]:h-[200px] max-[639px]:rounded-[20px] sm:h-[215px] sm:rounded-[18px]">
    <button
      id="studio-field-coverUrl"
      type="button"
      onClick={() => coverInputRef.current?.click()}
      disabled={saving}
      className="group absolute inset-0 block h-full w-full overflow-hidden"
    >
      {coverSrc ? (
        <img
          src={coverSrc}
          alt="Обкладинка"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_15%,#5c5248,#191919_56%)]" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />

      <div className="absolute inset-0 grid place-items-center bg-black/25 opacity-0 transition group-hover:opacity-100">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-black text-[#202020] shadow-lg">
          <Camera className="h-4 w-4 text-[#ff5a00]" />
          Змінити обкладинку
        </span>
      </div>
    </button>

    <div className="absolute left-2.5 top-2.5 z-10 inline-flex h-6 max-w-[58%] items-center gap-1 rounded-full border border-white/40 bg-white/92 px-2 shadow-[0_8px_18px_rgba(20,20,20,0.1)] backdrop-blur-md sm:left-4 sm:top-4 sm:h-7 sm:px-3">
      <span className="grid h-4 w-4 place-items-center rounded-full bg-[#fff3e9] text-[#ff6200] sm:h-5 sm:w-5">
        <Building2 className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
      </span>

      <span className="truncate text-[9px] font-bold tracking-[-0.01em] text-[#1c1c1c] sm:text-[11px]">
        {categoryLabel}
      </span>
    </div>

    <div className="absolute bottom-3 left-3 right-3 z-10 flex items-end gap-2 sm:bottom-4 sm:left-4 sm:right-4 sm:gap-3">
      <button
        id="studio-field-logoUrl"
        type="button"
        onClick={() => logoInputRef.current?.click()}
        disabled={saving}
        className="group relative grid h-[72px] w-[72px] shrink-0 place-items-center overflow-hidden rounded-[18px] bg-white text-black shadow-[0_12px_28px_rgba(0,0,0,0.22)] transition active:scale-[0.98] sm:h-[58px] sm:w-[58px] sm:rounded-[15px]"
      >
        {logoSrc ? (
          <img
            src={logoSrc}
            alt="Лого"
            className="h-full w-full object-cover object-center"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        ) : (
          <Camera className="h-9 w-9 text-black sm:h-7 sm:w-7" />
        )}

        <span className="absolute inset-0 grid place-items-center bg-black/40 text-white opacity-0 transition group-hover:opacity-100">
          <Camera className="h-5 w-5" />
        </span>
      </button>

      <div className="min-w-0 flex-1">
<h2 className="truncate pb-0.5 text-[16px] font-black leading-[1.15] tracking-[-0.04em] sm:text-[17px]">
  {form.name.trim() || "Назва студії"}
</h2>

        <p className="mt-1 flex items-center gap-1 truncate leading-[1.25] text-[10px] font-medium text-white sm:text-[10px] md:text-[10px] lg:text-[11px]">
          <MapPin className="-mt-[1px] h-3 w-3 shrink-0 text-[#ff6200]" />
          {addressPreview}
        </p>

        <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-[#13a044] sm:text-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-[#13a044] shadow-[0_0_0_3px_rgba(19,160,68,0.16)]" />
          Попередній вигляд
        </p>
      </div>
    </div>
  </div>
</section>
              )}
            </div>
          )}

          <div className="space-y-6">
            <form onSubmit={save} className="space-y-6">
              {tab === "profile" &&
                (initialLoading ? (
                  <StudioProfileFormSkeleton />
                ) : (
<section className="relative overflow-hidden rounded-[30px] border border-[#eadfce] bg-white shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
  <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#ff7a18] via-[#ff6200] to-[#ff8c42]" />
  <div className="flex items-center justify-between gap-3 border-b border-[#eee8df] px-5 py-4 sm:px-7">
    <h3 className="text-[24px] font-black tracking-[-0.05em] text-[#202020]">
      Дані студії
    </h3>
  </div>

  <div>
    {[
{
  icon: <Building2 className="h-5 w-5" />,
  label: "Назва студії",
  value: form.name || "Не вказано",
  id: "studio-field-name",
  field: "name",
},
{
  icon: <Sparkles className="h-5 w-5" />,
  label: "Категорія",
  value: getCategoryLabel(form.category) || "Не вказано",
  id: "studio-field-category",
  field: "category",
},
{
  icon: <Phone className="h-5 w-5" />,
  label: "Номер телефону",
  value: form.phone || "Не вказано",
  id: "studio-field-phone",
  field: "phone",
},
{
  icon: <Mail className="h-5 w-5" />,
  label: "Електронна пошта",
  value: form.email || "Не вказано",
  id: "studio-field-email",
  field: "email",
},
{
  icon: <FileText className="h-5 w-5" />,
  label: "Опис студії",
  value: form.description || "Не вказано",
  id: "studio-field-description",
  field: "description",
},
    ].map((item) => (
      <button
        key={item.id}
        type="button"
onClick={() => openStudioEditModal(item.field)}
        className={cn(
  "group flex w-full items-center justify-between gap-4 border-b border-[#eee8df] px-5 py-4 text-left transition last:border-b-0 hover:bg-[#fbfaf8] sm:px-7",
  highlightId === item.id &&
    "bg-[#fff1e8] ring-2 ring-[#ff6200]/20"
)}>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[#f7f5f1] text-[#77716b] transition group-hover:bg-[#fff1e8] group-hover:text-[#ff6200]">
          {item.icon}
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[#77716b]">
              {item.label}
            </p>
<p
  className={cn(
    "mt-1 text-sm font-black text-[#202020]",
    item.id === "studio-field-description"
      ? "line-clamp-2"
      : "truncate",
  )}
>
  {item.value}
</p>
          </div>

          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fff3e9] text-[#ff6200] transition-all duration-200 group-hover:scale-105 group-hover:bg-[#ff6200] group-hover:text-white">
            <PencilLine className="h-3.5 w-3.5" />
          </div>
        </div>
        
      </button>
    ))}
  </div>
  
</section>
                ))}

{tab === "location" &&
  (initialLoading ? (
    <StudioLocationFormSkeleton />
  ) : (
    <>
<section className="relative overflow-hidden rounded-[30px] border border-[#eadfce] bg-white shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
  <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#ff7a18] via-[#ff6200] to-[#ff8c42]" />
        <div className="flex items-center justify-between gap-3 border-b border-[#eee8df] px-5 py-4 sm:px-7">
          <h3 className="text-[24px] font-black tracking-[-0.05em] text-[#202020]">
            Локація студії
          </h3>
        </div>

        <div>
          {[
          {
  icon: <MapPinned className="h-5 w-5" />,
  label: "Місто",
  value: form.city || "Не вказано",
  targetId: "studio-field-city",
  field: "city",
},
{
  icon: <Signpost className="h-5 w-5" />,
  label: "Вулиця",
  value: form.street || "Не вказано",
  targetId: "studio-field-street",
  field: "street",
},
{
  icon: <House className="h-5 w-5" />,
  label: "Будинок",
  value: form.building || "Не вказано",
  targetId: "studio-field-building",
  field: "building",
},
{
  icon: <DoorOpen className="h-5 w-5" />,
  label: "Квартира / Офіс",
  value: form.apartment || "Не вказано",
  targetId: "studio-field-apartment",
  field: "apartment",
},
          ].map((item) => (
            <button
              key={item.targetId}
              type="button"
onClick={() => openStudioEditModal(item.field)}
              className={cn(
                "group flex w-full items-center justify-between gap-4 border-b border-[#eee8df] px-5 py-4 text-left transition last:border-b-0 hover:bg-[#fbfaf8] sm:px-7",
                highlightId === item.targetId &&
                  "bg-[#fff1e8] ring-2 ring-[#ff6200]/20"
              )}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[#f7f5f1] text-[#77716b] transition group-hover:bg-[#fff1e8] group-hover:text-[#ff6200]">
                {item.icon}
              </div>

              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#77716b]">
                    {item.label}
                  </p>

                  <p className="mt-1 truncate text-sm font-black text-[#202020]">
                    {item.value}
                  </p>
                </div>

                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fff3e9] text-[#ff6200] transition-all duration-200 group-hover:scale-105 group-hover:bg-[#ff6200] group-hover:text-white">
                  <PencilLine className="h-3.5 w-3.5" />
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="border-t border-[#eee8df] px-5 py-5 sm:px-7">
          <div className="rounded-[22px] border border-[#eadbc9] bg-[#f8f5f1] p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#ff6200]">
              Повна адреса
            </p>

            <p className="mt-2 text-sm font-black text-[#202020]">
              {AddressLine}
            </p>
          </div>
        </div>
      </section>
    </>
  ))}

              {tab === "links" &&
                (initialLoading ? (
                  <StudioPortfolioSkeleton />
                ) : (
                  <SectionCard
                    title="Портфоліо"
                    subtitle="Додай 4–12 фото робіт — це сильніше за будь-який текст."
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div
                        id="studio-field-portfolio"
                        className="pb-12 sm:col-span-2 md:pb-0"
                      >
                        <Field
                          label="Портфоліо (фото робіт)"
                          error={errors.portfolioUrls}
                          hint={`${portfolioCount}/${MAX_PORTFOLIO}`}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <label
                              id="studio-field-portfolio-add"
                              className={cn(
                                "inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#ff5a00] px-4 py-2.5 text-sm font-black text-white shadow-[0_14px_30px_rgba(255,90,0,0.22)] transition hover:bg-[#ef4f00] active:scale-[0.98]",
                                highlightId === "studio-field-portfolio-add" &&
                                  highlightClass,
                              )}
                            >
                              <Plus className="h-4 w-4" />
                              Додати фото
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={pickPortfolioImages}
                                className="hidden"
                              />
                            </label>

                            {portfolioCount > 0 && (
                              <Button
                                variant="danger"
                                onClick={clearPortfolio}
                                disabled={!portfolioCount || clearingPortfolio || saving}
                              >
                                <Trash2 className="h-4 w-4" />
                                {clearingPortfolio ? "Очищення..." : "Очистити"}
                              </Button>
                            )}
                          </div>

                          <div className="mt-4">
                            {!hasAnyPortfolio ? (
                              <div className="rounded-2xl border border-dashed border-[#ffd6bd] bg-[#fff1e8] p-4 text-sm font-semibold text-[#77716b]">
                                Додай фото робіт — це найсильніший доказ якості.
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
                                {portfolioItems.map((item, idx) => {
                                  const src = item.src;
                                  const isFirst = idx === 0;
                                  const isLast = idx === portfolioItems.length - 1;

                                  return (
                                    <div key={item.key} className="relative">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setPortfolioPreview({ open: true, src })
                                        }
                                        className="group block w-full overflow-hidden rounded-[22px] border border-[#eadbc9] bg-[#fff7f0] transition hover:shadow-[0_10px_24px_rgba(27,27,27,0.10)]"
                                        style={{ aspectRatio: "1 / 1" }}
                                      >
<img
  src={src}
  alt={`work ${idx + 1}`}
  className="h-full w-full object-cover"
/>

<button
  type="button"
  onClick={(e) => {
    e.stopPropagation();
    removePortfolioMixed(idx);
  }}
  className="absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-xl bg-[#e5484d] text-white opacity-100 shadow-[0_8px_20px_rgba(229,72,77,0.35)] transition-all duration-300 active:scale-95 sm:right-3 sm:top-3 sm:h-10 sm:w-10 sm:bg-black/70 sm:opacity-0 sm:backdrop-blur-xl sm:hover:scale-105 sm:hover:bg-[#e5484d] sm:group-hover:opacity-100"
  title="Видалити"
  aria-label="Remove"
>
  <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
</button>

                                        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-2">
                                          <div className="absolute inset-x-0 bottom-0 h-16 rounded-b-2xl bg-gradient-to-t from-black/60 via-black/25 to-transparent" />

                                          <div className="pointer-events-auto relative flex items-center justify-between">
                                            <div className="flex items-center gap-2">
<button
  type="button"
  onClick={(e) => {
    e.stopPropagation();
    movePortfolioMixed(idx, idx - 1);
  }}
  disabled={isFirst}
  className="group absolute bottom-1 left-1 sm:bottom-3 sm:left-3 z-20 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-white/80 text-black opacity-100 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300 sm:opacity-0 sm:hover:bg-white sm:group-hover:opacity-100 disabled:hidden"
>
  <ChevronLeft className="h-4 w-4 transition-all duration-300 group-hover:scale-150 group-hover:text-[#ff6200]" />
</button>

<button
  type="button"
  onClick={(e) => {
    e.stopPropagation();
    movePortfolioMixed(idx, idx + 1);
  }}
  disabled={isLast}
  className="group absolute bottom-1 right-1 sm:bottom-3 sm:right-3 z-20 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-white/80 text-black opacity-100 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300 sm:opacity-0 sm:hover:bg-white sm:group-hover:opacity-100 disabled:hidden"
>
  <ChevronRight className="h-4 w-4 transition-all duration-300 group-hover:scale-150 group-hover:text-[#ff6200]" />
</button>
                                            </div>
                                          </div>
                                        </div>
                                      </button>


                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </Field>
                      </div>
                    </div>
                  </SectionCard>
                ))}
                {editModal.open && (
  <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-[#202020]/45 px-3 pb-3 backdrop-blur-[6px] sm:items-center sm:p-6">
    <div className="w-full max-w-lg overflow-hidden rounded-[30px] border border-[#f0e2d3] bg-[#f7f5f1] shadow-[0_30px_90px_rgba(15,23,42,0.24)]">
      <div className="relative overflow-hidden bg-[#f3eee7] px-5 py-5 sm:px-6 sm:py-6">
        <div className="absolute right-[-55px] top-[-70px] h-[180px] w-[180px] rounded-full bg-[#ff6200]/10 blur-3xl" />

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[11px] font-black uppercase tracking-[0.08em] text-[#ff6200] shadow-[0_8px_20px_rgba(255,98,0,0.08)]">
              <PencilLine className="h-3.5 w-3.5" />
              Редагування
            </span>

            <h3 className="mt-3 text-[26px] font-black leading-[0.95] tracking-[-0.05em] text-[#202020] sm:text-[32px]">
              {editModal.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={closeStudioEditModal}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[#77716b] shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition hover:bg-[#fff3e9] hover:text-[#ff6200] active:scale-[0.96]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="bg-white px-5 py-5 sm:px-6">
        {editModal.field === "category" ? (
          <CustomSelect
            value={editModal.value}
            onChange={(value) =>
              setEditModal((prev) => ({ ...prev, value }))
            }
          options={SORTED_STUDIO_CATEGORIES}
            placeholder="Оберіть категорію"
          />
        ) : editModal.field === "description" ? (
          <textarea
            value={editModal.value}
            onChange={(e) =>
              setEditModal((prev) => ({
                ...prev,
                value: e.target.value.slice(0, MAX_DESC),
              }))
            }
            rows={5}
            placeholder="Коротко опишіть студію"
            className={baseFieldClass}
          />
        ) : (
          <input
            value={editModal.value}
            onChange={(e) =>
              setEditModal((prev) => ({ ...prev, value: e.target.value }))
            }
            placeholder={editModal.title}
            className={baseFieldClass}
          />
        )}
      </div>

      <div className="flex flex-row gap-2 border-t border-[#f0e7da] bg-[#fbfaf8] px-5 py-4 sm:justify-end sm:px-6">
        <Button
          type="button"
          variant="secondary"
          className="flex-1 sm:flex-none"
          onClick={closeStudioEditModal}
        >
          Скасувати
        </Button>

        <Button
          type="button"
          variant="primary"
          className="flex-1 sm:flex-none"
          onClick={saveStudioEditModal}
        >
          Зберегти
        </Button>
      </div>
    </div>
  </div>
)}
            </form>
          </div>
        </div>

        <div
          className={cn(
            "fixed left-1/2 top-[calc(12px+env(safe-area-inset-top))] z-[120] -translate-x-1/2 transition-all duration-200 ease-out",
            "md:bottom-5 md:left-5 md:top-auto md:translate-x-0",
            toast.open
              ? "translate-y-0 scale-100 opacity-100"
              : "pointer-events-none -translate-y-2 scale-[0.98] opacity-0 md:translate-y-2",
          )}
          role="status"
          aria-live="polite"
        >
          <div
            className={cn(
              "relative w-fit max-w-[85vw] overflow-hidden rounded-2xl border bg-white shadow-[0_16px_40px_rgba(27,27,27,0.12)]",
              toast.type === "success" && "border-[#ffd6bd]",
              toast.type === "error" && "border-[#ffd8d8]",
              toast.type === "warning" && "border-[#ffd6bd]",
            )}
          >
            <div className="flex items-start gap-3 px-4 py-3.5">
              <div
                className={cn(
                  "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white",
                  toast.type === "success" && "bg-[#ff5a00]",
                  toast.type === "error" && "bg-[#e5484d]",
                  toast.type === "warning" && "bg-[#ff5a00]",
                )}
              >
                {toast.type === "success" && (
                  <CheckCircle2 className="h-4.5 w-4.5" />
                )}
                {toast.type === "error" && <X className="h-4.5 w-4.5" />}
                {toast.type === "warning" && <AlertTriangle className="h-4.5 w-4.5" />}
              </div>

              <div className="min-w-0">
                <p className="whitespace-nowrap text-[14px] font-semibold text-[#202020]">
                  {toast.title}
                </p>

                {toast.text && (
                  <p className="mt-0.5 text-[13px] text-[#77716b]">
                    {toast.text}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setToast((prev) => ({ ...prev, open: false }))}
                className="ml-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#77716b] transition hover:bg-[#fff7f0] hover:text-[#202020]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div
                className={cn(
                  "h-[2px] w-full",
                  toast.type === "success" && "bg-[#fff1e8]",
                  toast.type === "error" && "bg-[#fff1f1]",
                  toast.type === "warning" && "bg-[#fff1e8]",
                )}
            >
              <div
                key={toast.id}
                className={cn(
                  "h-full w-full origin-left",
                  toast.type === "success" && "bg-[#ff5a00]",
                  toast.type === "error" && "bg-[#e5484d]",
                  toast.type === "warning" && "bg-[#ff5a00]",
                )}
                style={{
                  animation: `toastbar ${toast.duration}ms linear forwards`,
                }}
              />
            </div>
          </div>

          <style>{`
            @keyframes toastbar {
              from { transform: scaleX(1); }
              to { transform: scaleX(0); }
            }
          `}</style>
        </div>

        {portfolioPreview.open && (
          <div
         className="fixed left-0 top-0 z-[9999] flex h-[100dvh] w-screen items-center justify-center overflow-y-auto bg-[#202020]/45 p-3 backdrop-blur-[6px]"
            onClick={() => setPortfolioPreview({ open: false, src: "" })}
          >
            <div
              className="flex w-full max-w-3xl max-h-[calc(100dvh-24px)] flex-col overflow-hidden rounded-[30px] border border-[#f0e2d3] bg-[#f7f5f1] shadow-[0_30px_90px_rgba(15,23,42,0.24)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative shrink-0 overflow-hidden bg-[#f3eee7] px-5 py-5 sm:px-6">
                <div className="absolute right-[-55px] top-[-70px] h-[180px] w-[180px] rounded-full bg-[#ff6200]/10 blur-3xl" />
                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[11px] font-black uppercase tracking-[0.08em] text-[#ff6200] shadow-[0_8px_20px_rgba(255,98,0,0.08)]">
                      <Camera className="h-3.5 w-3.5" />
                      Портфоліо
                    </span>
                    <h3 className="mt-3 text-[26px] font-black leading-[0.95] tracking-[-0.05em] text-[#202020] sm:text-[32px]">
                      Перегляд фото
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPortfolioPreview({ open: false, src: "" })}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[#77716b] shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition hover:bg-[#fff3e9] hover:text-[#ff6200] active:scale-[0.96]"
                    aria-label="Закрити"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 bg-white p-5 sm:p-6">
                <img
                  src={portfolioPreview.src}
                  alt="Portfolio preview"
                  className="max-h-[62dvh] w-full rounded-[24px] bg-black object-contain"
                />
              </div>


            </div>
          </div>
        )}

        {errorModal.open && (
          <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-[#202020]/45 px-3 pb-3 backdrop-blur-[6px] sm:items-center sm:p-6">
            <div className="w-full max-w-md overflow-hidden rounded-[30px] border border-[#f0e2d3] bg-[#f7f5f1] shadow-[0_30px_90px_rgba(15,23,42,0.24)]">
              <div className="relative overflow-hidden bg-[#f3eee7] px-5 py-5 sm:px-6 sm:py-6">
                <div className="absolute right-[-55px] top-[-70px] h-[180px] w-[180px] rounded-full bg-[#ff6200]/10 blur-3xl" />
                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[11px] font-black uppercase tracking-[0.08em] text-[#ff6200] shadow-[0_8px_20px_rgba(255,98,0,0.08)]">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Увага
                    </span>
                    <h3 className="mt-3 text-[26px] font-black leading-[0.95] tracking-[-0.05em] text-[#202020]">
                      {errorModal.title}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setErrorModal({ open: false, title: "", message: "" })}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[#77716b] shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition hover:bg-[#fff3e9] hover:text-[#ff6200] active:scale-[0.96]"
                    aria-label="Закрити"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="bg-white px-5 py-5 sm:px-6">
                <p className="text-sm font-medium leading-6 text-[#77716b]">
                  {errorModal.message}
                </p>
              </div>

              <div className="flex flex-row gap-2 border-t border-[#f0e7da] bg-[#fbfaf8] px-5 py-4 sm:justify-end sm:px-6">
                <Button
                  variant="primary"
                  onClick={() => setErrorModal({ open: false, title: "", message: "" })}
                  className="flex-1 sm:flex-none"
                >
                  Зрозуміло
                </Button>
              </div>
            </div>
          </div>
        )}

        <div
          className={cn(
            "fixed inset-x-0 bottom-0 z-[80] transition-all duration-300 md:hidden",
            menuOpen || !hasPendingChanges
              ? "pointer-events-none translate-y-4 opacity-0"
              : "pointer-events-auto translate-y-0 opacity-100",
          )}
        >
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white via-white/95 to-transparent" />

          <div className="relative mx-auto max-w-5xl px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="relative overflow-hidden rounded-[26px] border border-[#eadbc9] bg-white/95 px-4 py-4 shadow-[0_24px_80px_rgba(27,27,27,0.18)] ring-1 ring-[#fff1e8] backdrop-blur-xl">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[#ff5a00]" />

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={resetChanges}
                  disabled={!dirty || saving}
                  className="flex-1"
                >
                  Скасувати
                </Button>

                <Button
                  variant="primary"
                  onClick={save}
                  disabled={!canSave}
                  className="flex-1"
                >
                  {saving ? "Збереження..." : "Зберегти"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-6 left-1/2 z-[80] hidden -translate-x-1/2 md:block">
          <div
            className={cn(
              "relative overflow-hidden rounded-[28px] border border-[#eadbc9] bg-white/95 px-5 py-4 shadow-[0_24px_80px_rgba(27,27,27,0.18)] ring-1 ring-[#fff1e8] backdrop-blur-xl transition-all duration-300",
              hasPendingChanges
                ? "translate-y-0 scale-100 opacity-100"
                : "pointer-events-none translate-y-4 scale-[0.98] opacity-0",
            )}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[#ff5a00]" />

            <div className="flex items-center gap-4">
              <div className="flex min-w-0 items-center gap-3 pr-2">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff1e8] shadow-[0_8px_20px_rgba(180,140,108,0.20)]">
                  <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-[#ff5a00] opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-[#ff5a00]" />
                </div>

                <div className="min-w-0">
                  <p className="text-[17px] font-black leading-none text-[#202020]">
                    Маєте незбережені зміни
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={resetChanges}
                  disabled={!dirty || saving}
                >
                  Скасувати
                </Button>

                <Button
                  variant="primary"
                  onClick={save}
                  disabled={!canSave}
                  className="min-w-[160px]"
                >
                  {saving ? "Збереження..." : "Зберегти"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "fixed right-4 top-4 z-[9999] transition-all duration-300",
            floatingVisible
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-2 opacity-0",
          )}
        />
      </div>
      {cropModal.open && (
  <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-[#202020]/45 px-3 pb-3 backdrop-blur-[6px] sm:items-center sm:p-6">
    <div className="w-full max-w-lg overflow-hidden rounded-[30px] border border-[#f0e2d3] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.24)]">
      <div className="px-5 py-5 text-center">
        <h3 className="text-[24px] font-black tracking-[-0.04em] text-[#202020]">
          Обрізати фото
        </h3>

        <p className="mt-2 text-sm font-medium text-[#77716b]">
          Виберіть область, яка буде видима у профілі клієнта.
        </p>
      </div>

      <div className="mx-5 h-[340px] overflow-hidden rounded-[26px] bg-black">
        <div className="relative h-full w-full">
          <Cropper
            image={cropModal.imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, croppedPixels) => {
              setCroppedAreaPixels(croppedPixels);
            }}
          />
        </div>
      </div>

      <div className="px-5 py-4">
        <label className="mb-2 block text-sm font-black text-[#202020]">
          Масштаб
        </label>

        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex gap-2 border-t border-[#f0e7da] bg-[#fbfaf8] px-5 py-4">
<Button
  type="button"
  variant="secondary"
  className="flex-1"
  onClick={() => {
    if (cropModal.imageUrl) URL.revokeObjectURL(cropModal.imageUrl);

    setCropModal({
      open: false,
      imageUrl: "",
      target: "",
    });

    setCroppedAreaPixels(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }}
>
  Скасувати
</Button>

<Button
  type="button"
  variant="primary"
  className="flex-1"
  disabled={saving}
  onClick={confirmCrop}
>
  <Check className="h-4 w-4" />
  Застосувати
</Button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
