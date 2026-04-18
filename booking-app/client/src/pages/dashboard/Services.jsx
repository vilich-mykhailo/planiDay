// Services.jsx
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useStudio } from "../../context/studio/useStudio";
import { Slider } from "../../components/ui/slider";
import {
  Clock,
  Plus,
  Pencil,
  Trash2,
  Users,
  Check,
  X,
  Sparkles,
  ChevronDown,
} from "lucide-react";

const UNCATEGORIZED_ID = "__uncategorized__";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function getMastersWord(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "майстер";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return "майстри";
  }
  return "майстрів";
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  if (h === 0) return `${m} хв`;
  if (m === 0) return `${h} год`;
  return `${h} год ${m} хв`;
}

/** ---- API helper (залишено логіку БД з другого коду) ---- */
async function api(path, { method = "GET", body, token } = {}) {
  const base = import.meta.env.VITE_API_URL;

  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }

  return data;
}

async function fetchServicesData(studioId) {
  if (!studioId) {
    return {
      serviceCategories: [],
      uncategorizedServices: [],
    };
  }

  const token = localStorage.getItem("token");

  const servicesData = await api(`/studio/${studioId}/services`, { token });

  return {
    serviceCategories: Array.isArray(servicesData?.serviceCategories)
      ? servicesData.serviceCategories
      : [],
    uncategorizedServices: Array.isArray(servicesData?.uncategorizedServices)
      ? servicesData.uncategorizedServices
      : [],
  };
}

async function fetchMastersData(studioId) {
  if (!studioId) {
    return [];
  }

  const token = localStorage.getItem("token");
  const mastersData = await api(`/studio/${studioId}/masters`, { token });

  return Array.isArray(mastersData?.masters) ? mastersData.masters : [];
}

function normalizeService(s) {
  const mastersArr = Array.isArray(s?.masters) ? s.masters.map(String) : [];
  const allMasters = s?.allMasters === true || mastersArr.length === 0;

  return {
    id: s?.id ?? crypto.randomUUID(),
    name: String(s?.name || "").trim(),
    duration: Number(s?.duration || 0) || 60,
    price: Number(s?.price ?? 0) || 0,
    allMasters,
    masters: allMasters ? [] : mastersArr,
  };
}

function MasterChip({ master, checked }) {
  const id = master.id ?? master.name;
  const name = master.name ?? String(id);
  const avatar = master.photoUrl || master.avatarUrl || master.image || "";

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border-2 border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs font-bold text-amber-700">
            {initials || "M"}
          </div>
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-stone-800">{name}</p>
        <p
          className={cn(
            "text-xs transition-colors",
            checked ? "text-emerald-600" : "text-stone-500",
          )}
        >
          {checked ? "Обрано" : "Доступний"}
        </p>
      </div>
    </div>
  );
}

