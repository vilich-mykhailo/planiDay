// StudioSettings.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Sparkles,
  ChevronDown,
  Plus,
  X,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useStudio } from "../../context/studio/useStudio";
import { api } from "../../api/http";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_DESC = 400;
const MAX_PORTFOLIO = 12;
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

const getCategoryLabel = (value) => {
  return STUDIO_CATEGORIES.find((c) => c.value === value)?.label || value;
};

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function fileToPreviewUrl(file) {
  return file ? URL.createObjectURL(file) : "";
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
  className = "group relative overflow-hidden rounded-3xl border border-stone-200/60 bg-white",
}) {
  return (
    <section
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-stone-200/60 bg-white",
        "shadow-[0_4px_24px_-4px_rgba(120,90,60,0.08)] hover:shadow-[0_8px_32px_-4px_rgba(120,90,60,0.12)]",
        "transition-all duration-300",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-60" />

      <div className="flex flex-col gap-3 border-b border-stone-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-stone-800">
              {title}
            </h2>
            {badge && (
              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-0.5 text-sm text-stone-500">{subtitle}</p>
          )}
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
      "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 hover:from-emerald-700 hover:to-emerald-800",
    secondary:
      "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 hover:border-stone-300",
    danger:
      "bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 text-red-600 hover:from-red-100 hover:to-rose-100",
    ghost: "text-stone-600 hover:bg-stone-100",
    warning:
      "bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-700 hover:from-amber-100 hover:to-orange-100",
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
        "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200",
        "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
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
      "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-800",
    danger: "bg-red-50 border border-red-200 text-red-500 hover:bg-red-100",
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
  const [openUp, setOpenUp] = useState(false);
  const [menuPosition, setMenuPosition] = useState({
    top: undefined,
    bottom: undefined,
    left: 0,
    width: 0,
  });

  const rootRef = useRef(null);

  const selected = options.find((opt) => String(opt.value) === String(value));

  function updateMenuPosition() {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;

    const dropdownHeight = 320;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    const shouldOpenUp =
      spaceBelow < dropdownHeight && spaceAbove > dropdownHeight;

    setOpenUp(shouldOpenUp);

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
      return;
    }

    updateMenuPosition();
    setOpen(true);
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (!rootRef.current?.contains(e.target)) {
        setOpen(false);
      }
    }

    function handleEscape(e) {
      if (e.key === "Escape") setOpen(false);
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
            ? "border-amber-400 bg-white shadow-[0_10px_30px_rgba(251,146,60,0.18)] ring-2 ring-amber-400/20"
            : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50",
          className,
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="min-w-0 truncate text-stone-700">
          {selected?.label || placeholder}
        </span>

        <ChevronDown
          className={cn(
            "h-4.5 w-4.5 shrink-0 text-stone-400 transition-all duration-200",
            "group-hover:text-stone-600",
            open && "rotate-180 text-amber-500",
          )}
        />
      </button>

      {open && (
        <div
          className={cn(
            "fixed z-[200] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.18)]",
            menuClassName,
          )}
          style={{
            top: menuPosition.top,
            bottom: menuPosition.bottom,
            left: menuPosition.left,
            width: menuPosition.width,
          }}
        >
          <div className="max-h-72 overflow-y-auto py-2">
            {options.map((opt) => {
              const isSelected = String(opt.value) === String(value);

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors duration-150",
                    isSelected
                      ? "bg-amber-50 text-amber-700"
                      : "text-stone-700 hover:bg-stone-50",
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
                    <Check className="h-4 w-4 shrink-0 text-amber-600" />
                  )}
                </button>
              );
            })}
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
        <label className="text-sm font-medium text-stone-700">{label}</label>
        {hint && <span className="text-xs text-stone-500">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-stone-200/60", className)}
      aria-hidden="true"
    />
  );
}