function ServicesListSkeleton() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 3 }).map((_, i) => (
        <SectionCard
          key={i}
          title={<SkeletonBlock className="h-6 w-40" />}
          badge={<SkeletonBlock className="h-6 w-28 rounded-full" />}
          actions={{
            desktop: <SkeletonBlock className="h-11 w-36 rounded-2xl" />,
            mobileBottom: <SkeletonBlock className="h-11 w-full rounded-2xl" />,
          }}
        >
          <div className="space-y-3">
            <div className="rounded-2xl border border-stone-200 bg-white p-4">
              <SkeletonBlock className="h-5 w-44" />
              <div className="mt-3 flex flex-wrap gap-3">
                <SkeletonBlock className="h-4 w-20" />
                <SkeletonBlock className="h-4 w-16" />
                <SkeletonBlock className="h-4 w-24" />
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-4">
              <SkeletonBlock className="h-5 w-52" />
              <div className="mt-3 flex flex-wrap gap-3">
                <SkeletonBlock className="h-4 w-24" />
                <SkeletonBlock className="h-4 w-14" />
                <SkeletonBlock className="h-4 w-28" />
              </div>
            </div>
          </div>
        </SectionCard>
      ))}
    </div>
  );
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
        "group relative overflow-hidden rounded-3xl border border-stone-200/60 bg-white",
        "shadow-[0_4px_24px_-4px_rgba(120,90,60,0.08)] hover:shadow-[0_8px_32px_-4px_rgba(120,90,60,0.12)]",
        "transition-all duration-300",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-60" />

      <div className="border-b border-stone-100 px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="line-clamp-3 text-base font-bold leading-snug tracking-tight text-stone-800 sm:text-lg">
              {title}
            </h2>

            {badge && (
              <div className="mt-1.5">
                <span className="inline-flex max-w-full items-center rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700 sm:text-xs">
                  {badge}
                </span>
              </div>
            )}

            {subtitle && (
              <p className="mt-2 text-sm leading-5 text-stone-500">
                {subtitle}
              </p>
            )}
          </div>

          {/* desktop actions — як було раніше */}
          {actions?.desktop && (
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              {actions.desktop}
            </div>
          )}

          {/* mobile top actions — тільки іконки */}
          {actions?.mobileTop && (
            <div className="flex shrink-0 items-center gap-2 sm:hidden">
              {actions.mobileTop}
            </div>
          )}
        </div>

        {/* mobile bottom action — кнопка під категорією */}
        {actions?.mobileBottom && (
          <div className="mt-3 sm:hidden">{actions.mobileBottom}</div>
        )}
      </div>

      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function CustomSelect({ value, onChange, options, placeholder = "Оберіть" }) {
  const [open, setOpen] = useState(false);

  const selected = options.find((opt) => String(opt.value) === String(value));

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "flex w-full items-center justify-between rounded-2xl border bg-white px-4 py-3 text-left text-sm font-medium transition-all outline-none",
          open
            ? "border-amber-400 ring-4 ring-amber-400/10"
            : "border-stone-200 hover:border-stone-300",
        )}
      >
        <span className="truncate text-stone-800">
          {selected?.label || placeholder}
        </span>

        <ChevronDown
          className={cn(
            "h-5 w-5 flex-shrink-0 text-stone-400 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
            aria-label="Закрити список"
          />

          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.18)]">
            <div className="max-h-64 overflow-y-auto py-2">
              {options.map((opt) => {
                const isActive = String(opt.value) === String(value);

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors",
                      isActive
                        ? "bg-amber-50 text-amber-700"
                        : "text-stone-700 hover:bg-stone-50",
                    )}
                  >
                    <span className="truncate">{opt.label}</span>

                    {isActive && <Check className="h-4 w-4 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";

      const handleEscape = (e) => {
        if (e.key === "Escape") onClose?.();
      };

      document.addEventListener("keydown", handleEscape);

      return () => {
        document.body.style.overflow = "";
        document.removeEventListener("keydown", handleEscape);
      };
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-2xl",
  };

  const isSmall = size === "sm";

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-stone-900/40 p-3 backdrop-blur-sm sm:p-6"
      onClick={handleBackdropClick}
    >
      <div
        className={cn(
          "flex h-full w-full justify-center overflow-hidden",
          isSmall ? "items-center" : "items-center",
        )}
      >
        <div
          className={cn(
            "relative flex w-full flex-col overflow-hidden rounded-[26px] bg-white shadow-2xl",
            "animate-in fade-in-0 zoom-in-95 duration-200",
            sizeClasses[size],
            isSmall
              ? "max-h-[calc(100vh-24px)]"
              : "max-h-[calc(100vh-24px)] sm:max-h-[calc(100vh-48px)]",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-amber-50/80 to-transparent" />

          <div className="relative shrink-0 border-b border-stone-100 px-4 py-3 sm:px-5">
            <div className="relative flex items-center justify-center">
              <div className="min-w-0">
                <h3 className="text-center text-base font-bold uppercase text-amber-600 sm:text-lg">
                  {title}
                </h3>

                {subtitle && (
                  <p className="mx-auto mt-1 max-w-[260px] text-center text-sm text-stone-500">
                    {subtitle}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => onClose?.()}
                className="absolute right-0 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-xl text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 sm:h-9 sm:w-9"
                aria-label="Закрити"
              >
                <X className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            {children}
          </div>

          {footer && (
            <div className="shrink-0 border-t border-stone-100 bg-stone-50/50 px-4 py-3 sm:px-5">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
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
      "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:shadow-emerald-500/35 hover:from-emerald-700 hover:to-emerald-800",
    secondary:
      "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 hover:border-stone-300",
    danger:
      "bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 text-red-600 hover:from-red-100 hover:to-rose-100",
    ghost: "text-stone-600 hover:bg-stone-100",
  };

  const sizes = {
    sm: "px-3 py-2 text-xs rounded-xl",
    md: "px-4 py-2 text-sm rounded-2xl sm:px-4 sm:py-2.5",
    lg: "px-5 py-2.5 text-sm rounded-2xl sm:px-6 sm:py-3",
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
        "inline-flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 active:scale-95 sm:h-11 sm:w-11",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function DurationSlider({ value, onChange }) {
  const minVal = 5;
  const maxVal = 720;
  const step = 5;

  const presets = [
    { label: "30 хв", value: 30 },
    { label: "45 хв", value: 45 },
    { label: "1 год", value: 60 },
    { label: "1.5 год", value: 90 },
    { label: "2 год", value: 120 },
    { label: "3 год", value: 180 },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {/* блок з вибраним часом */}
        <div className="relative min-w-0">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 opacity-20 blur-xl" />
          <div className="relative flex h-full items-center justify-center gap-2 rounded-2xl border border-amber-200/50 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 sm:gap-3 sm:px-6 sm:py-3">
            <Clock className="h-4.5 w-4.5 flex-shrink-0 text-amber-600 sm:h-5 sm:w-5" />
            <span className="truncate text-center text-lg font-bold text-stone-800 sm:text-2xl">
              {formatDuration(value)}
            </span>
          </div>
        </div>

        {/* блок +/- */}
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-2.5 py-2 sm:gap-3 sm:px-3">
          <button
            type="button"
            onClick={() => onChange(Math.max(minVal, value - 5))}
            disabled={value <= minVal}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-600 transition-all hover:bg-stone-200 disabled:opacity-40 sm:h-10 sm:w-10"
          >
            <span className="text-lg font-bold">−</span>
          </button>

          <span className="text-xs text-stone-500 sm:text-sm">±5 хв</span>

          <button
            type="button"
            onClick={() => onChange(Math.min(maxVal, value + 5))}
            disabled={value >= maxVal}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-600 transition-all hover:bg-stone-200 disabled:opacity-40 sm:h-10 sm:w-10"
          >
            <span className="text-lg font-bold">+</span>
          </button>
        </div>
      </div>

      <div className="px-1 py-2 sm:px-2 sm:py-4">
        <Slider
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          min={minVal}
          max={maxVal}
          step={step}
          className="w-full"
        />

        <div className="mt-2 flex justify-between px-1">
          <span className="text-[11px] text-stone-400 sm:text-xs">5 хв</span>
          <span className="text-[11px] text-stone-400 sm:text-xs">6 год</span>
          <span className="text-[11px] text-stone-400 sm:text-xs">12 год</span>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {presets.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => onChange(preset.value)}
            className={cn(
              preset.value === 180 ? "hidden sm:inline-flex" : "inline-flex",
              "items-center justify-center rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200 sm:px-4 sm:text-sm",
              value === preset.value
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200",
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-stone-200/60", className)}
    />
  );
}
const EMPTY_ARRAY = [];
export default function Services() {
  const { studio } = useStudio();

const queryClient = useQueryClient();
const studioId = studio?.id ?? null;

const servicesQuery = useQuery({
  queryKey: ["services", studioId],
  queryFn: () => fetchServicesData(studioId),
  enabled: Boolean(studioId),
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
});

const mastersQuery = useQuery({
  queryKey: ["masters", studioId],
  queryFn: () => fetchMastersData(studioId),
  enabled: Boolean(studioId),
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
});



const serviceCategories = servicesQuery.data?.serviceCategories ?? EMPTY_ARRAY;
const uncategorizedServices =
  servicesQuery.data?.uncategorizedServices ?? EMPTY_ARRAY;
const masters = mastersQuery.data ?? EMPTY_ARRAY;

const blocks = useMemo(() => {
  const unc = {
    id: UNCATEGORIZED_ID,
    name: "Без категорії",
    services: uncategorizedServices.map(normalizeService),
    _virtual: true,
  };

  const cats = serviceCategories.map((c) => ({
    ...c,
    services: (c.services ?? EMPTY_ARRAY).map(normalizeService),
  }));

  return [unc, ...cats];
}, [serviceCategories, uncategorizedServices]);

const servicesLoading =
  servicesQuery.isLoading &&
  !servicesQuery.data;

const mastersLoading =
  mastersQuery.isLoading &&
  !mastersQuery.data;

  const [categoryModal, setCategoryModal] = useState({
    open: false,
    catId: null,
  });
  const [categoryDraftName, setCategoryDraftName] = useState("");

  const [serviceModal, setServiceModal] = useState({
    open: false,
    mode: "add",
    catId: UNCATEGORIZED_ID,
    serviceId: null,
  });

  const [serviceDraft, setServiceDraft] = useState({
    id: null,
    categoryId: UNCATEGORIZED_ID,
    name: "",
    duration: 60,
    price: "",
    allMasters: true,
    masters: [],
  });

async function refreshServices() {
  if (!studioId) return;

  await queryClient.invalidateQueries({
    queryKey: ["services", studioId],
    exact: true,
  });
}

async function refreshMasters() {
  if (!studioId) return;

  await queryClient.invalidateQueries({
    queryKey: ["masters", studioId],
    exact: true,
  });
}

useEffect(() => {
  if (!studioId) return;

  const handleFocusRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["studio-services", studioId] });
    queryClient.invalidateQueries({ queryKey: ["studio-masters", studioId] });
  };

  window.addEventListener("focus", handleFocusRefresh);

  return () => {
    window.removeEventListener("focus", handleFocusRefresh);
  };
}, [studioId, queryClient]);

  const [newCategoryName, setNewCategoryName] = useState("");

  function resolveServiceMastersText(service) {
    if (service.allMasters) return "всі майстри";

    const ids = Array.isArray(service.masters) ? service.masters : [];

    if (!ids.length) return "";

    if (ids.length === 1) {
      const m = masters.find((x) => String(x.id ?? x.name) === String(ids[0]));
      return m?.name || String(ids[0]);
    }

    return `${ids.length} ${getMastersWord(ids.length)}`;
  }

  function canSaveServiceDraft(d) {
    const nameOk = Boolean(String(d?.name || "").trim());
    const priceOk = Boolean(String(d?.price ?? "").trim());
    const mastersOk =
      d?.allMasters || (Array.isArray(d?.masters) && d.masters.length > 0);

    return nameOk && priceOk && mastersOk;
  }

  function getCategoryServices(catId) {
    if (catId === UNCATEGORIZED_ID) return uncategorizedServices;
    const cat = serviceCategories.find((c) => c.id === catId);
    return Array.isArray(cat?.services) ? cat.services : [];
  }

  async function addCategory() {
    const name = newCategoryName.trim();
    if (!name || !studio?.id) return;

    try {
      const token = localStorage.getItem("token");

      await api(`/studio/${studio.id}/categories`, {
        method: "POST",
        token,
        body: { name },
      });

      setNewCategoryName("");
      await refreshServices();
    } catch (e) {
      console.error(e);
      alert(e.message || "Не вдалося додати категорію");
    }
  }

  function openEditCategory(catId) {
    if (catId === UNCATEGORIZED_ID) return;

    const cat = serviceCategories.find((c) => c.id === catId);
    if (!cat) return;

    setCategoryDraftName(cat.name || "");
    setCategoryModal({ open: true, catId });
  }

  async function saveCategoryName() {
    const name = categoryDraftName.trim();
    if (!name || !categoryModal.catId) return;

    try {
      const token = localStorage.getItem("token");

      await api(`/media/categories/${categoryModal.catId}`, {
        method: "PATCH",
        token,
        body: { name },
      });

      setCategoryModal({ open: false, catId: null });
      setCategoryDraftName("");
      await refreshServices();
    } catch (e) {
      console.error(e);
      alert(e.message || "Не вдалося оновити категорію");
    }
  }

  async function deleteCategory(catId) {
    if (catId === UNCATEGORIZED_ID || !studio?.id) return;

    try {
      const token = localStorage.getItem("token");

      await api(`/media/studio/${studio.id}/categories/${catId}`, {
        method: "DELETE",
        token,
      });

      await refreshServices();
    } catch (e) {
      console.error(e);
      alert(e.message || "Не вдалося видалити категорію");
    }
  }

  function openAddService(catId) {
    setServiceModal({ open: true, mode: "add", catId, serviceId: null });
    setServiceDraft({
      id: null,
      categoryId: catId,
      name: "",
      duration: 60,
      price: "",
      allMasters: true,
      masters: [],
    });
  }

  function openEditService(catId, serviceId) {
    const list = getCategoryServices(catId);
    const original = list.find((s) => s.id === serviceId);
    if (!original) return;

    const masterIds = Array.isArray(original.masters)
      ? original.masters.map(String)
      : [];

    const allMastersFixed =
      Boolean(original.allMasters) || masterIds.length === 0;

    setServiceModal({ open: true, mode: "edit", catId, serviceId });
    setServiceDraft({
      id: original.id,
      categoryId: catId,
      name: original.name || "",
      duration: Number(original.duration || 60),
      price: String(original.price ?? ""),
      allMasters: allMastersFixed,
      masters: allMastersFixed ? [] : masterIds,
    });
  }

  function closeServiceModal() {
    setServiceModal({
      open: false,
      mode: "add",
      catId: UNCATEGORIZED_ID,
      serviceId: null,
    });

    setServiceDraft({
      id: null,
      categoryId: UNCATEGORIZED_ID,
      name: "",
      duration: 60,
      price: "",
      allMasters: true,
      masters: [],
    });
  }

  async function saveService() {
    if (!studio?.id) return;

    const token = localStorage.getItem("token");

    const payload = {
      categoryId:
        serviceDraft.categoryId === UNCATEGORIZED_ID
          ? null
          : serviceDraft.categoryId,
      name: String(serviceDraft.name || "").trim(),
      duration: Number(serviceDraft.duration || 60),
      price: Number(serviceDraft.price || 0),
      allMasters: Boolean(serviceDraft.allMasters),
      masters: serviceDraft.allMasters
        ? []
        : (serviceDraft.masters || []).map(String),
    };

    try {
      if (serviceModal.mode === "add") {
        await api(`/studio/${studio.id}/services`, {
          method: "POST",
          token,
          body: { service: payload },
        });
      } else {
        await api(`/studio/services/${serviceDraft.id}`, {
          method: "PATCH",
          token,
          body: { service: payload },
        });
      }

      closeServiceModal();
     await refreshServices();
    } catch (e) {
      console.error(e);
      alert(e.message || "Не вдалося зберегти послугу");
    }
  }

  async function deleteService(catId, serviceId) {
    try {
      const token = localStorage.getItem("token");

      await api(`/studio/services/${serviceId}`, {
        method: "DELETE",
        token,
      });

      await refreshServices();
    } catch (e) {
      console.error(e);
      alert(e.message || "Не вдалося видалити послугу");
    }
  }

  const totalServices = blocks.reduce(
    (acc, b) => acc + (b.services?.length || 0),
    0,
  );
  const showTips = totalServices === 0;
  const isModalOpen = categoryModal.open || serviceModal.open;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl">
        {!isModalOpen && (
          <div className="relative mb-6 overflow-hidden rounded-3xl border border-stone-200/60 bg-white p-5 sm:p-6 shadow-[0_4px_24px_-4px_rgba(120,90,60,0.08)]">
            {/* top accent */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-60" />

            <div className="relative">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-3 py-1.5">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700">
                  Меню студії
                </span>
              </div>

              <h1 className="text-3xl font-black tracking-tight text-stone-800 sm:text-4xl">
                Послуги
              </h1>

              <p className="mt-2 max-w-xl text-sm text-stone-600 sm:text-base">
                Налаштуйте категорії та послуги — саме так їх бачитимуть клієнти
                під час онлайн-запису.
              </p>
            </div>
          </div>
        )}

        <SectionCard
          title="Нова категорія"
          subtitle="Згрупуйте схожі послуги (наприклад: Вії, Нігті, Брови)"
          className="mb-6"
        >
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Введіть назву категорії..."
              className="flex-1 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm font-medium text-stone-800 outline-none transition-all placeholder:text-stone-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 sm:rounded-2xl sm:px-4 sm:py-3"
              onKeyDown={(e) => e.key === "Enter" && addCategory()}
            />

            <Button
              variant="primary"
              onClick={addCategory}
              disabled={!newCategoryName.trim() || !studio?.id}
              className="whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Додати
            </Button>
          </div>
        </SectionCard>

        <div className="space-y-5">
          {servicesLoading ? (
            <ServicesListSkeleton />
          ) : (
            <div className="space-y-5">
              {blocks.map((cat) => {
                const isUnc = cat.id === UNCATEGORIZED_ID;
                const servicesCount = cat.services?.length || 0;

                return (
                  <SectionCard
                    key={cat.id}
                    title={cat.name}
                    badge={`К-ть послуг: ${servicesCount}`}
                    actions={{
                      desktop: (
                        <>
                          <Button
                            variant="primary"
                            size="md"
                            onClick={() => openAddService(cat.id)}
                          >
                            <Plus className="h-4 w-4" />
                            Додати послугу
                          </Button>

                          {!isUnc && (
                            <>
                              <IconButton
                                onClick={() => openEditCategory(cat.id)}
                                title="Редагувати"
                                className="h-[42px] w-[42px] shrink-0"
                              >
                                <Pencil className="h-4 w-4" />
                              </IconButton>

                              <IconButton
                                variant="danger"
                                onClick={() => deleteCategory(cat.id)}
                                title="Видалити"
                                className="h-[42px] w-[42px] shrink-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </IconButton>
                            </>
                          )}
                        </>
                      ),

                      mobileTop: !isUnc ? (
                        <>
                          <IconButton
                            onClick={() => openEditCategory(cat.id)}
                            title="Редагувати"
                            className="h-[42px] w-[42px] shrink-0"
                          >
                            <Pencil className="h-4 w-4" />
                          </IconButton>

                          <IconButton
                            variant="danger"
                            onClick={() => deleteCategory(cat.id)}
                            title="Видалити"
                            className="h-[42px] w-[42px] shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </IconButton>
                        </>
                      ) : null,

                      mobileBottom: (
                        <Button
                          variant="primary"
                          size="md"
                          onClick={() => openAddService(cat.id)}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4" />
                          Додати послугу
                        </Button>
                      ),
                    }}
                  >
                    {servicesCount === 0 ? (
                      <div className="rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/50 p-6 text-center sm:p-8">
                        <p className="text-sm text-stone-500">
                          Тут ще немає послуг
                        </p>
                        <p className="mt-1 text-xs text-stone-400">
                          Натисніть "Додати послугу" щоб створити
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {cat.services.map((srv) => (
                          <div
                            key={srv.id}
                            className="group/service rounded-2xl border border-stone-200 bg-white p-3.5 transition-all hover:border-amber-200 hover:shadow-md hover:shadow-amber-500/5 sm:p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <h3 className="line-clamp-2 break-words text-sm font-semibold text-stone-800 sm:text-base">
                                  {srv.name}
                                </h3>

                                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 sm:text-sm">
                                  <span className="inline-flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {formatDuration(srv.duration)}
                                  </span>

                                  <span className="font-semibold text-stone-700">
                                    {srv.price} грн
                                  </span>

                                  <span className="inline-flex items-center gap-1">
                                    <Users className="h-3.5 w-3.5" />
                                    {resolveServiceMastersText(srv)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex shrink-0 items-center gap-2">
                                <IconButton
                                  onClick={() =>
                                    openEditService(cat.id, srv.id)
                                  }
                                  title="Редагувати"
                                  className="h-11 w-11"
                                >
                                  <Pencil className="h-4 w-4" />
                                </IconButton>

                                <IconButton
                                  variant="danger"
                                  onClick={() => deleteService(cat.id, srv.id)}
                                  title="Видалити"
                                  className="h-11 w-11"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </IconButton>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </SectionCard>
                );
              })}
            </div>
          )}
        </div>

        {showTips && (
          <div className="mt-8 rounded-3xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-orange-50 p-6">
            <h2 className="mb-3 text-lg font-bold text-stone-800">
              💡 Як організувати послуги
            </h2>

            <ul className="space-y-2 text-sm text-stone-600">
              <li>
                • Створіть <strong>категорії</strong> для групування схожих
                послуг
              </li>
              <li>• Наприклад: "Вії", "Брови", "Манікюр"</li>
              <li>• Послуги без категорії відображаються окремим блоком</li>
            </ul>
          </div>
        )}
      </div>

      <Modal
        open={categoryModal.open}
        onClose={() => setCategoryModal({ open: false, catId: null })}
        title="Редагування категорії"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setCategoryModal({ open: false, catId: null })}
            >
              Скасувати
            </Button>

            <Button
              variant="primary"
              onClick={saveCategoryName}
              disabled={!categoryDraftName.trim()}
            >
              <Check className="h-4 w-4" />
              Зберегти
            </Button>
          </div>
        }
      >
        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">
            Назва категорії
          </label>

          <input
            value={categoryDraftName}
            onChange={(e) => setCategoryDraftName(e.target.value)}
            className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm text-sm font-medium text-stone-800 outline-none transition-all placeholder:text-stone-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10"
            placeholder="Введіть назву..."
          />
        </div>
      </Modal>

      <Modal
        open={serviceModal.open}
        onClose={closeServiceModal}
        title={
          serviceModal.mode === "add" ? "Нова послуга" : "Редагування послуги"
        }
        subtitle="Заповніть деталі послуги"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeServiceModal}>
              Скасувати
            </Button>

            <Button
              variant="primary"
              onClick={saveService}
              disabled={!canSaveServiceDraft(serviceDraft)}
            >
              <Check className="h-4 w-4" />
              Зберегти
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-[1fr_130px] gap-3 sm:grid-cols-2">
            <div className="min-w-0">
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Категорія
              </label>

              <CustomSelect
                value={serviceDraft.categoryId || UNCATEGORIZED_ID}
                onChange={(nextValue) =>
                  setServiceDraft((p) => ({ ...p, categoryId: nextValue }))
                }
                options={[
                  { value: UNCATEGORIZED_ID, label: "Без категорії" },
                  ...serviceCategories.map((c) => ({
                    value: c.id,
                    label: c.name,
                  })),
                ]}
              />
            </div>

            <div className="min-w-0">
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Ціна (грн) *
              </label>

              <input
                type="number"
                value={serviceDraft.price}
                onChange={(e) =>
                  setServiceDraft((p) => ({ ...p, price: e.target.value }))
                }
                placeholder="0"
                min="0"
                className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm font-medium text-stone-800 outline-none transition-all placeholder:text-stone-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700">
              Назва послуги *
            </label>

            <input
              value={serviceDraft.name}
              onChange={(e) =>
                setServiceDraft((p) => ({ ...p, name: e.target.value }))
              }
              placeholder="Наприклад: Нарощування вій"
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm font-medium text-stone-800 outline-none transition-all placeholder:text-stone-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 sm:rounded-2xl sm:px-4 sm:py-3"
            />
          </div>

          <div>
            <label className="mb-4 block text-sm font-medium text-stone-700">
              Тривалість
            </label>

            <DurationSlider
              value={serviceDraft.duration}
              onChange={(v) => setServiceDraft((p) => ({ ...p, duration: v }))}
            />
          </div>

          <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-3.5 sm:p-4">
            {" "}
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-stone-600" />
              <span className="font-medium text-stone-800">Виконавці</span>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setServiceDraft((p) => ({
                    ...p,
                    allMasters: true,
                    masters: [],
                  }))
                }
                className={cn(
                  "rounded-xl px-3 py-2 text-sm font-medium transition-all sm:px-4",
                  serviceDraft.allMasters
                    ? "border-2 border-emerald-300 bg-emerald-100 text-emerald-700"
                    : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50",
                )}
              >
                Всі майстри
              </button>

              <button
                type="button"
                onClick={() =>
                  setServiceDraft((p) => ({
                    ...p,
                    allMasters: false,
                    masters: [],
                  }))
                }
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-medium transition-all",
                  !serviceDraft.allMasters
                    ? "border-2 border-emerald-300 bg-emerald-100 text-emerald-700"
                    : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50",
                )}
              >
                Обрати майстрів
              </button>
            </div>
            {!serviceDraft.allMasters && (
              <div className="space-y-2">
                {mastersLoading ? (
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="rounded-2xl border border-stone-200 bg-white p-3"
                      >
                        <div className="flex items-center gap-3">
                          <SkeletonBlock className="h-4 w-4 rounded" />
                          <SkeletonBlock className="h-10 w-10 rounded-full" />
                          <div className="min-w-0 flex-1">
                            <SkeletonBlock className="h-4 w-28" />
                            <SkeletonBlock className="mt-2 h-3 w-16" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : masters.length === 0 ? (
                  <p className="text-sm text-stone-500">
                    Спочатку додайте майстрів
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {masters.map((m) => {
                      const id = String(m.id ?? m.name);
                      const checked = (serviceDraft.masters || []).includes(id);

                      return (
                        <label
                          key={id}
                          className={cn(
                            "flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-all",
                            checked
                              ? "border-emerald-300 bg-emerald-50"
                              : "border-stone-200 bg-white hover:bg-stone-50",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const current = serviceDraft.masters || [];
                              const next = e.target.checked
                                ? [...current, id]
                                : current.filter((x) => x !== id);

                              setServiceDraft((p) => ({ ...p, masters: next }));
                            }}
                            className="h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                          />

                          <MasterChip master={m} checked={checked} />
                        </label>
                      );
                    })}
                  </div>
                )}

                {!mastersLoading && (serviceDraft.masters || []).length > 0 && (
                  <p className="mt-2 text-xs text-stone-500">
                    Обрано:{" "}
                    <span className="font-semibold text-stone-700">
                      {(serviceDraft.masters || []).length}
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