function StudioSettingsSkeleton() {
  return (
    <div className="mx-auto max-w-6xl min-h-[100svh]">
      <div className="mb-6">
        <div className="space-y-3">
          <SkeletonBlock className="h-8 w-56 rounded-2xl" />
          <SkeletonBlock className="h-5 w-80 max-w-full" />
        </div>

        <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-2 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 gap-2 overflow-x-auto">
              <SkeletonBlock className="h-10 w-24 shrink-0 rounded-xl" />
              <SkeletonBlock className="h-10 w-24 shrink-0 rounded-xl" />
              <SkeletonBlock className="h-10 w-28 shrink-0 rounded-xl" />
            </div>

            <SkeletonBlock className="h-12 w-[220px] shrink-0 rounded-2xl" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-5">
          <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-[0_4px_24px_-4px_rgba(120,90,60,0.08)]">
            <div className="relative h-44 bg-stone-50">
              <SkeletonBlock className="h-full w-full rounded-none" />

              <div className="absolute -bottom-10 left-3 right-3 flex items-end gap-2">
                <SkeletonBlock className="h-20 w-20 shrink-0 rounded-[22px]" />

                <div className="min-w-0 flex-1 rounded-2xl border border-stone-200 bg-white px-3 py-2 shadow-sm">
                  <SkeletonBlock className="h-5 w-40 max-w-full" />
                  <SkeletonBlock className="mt-2 h-4 w-32 max-w-full" />
                </div>
              </div>
            </div>

            <div className="px-3 pb-3 pt-14">
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
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
        </div>

        {/* Right column */}
        <div className="space-y-6 lg:col-span-7">
          <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-[0_4px_24px_-4px_rgba(120,90,60,0.08)]">
            <div className="border-b border-stone-100 px-5 py-4">
              <SkeletonBlock className="h-6 w-28" />
              <SkeletonBlock className="mt-2 h-4 w-80 max-w-full" />
            </div>

            <div className="px-5 py-5">
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

                  <div className="mt-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                    <SkeletonBlock className="h-3 w-24" />
                    <SkeletonBlock className="mt-2 h-4 w-full" />
                    <SkeletonBlock className="mt-1 h-4 w-5/6" />
                    <SkeletonBlock className="mt-1 h-4 w-3/4" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-[60] md:hidden">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/95 to-transparent" />
        <div className="relative mx-auto max-w-5xl px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="flex gap-2">
            <SkeletonBlock className="h-12 w-1/2 rounded-2xl" />
            <SkeletonBlock className="h-12 w-1/2 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

function completeness(form) {
  const hasCover = Boolean(form.coverFile || form.coverUrl?.trim());
  const hasLogo = Boolean(form.logoFile || form.logoUrl?.trim());

  const portfolioCount =
    (form.portfolioUrls?.length || 0) + (form.portfolioFiles?.length || 0);

  const items = [
    {
      key: "name",
      label: "Назва студії",
      ok: Boolean(form.name?.trim()),
    },
    {
      key: "category",
      label: "Категорія",
      ok: Boolean(form.category),
    },
    {
      key: "phone",
      label: "Номер телефону",
      ok: Boolean(form.phone?.trim()),
    },
    {
      key: "email",
      label: "Пошта",
      ok: Boolean(form.email?.trim()),
    },
    {
      key: "description",
      label: "Опис",
      ok: Boolean(form.description?.trim()),
    },
    {
      key: "coverUrl",
      label: "Обкладинка",
      ok: hasCover,
    },
    {
      key: "logoUrl",
      label: "Логотип",
      ok: hasLogo,
    },
    {
      key: "address",
      label: "Адреса",
      ok: Boolean(
        form.city?.trim() && form.street?.trim() && form.building?.trim(),
      ),
    },
    {
      key: "portfolio",
      label: "Портфоліо",
      ok: portfolioCount >= 1,
    },
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

  const [tab, setTab] = useState(initialTab);

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
      ? "ring-2 ring-emerald-300/70 bg-emerald-50 border-emerald-200"
      : "ring-2 ring-amber-400/20 bg-amber-50 border-amber-200";

  const baseFieldClass =
    "w-full rounded-2xl border border-stone-200 bg-white p-3 text-sm font-medium text-stone-700 outline-none transition-all duration-200 placeholder:text-stone-400 hover:bg-stone-50 hover:border-stone-300 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 focus:bg-white";

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
    const duration = 3000;

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

  const [portfolioPreview, setPortfolioPreview] = useState({
    open: false,
    src: "",
  });

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
      JSON.stringify(currentPortfolio) !==
        JSON.stringify(form.portfolioUrls || []) ||
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
      portfolioUrls: Array.isArray(studio?.portfolioUrls)
        ? studio.portfolioUrls
        : [],
      coverFile: null,
      logoFile: null,
      portfolioFiles: [],
    });
  }

  const dirty = hydrated ? rawDirty : false;
  const hasPendingChanges = dirty;
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

    if (fieldKey === "coverUrl") {
      setForm((p) => ({ ...p, coverFile: file }));
    } else {
      setForm((p) => ({ ...p, logoFile: file }));
    }
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

    setForm((prev) => ({
      ...prev,
      portfolioFiles: [...(prev.portfolioFiles || []), ...okFiles].slice(
        0,
        MAX_PORTFOLIO,
      ),
    }));

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

    setForm((p) => ({
      ...p,
      portfolioUrls: nextUrls.slice(0, MAX_PORTFOLIO),
      portfolioFiles: nextFiles.slice(0, MAX_PORTFOLIO),
    }));
  }

  function removePortfolioMixed(idx) {
    const remoteCount = form.portfolioUrls?.length || 0;

    if (idx < remoteCount) {
      const key = form.portfolioUrls[idx];
      if (!key) return;

      stageDelete(key);

      setForm((p) => ({
        ...p,
        portfolioUrls: (p.portfolioUrls || []).filter((_, i) => i !== idx),
      }));

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
      portfolioFiles: (p.portfolioFiles || []).filter(
        (_, i) => i !== localIndex,
      ),
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

  async function save(e) {
    e?.preventDefault?.();
    if (!canSave) return;
    if (!studio?.id) return;

    setSaving(true);

    try {
      const token = localStorage.getItem("token");

      let nextCoverKey = form.coverUrl || "";
      let nextLogoKey = form.logoUrl || "";
      let nextPortfolioKeys = Array.isArray(form.portfolioUrls)
        ? [...form.portfolioUrls]
        : [];

      const deletesAfterSave = [...pendingDeletes];

      if (form.coverFile) {
        const out = await uploadOne(studio.id, form.coverFile, "cover", token);
        nextCoverKey = out.key;

        if (form.coverUrl && form.coverUrl !== out.key) {
          deletesAfterSave.push(form.coverUrl);
        }
      }

      if (form.logoFile) {
        const out = await uploadOne(studio.id, form.logoFile, "logo", token);
        nextLogoKey = out.key;

        if (form.logoUrl && form.logoUrl !== out.key) {
          deletesAfterSave.push(form.logoUrl);
        }
      }

      if ((form.portfolioFiles?.length || 0) > 0) {
        const out = await uploadMany(studio.id, form.portfolioFiles, token);
        const newKeys = out.keys || [];
        nextPortfolioKeys = [...nextPortfolioKeys, ...newKeys].slice(
          0,
          MAX_PORTFOLIO,
        );
      }

      await updateStudio({
        name: form.name.trim(),
        category: form.category,
        phone: form.phone.trim(),
        email: form.email.trim(),
        description: form.description.trim(),
        city: form.city.trim(),
        street: form.street.trim(),
        building: form.building.trim(),
        apartment: form.apartment.trim(),
        coverUrl: nextCoverKey,
        logoUrl: nextLogoKey,
        portfolioUrls: nextPortfolioKeys,
      });

      setForm((p) => ({
        ...p,
        coverUrl: nextCoverKey,
        logoUrl: nextLogoKey,
        portfolioUrls: nextPortfolioKeys,
        coverFile: null,
        logoFile: null,
        portfolioFiles: [],
      }));

      setPendingDeletes([]);

      const uniq = Array.from(new Set(deletesAfterSave)).filter(Boolean);
      if (uniq.length) {
        try {
          await deleteManyFromR2(uniq);
        } catch (err) {
          console.error(err);
          showToast({
            type: "warning",
            title: "Збережено, але…",
            text: "Не всі файли видалено.",
          });
        }
      }

      showToast({
        type: "success",
        title: "Профіль оновлено",
        text: "Зміни збережено.",
      });
    } catch (error) {
      console.error(error);

      const rawMessage = String(error?.message || "").toLowerCase();

      const isOffline =
        !navigator.onLine ||
        rawMessage.includes("failed to fetch") ||
        rawMessage.includes("networkerror") ||
        rawMessage.includes("network error") ||
        rawMessage.includes("load failed") ||
        rawMessage.includes("fetch");

      showToast({
        type: "error",
        title: isOffline ? "Немає інтернету" : "Не вдалося зберегти",
        text: isOffline ? "Перевірте підключення." : "Спробуйте ще раз.",
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
    portfolio: "studio-field-portfolio-add",
    coverUrl: "studio-field-coverUrl",
    logoUrl: "studio-field-logoUrl",
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

    const nextTab = resolveTabByKey(key);
    setTabUrl(nextTab);

    if (key === "portfolio") {
      setTabUrl("links");

      requestAnimationFrame(() => {
        setTimeout(() => {
          document.getElementById("studio-field-portfolio")?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });

          setHighlightId("studio-field-portfolio-add");
          window.setTimeout(() => setHighlightId(""), 2800);
        }, 140);
      });

      return;
    }

    if (key === "coverUrl") {
      setTabUrl("profile");
      requestAnimationFrame(() => {
        document.getElementById("studio-field-coverUrl")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        setHighlightId("studio-field-coverUrl");
        setTimeout(() => setHighlightId(""), 2800);
      });
      return;
    }

    if (key === "logoUrl") {
      setTabUrl("profile");
      requestAnimationFrame(() => {
        document.getElementById("studio-field-logoUrl")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        setHighlightId("studio-field-logoUrl");
        setTimeout(() => setHighlightId(""), 2800);
      });
      return;
    }

    if (key === "address") {
      requestAnimationFrame(() => {
        setTimeout(() => {
          highlightAddressFields();

          const cityEl = document.getElementById("studio-field-city");
          if (!cityEl) return;

          cityEl.scrollIntoView({ behavior: "smooth", block: "center" });
          cityEl.focus?.({ preventScroll: true });
        }, 140);
      });
      return;
    }

    const id = FIELD_ID[key];
    if (!id) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    requestAnimationFrame(() => {
      setTimeout(() => {
        const el = document.getElementById(id);
        if (!el) return;

        el.scrollIntoView({ behavior: "smooth", block: "center" });

        if (typeof el.focus === "function") {
          el.focus({ preventScroll: true });
        } else {
          const focusable = el.querySelector?.(
            "input, textarea, select, button",
          );
          focusable?.focus?.({ preventScroll: true });
        }

        setHighlightId(id);
        window.setTimeout(() => setHighlightId(""), 2800);
      }, 120);
    });
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

  const [menuOpen, setMenuOpen] = useState(false);

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

  if (initialLoading) {
    return <StudioSettingsSkeleton />;
  }

  const categoryLabel = form.category
    ? getCategoryLabel(form.category)
    : "Категорія";

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl min-h-[100svh]">
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

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-3">
            <div ref={headerTriggerRef} className="min-w-0 flex-1">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-3 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                  Профіль студії
                </span>
              </div>

              <h1 className="text-3xl font-black tracking-tight text-stone-800 sm:text-4xl lg:text-5xl">
                Профіль студії
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-stone-600 sm:text-base">
                Створіть профіль, який підвищує довіру та виглядає професійно.
              </p>
            </div>

            {/* ✅ ТІЛЬКИ якщо 100% */}
            {profile.percent === 100 && (
              <div className="shrink-0 rounded-2xl px-3 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-[0_10px_24px_rgba(16,185,129,0.18)]">
                <div className="flex items-center gap-2">
                  {/* ❌ ховаємо іконку на мобілці */}
                  <div className="hidden sm:flex h-7 w-7 items-center justify-center rounded-lg bg-white/20">
                    <Check className="h-4 w-4 text-white" />
                  </div>

                  <p className="text-[11px] font-bold leading-4">
                    Профіль заповнено
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-2 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* Tabs */}
              <div className="flex justify-center gap-2 overflow-x-auto">
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
                      "whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                      tab === t.id
                        ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white"
                        : "bg-white text-stone-600 hover:bg-stone-50",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* ❗ ТІЛЬКИ якщо <100% */}
              {profile.percent !== 100 && (
                <div className="flex shrink-0 items-center justify-between gap-3 rounded-2xl px-3 py-2 border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
                      <span className="absolute inline-flex h-3 w-3 rounded-full bg-orange-400 opacity-75 animate-ping" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-orange-500" />
                    </div>

                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">
                        Заповненість
                      </p>

                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-stone-800">
                          {profile.percent}%
                        </p>

                        <span className="text-xs text-stone-500">
                          {profile.done}/{profile.total}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={goToNextIncomplete}
                  >
                    Заповнити
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left column */}
          {tab === "profile" && (
            <div className="space-y-6 lg:col-span-5 lg:sticky lg:top-6 self-start">
              <section className="overflow-hidden rounded-3xl border border-stone-200/60 bg-white shadow-[0_4px_24px_-4px_rgba(120,90,60,0.08)]">
                <div
                  id="studio-field-coverUrl"
                  className={cn(
                    "relative h-44 bg-stone-100",
                    highlightId === "studio-field-coverUrl" && highlightClass,
                  )}
                >
                  {hasCover ? (
                    <button
                      type="button"
                      onClick={pickCoverFromPreview}
                      className="h-full w-full"
                    >
                      <img
                        src={coverSrc}
                        alt="Обкладинка"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          if (!coverPreviewUrl)
                            e.currentTarget.style.display = "none";
                        }}
                      />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={pickCoverFromPreview}
                      onKeyDown={onKeyboardPick(pickCoverFromPreview)}
                      className="flex h-full w-full items-center justify-center gap-2 px-6 text-center text-sm font-medium text-stone-500 transition hover:text-stone-700"
                      title="Завантажити обкладинку"
                    >
                      <Plus className="h-4 w-4" />
                      Додати обкладинку
                    </button>
                  )}

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />

                  {hasCover && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage("coverUrl");
                      }}
                      className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-xl border border-stone-200 bg-white/90 text-stone-600 shadow-sm backdrop-blur transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      title="Видалити обкладинку"
                      aria-label="Remove cover"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}

                  <div className="absolute -bottom-10 left-3 right-3 flex min-w-0 items-end gap-2">
                    <div
                      id="studio-field-logoUrl"
                      className={cn(
                        "relative h-20 w-20 shrink-0 overflow-hidden rounded-[22px] border border-stone-200 bg-white shadow-sm",
                        highlightId === "studio-field-logoUrl" &&
                          highlightClass,
                      )}
                    >
                      <button
                        type="button"
                        onClick={pickLogoFromPreview}
                        onKeyDown={onKeyboardPick(pickLogoFromPreview)}
                        className="h-full w-full"
                        title="Завантажити логотип"
                      >
                        {hasLogo ? (
                          <img
                            src={logoSrc}
                            alt="Лого"
                            className="h-full w-full object-cover"
                            onError={(e) =>
                              (e.currentTarget.style.display = "none")
                            }
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-stone-500">
                            + Лого
                          </div>
                        )}
                      </button>

                      {hasLogo && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage("logoUrl");
                          }}
                          className="absolute right-1 top-1 z-10 grid h-6 w-6 place-items-center rounded-lg border border-stone-200 bg-white/90 text-stone-600 shadow-sm backdrop-blur transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                          title="Видалити логотип"
                          aria-label="Remove logo"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="min-h-[44px] min-w-0 rounded-2xl border border-stone-200 bg-white px-3 py-2 shadow-sm">
                      <p
                        className="line-clamp-2 w-full min-w-0 break-words text-sm font-bold leading-5 text-stone-800 sm:text-base"
                        title={form.name.trim() ? form.name : "Назва студії"}
                      >
                        {form.name.trim() ? form.name : "Назва студії"}
                      </p>

                      <p
                        className="line-clamp-2 w-full min-w-0 break-words text-xs text-stone-500 sm:text-sm"
                        title={`${categoryLabel} • ${form.city.trim() ? form.city : "Місто"}`}
                      >
                        {categoryLabel +
                          " • " +
                          (form.city.trim() ? form.city : "Місто")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-3 pb-3 pt-14">
                  <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                    <p className="text-xs font-semibold text-stone-500">
                      Адреса
                    </p>
                    <p
                      className="mt-1 line-clamp-2 break-words text-sm font-semibold text-stone-800"
                      title={AddressLine}
                    >
                      {AddressLine}
                    </p>

                    <p className="mt-3 text-xs font-semibold text-stone-500">
                      Опис
                    </p>
                    <p className="mt-1 text-sm text-stone-600">
                      {form.description.trim()
                        ? form.description.trim()
                        : "Додай короткий опис: досвід, стиль, стерильність, бренди, гарантії."}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Right column */}
          <div
            className={cn(
              "space-y-6",
              tab === "profile" ? "lg:col-span-7" : "lg:col-span-12",
            )}
          >
            <form onSubmit={save} className="space-y-6 ">
              {tab === "profile" && (
                <SectionCard
                  title="Профіль"
                  subtitle="Назва, категорія та опис — ключові для довіри клієнтів."
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Назва студії" error={errors.name}>
                      <input
                        id="studio-field-name"
                        value={form.name}
                        onChange={(e) => setField("name", e.target.value)}
                        placeholder="Напр. PlanDay Studio"
                        className={fieldClass("studio-field-name")}
                      />
                    </Field>

                    <Field label="Категорія" error={errors.category}>
                      <CustomSelect
                        id="studio-field-category"
                        value={form.category}
                        onChange={(nextValue) =>
                          setField("category", nextValue)
                        }
                        placeholder="Оберіть категорію"
                        className={cn(
                          baseFieldClass,
                          "justify-between px-4 py-3",
                          highlightId === "studio-field-category"
                            ? highlightClass
                            : "",
                        )}
                        options={[
                          { value: "", label: "Оберіть категорію" },
                          ...STUDIO_CATEGORIES.map((cat) => ({
                            value: cat.value,
                            label: cat.label,
                          })),
                        ]}
                      />
                    </Field>

                    <Field label="Номер телефону" error={errors.phone}>
                      <input
                        id="studio-field-phone"
                        value={form.phone}
                        onChange={(e) => setField("phone", e.target.value)}
                        placeholder="+380 67 123 45 67"
                        inputMode="tel"
                        className={fieldClass("studio-field-phone")}
                      />
                    </Field>

                    <Field label="Пошта" error={errors.email}>
                      <input
                        id="studio-field-email"
                        type="email"
                        autoComplete="email"
                        value={form.email || ""}
                        onChange={(e) => setField("email", e.target.value)}
                        placeholder="name@email.com"
                        className={fieldClass("studio-field-email")}
                      />
                    </Field>

                    <div className="sm:col-span-2">
                      <Field
                        label="Опис"
                        hint={`${form.description.length}/${MAX_DESC}`}
                        error={errors.description}
                      >
                        <textarea
                          id="studio-field-description"
                          value={form.description}
                          onChange={(e) =>
                            setField("description", e.target.value)
                          }
                          rows={5}
                          placeholder="2–4 речення: розкажіть про себе: досвід, підхід до роботи та що робить ваш сервіс особливим."
                          className={fieldClass("studio-field-description")}
                        />
                      </Field>

                      <div className="mt-3 space-y-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                        <div>
                          <p className="text-xs font-semibold text-stone-500">
                            Рекомендація
                          </p>
                          <p className="mt-1 text-sm text-stone-600">
                            Детальний опис допомагає клієнтам краще зрозуміти
                            ваш досвід і підвищує ймовірність запису. Опишіть
                            свою спеціалізацію, підхід до роботи та ключові
                            переваги.
                          </p>
                        </div>

                        <div className="h-px bg-stone-200" />

                        <div>
                          <p className="text-xs font-semibold text-stone-500">
                            Що варто вказати:
                          </p>

                          <ul className="mt-1 space-y-1 text-sm text-stone-600">
                            <li>• Скільки років досвіду має студія</li>
                            <li>• Які послуги або техніки ви використовуєте</li>
                            <li>• Які бренди матеріалів застосовуєте</li>
                            <li>• Чим ви відрізняєтесь від інших</li>
                            <li>• Гарантії, стерильність або сертифікацію</li>
                          </ul>
                        </div>

                        <div className="rounded-2xl border border-stone-200 bg-white px-3 py-2">
                          <p className="text-xs text-stone-500">
                            💡 Студії з повним описом отримують більше
                            переглядів і записів.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              )}

              {tab === "location" && (
                <SectionCard
                  title="Локація"
                  subtitle="Адреса відображається клієнтам і впливає на пошук."
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Місто">
                      <input
                        id="studio-field-city"
                        value={form.city}
                        onChange={(e) => setField("city", e.target.value)}
                        placeholder="Київ"
                        className={fieldClass("studio-field-city")}
                      />
                    </Field>

                    <Field label="Вулиця">
                      <input
                        id="studio-field-street"
                        value={form.street}
                        onChange={(e) => setField("street", e.target.value)}
                        placeholder="Хрещатик"
                        className={fieldClass("studio-field-street")}
                      />
                    </Field>

                    <Field label="Будинок">
                      <input
                        id="studio-field-building"
                        value={form.building}
                        onChange={(e) => setField("building", e.target.value)}
                        placeholder="10"
                        className={fieldClass("studio-field-building")}
                      />
                    </Field>

                    <Field label="Квартира/Офіс">
                      <input
                        id="studio-field-apartment"
                        value={form.apartment}
                        onChange={(e) => setField("apartment", e.target.value)}
                        placeholder="23"
                        className={fieldClass("studio-field-apartment")}
                      />
                    </Field>

                    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 sm:col-span-2">
                      <p className="text-xs font-semibold text-stone-500">
                        Перевірка
                      </p>

                      <p
                        className="mt-1 line-clamp-2 break-words text-sm font-semibold text-stone-800"
                        title={AddressLine}
                      >
                        {AddressLine}
                      </p>
                    </div>
                  </div>
                </SectionCard>
              )}

              {tab === "links" && (
                <SectionCard
                  title="Портфоліо"
                  subtitle="Додай 4–12 фото робіт — це сильніше за будь-який текст."
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div id="studio-field-portfolio" className="sm:col-span-2">
                      <Field
                        label="Портфоліо (фото робіт)"
                        error={errors.portfolioUrls}
                        hint={`${portfolioCount}/${MAX_PORTFOLIO}`}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <label
                            id="studio-field-portfolio-add"
                            className={cn(
                              "inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-700 hover:to-emerald-800",
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
                              disabled={
                                !portfolioCount || clearingPortfolio || saving
                              }
                            >
                              {clearingPortfolio ? "Очищення..." : "Очистити"}
                            </Button>
                          )}
                        </div>

                        <div className="mt-4">
                          {!hasAnyPortfolio ? (
                            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-500">
                              Додай фото робіт — це найсильніший доказ якості.
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
                              {portfolioItems.map((item, idx) => {
                                const src = item.src;
                                const isFirst = idx === 0;
                                const isLast =
                                  idx === portfolioItems.length - 1;

                                return (
                                  <div key={item.key} className="relative">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setPortfolioPreview({ open: true, src })
                                      }
                                      className="group block w-full overflow-hidden rounded-[22px] border border-stone-200 bg-stone-100 transition hover:shadow-[0_10px_24px_rgba(93,64,55,0.10)]"
                                      style={{ aspectRatio: "1 / 1" }}
                                    >
                                      <img
                                        src={src}
                                        alt={`work ${idx + 1}`}
                                        className="h-full w-full object-cover"
                                      />

                                      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-2">
                                        <div className="absolute inset-x-0 bottom-0 h-16 rounded-b-2xl bg-gradient-to-t from-black/60 via-black/25 to-transparent" />

                                        <div className="pointer-events-auto relative flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                movePortfolioMixed(
                                                  idx,
                                                  idx - 1,
                                                );
                                              }}
                                              disabled={isFirst}
                                              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-stone-800 backdrop-blur-md shadow-sm ring-1 ring-black/5 transition-all hover:bg-white hover:shadow-md active:scale-95 disabled:opacity-30"
                                              title="Вліво"
                                              aria-label="Move left"
                                            >
                                              <ChevronLeft className="h-4 w-4" />
                                            </button>

                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                movePortfolioMixed(
                                                  idx,
                                                  idx + 1,
                                                );
                                              }}
                                              disabled={isLast}
                                              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-stone-800 backdrop-blur-md shadow-sm ring-1 ring-black/5 transition-all hover:bg-white hover:shadow-md active:scale-95 disabled:opacity-30"
                                              title="Вправо"
                                              aria-label="Move right"
                                            >
                                              <ChevronRight className="h-4 w-4" />
                                            </button>
                                          </div>

                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              removePortfolioMixed(idx);
                                            }}
                                            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-stone-700 backdrop-blur-md shadow-sm ring-1 ring-black/5 transition-all hover:bg-red-50 hover:text-red-600 hover:ring-red-200 hover:shadow-md active:scale-95"
                                            title="Видалити"
                                            aria-label="Remove"
                                          >
                                            <X className="h-4 w-4" />
                                          </button>
                                        </div>
                                      </div>
                                    </button>

                                    <div className="mt-1 text-center text-xs text-stone-500">
                                      #{idx + 1}
                                    </div>
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
              )}
            </form>
          </div>
        </div>

        {/* Toast */}
        <div
          className={cn(
            "fixed left-1/2 top-[calc(12px+env(safe-area-inset-top))] z-[90] w-[calc(100%-2rem)] max-w-[430px] -translate-x-1/2 transition-all duration-150 md:bottom-6 md:left-6 md:top-auto md:w-auto md:min-w-[300px] md:max-w-[360px] md:translate-x-0",
            toast.open
              ? "translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-2 opacity-0 md:translate-y-2",
          )}
          role="status"
          aria-live="polite"
        >
          <div
            className={cn(
              "relative overflow-hidden rounded-[24px] border bg-white/95 backdrop-blur-xl shadow-[0_18px_50px_rgba(93,64,55,0.16)]",
              toast.type === "success"
                ? "border-emerald-200 ring-1 ring-emerald-100"
                : toast.type === "warning"
                  ? "border-amber-200 ring-1 ring-amber-100"
                  : "border-red-200 ring-1 ring-red-100",
            )}
          >
            <div
              className={cn(
                "absolute inset-x-0 top-0 h-1",
                toast.type === "success"
                  ? "bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600"
                  : toast.type === "warning"
                    ? "bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500"
                    : "bg-gradient-to-r from-red-300 via-red-400 to-rose-500",
              )}
            />

            <div className="relative flex items-start gap-3 px-4 py-4 sm:px-5">
              <div
                className={cn(
                  "mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-[0_8px_22px_rgba(93,64,55,0.10)]",
                  toast.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : toast.type === "warning"
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-red-200 bg-red-50 text-red-600",
                )}
                aria-hidden="true"
              >
                {toast.type === "success" && <Check className="h-5 w-5" />}
                {toast.type === "warning" && <Camera className="h-5 w-5" />}
                {toast.type === "error" && <X className="h-5 w-5" />}
              </div>

              <div className="min-w-0 flex-1">
                <p className="mt-2 text-[15px] font-black leading-5 text-stone-800">
                  {toast.title}
                </p>
                <p className="mt-1 text-sm leading-5 text-stone-500">
                  {toast.text}
                </p>
              </div>
            </div>

            <div className="h-[3px] w-full bg-stone-100">
              <div
                key={toast.id}
                className={cn(
                  "h-full w-full origin-left",
                  toast.type === "success"
                    ? "bg-emerald-400"
                    : toast.type === "warning"
                      ? "bg-amber-400"
                      : "bg-red-400",
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
              to   { transform: scaleX(0); }
            }
          `}</style>
        </div>

        {/* Portfolio preview */}
        {portfolioPreview.open && (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-stone-900/55 p-4 backdrop-blur-[2px]"
            onClick={() => setPortfolioPreview({ open: false, src: "" })}
          >
            <div className="w-full max-w-3xl">
              <img
                src={portfolioPreview.src}
                alt="Portfolio preview"
                className="max-h-[80dvh] w-full rounded-2xl bg-black object-contain"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="mt-3 flex justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setPortfolioPreview({ open: false, src: "" })}
                >
                  Закрити
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Error modal */}
        {errorModal.open && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-stone-900/40 px-4">
            <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_24px_80px_rgba(93,64,55,0.18)]">
              <h3 className="text-lg font-bold text-stone-800">
                {errorModal.title}
              </h3>
              <p className="mt-2 text-sm text-stone-600">
                {errorModal.message}
              </p>
              <div className="mt-5 flex justify-end">
                <Button
                  variant="primary"
                  onClick={() =>
                    setErrorModal({ open: false, title: "", message: "" })
                  }
                >
                  Зрозуміло
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile bottom actions */}
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
            <div className="relative overflow-hidden rounded-[26px] border border-amber-200 bg-white/95 px-4 py-4 shadow-[0_24px_80px_rgba(31,42,34,0.18)] ring-1 ring-amber-100 backdrop-blur-xl">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />

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

        {/* Desktop bottom actions */}
        <div className="fixed bottom-6 left-1/2 z-[80] hidden -translate-x-1/2 md:block">
          <div
            className={cn(
              "relative overflow-hidden rounded-[28px] border border-amber-200 bg-white/95 px-5 py-4 shadow-[0_24px_80px_rgba(31,42,34,0.18)] ring-1 ring-amber-100 backdrop-blur-xl transition-all duration-300",
              hasPendingChanges
                ? "translate-y-0 scale-100 opacity-100"
                : "pointer-events-none translate-y-4 scale-[0.98] opacity-0",
            )}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />

            <div className="flex items-center gap-4">
              <div className="flex min-w-0 items-center gap-3 pr-2">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-amber-100 to-orange-100 shadow-[0_8px_20px_rgba(226,154,84,0.20)]">
                  <span className="absolute inline-flex h-3 w-3 rounded-full bg-orange-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-orange-500" />
                </div>

                <div className="min-w-0">
                  <p className="text-[17px] font-black leading-none text-stone-800">
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

        {/* Optional floating top save slot */}
        <div
          className={cn(
            "fixed right-4 top-4 z-[9999] transition-all duration-300",
            floatingVisible
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-2 opacity-0",
          )}
        />
      </div>
    </div>
  );
}
