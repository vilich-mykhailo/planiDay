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
  Banknote,
  BriefcaseBusiness,
  Scissors,
} from "lucide-react";

const UNCATEGORIZED_ID = "__uncategorized__";
const EMPTY_ARRAY = [];

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
      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border-2 border-white bg-[#fff1e8] shadow-sm">
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
          <div className="grid h-full w-full place-items-center text-xs font-black text-[#ff5a00]">
            {initials || "M"}
          </div>
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-black text-[#202020]">
          {name}
        </p>
        <p
          className={cn(
            "text-xs transition-colors",
            checked ? "text-[#202020]" : "text-[#77716b]",
          )}
        >
          {checked ? "Обрано" : "Доступний"}
        </p>
      </div>
    </div>
  );
}

function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-[#f2eee8]", className)}
    />
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
            <div className="rounded-2xl border border-[#eadbc9] bg-white p-4">
              <SkeletonBlock className="h-5 w-44" />
              <div className="mt-3 flex flex-wrap gap-3">
                <SkeletonBlock className="h-4 w-20" />
                <SkeletonBlock className="h-4 w-16" />
                <SkeletonBlock className="h-4 w-24" />
              </div>
            </div>

            <div className="rounded-2xl border border-[#eadbc9] bg-white p-4">
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
        "group relative overflow-hidden rounded-[32px] border border-[#ebe7df] bg-white shadow-[0_14px_44px_rgba(15,23,42,0.05)] transition-all duration-300 hover:shadow-[0_20px_60px_rgba(15,23,42,0.08)]",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#ff7a18] via-[#ff6200] to-[#ff8c42]" />

      <div className="border-b border-[#f1ece5] px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="line-clamp-3 text-base font-black leading-snug tracking-[-0.03em] text-[#202020] sm:text-lg">
              {title}
            </h2>

            {badge && (
              <div className="mt-1.5">
                <span className="inline-flex max-w-full items-center rounded-full bg-[#fff4ec] px-2.5 py-1 text-[11px] font-black text-[#ff6200] sm:text-xs">
                  {badge}
                </span>
              </div>
            )}

            {subtitle && (
              <p className="mt-2 text-sm font-medium leading-5 text-[#7b766f]">
                {subtitle}
              </p>
            )}
          </div>

          {actions?.desktop && (
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              {actions.desktop}
            </div>
          )}

          {actions?.mobileTop && (
            <div className="flex shrink-0 items-center gap-2 sm:hidden">
              {actions.mobileTop}
            </div>
          )}
        </div>

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
            ? "border-[#ff5a00] ring-4 ring-[#ff5a00]/10"
            : "border-[#eadbc9] hover:border-[#ffd6bd] hover:bg-[#fff7f0]",
        )}
      >
        <span className="truncate text-[#202020]">
          {selected?.label || placeholder}
        </span>

        <ChevronDown
          className={cn(
            "h-5 w-5 flex-shrink-0 text-[#ff5a00] transition-transform duration-200",
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

          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-[#eadbc9] bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.18)]">
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
                        ? "bg-[#fff1e8] text-[#ff5a00]"
                        : "text-[#202020] hover:bg-[#fff7f0]",
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
    md: "max-w-lg",
    lg: "max-w-2xl",
  };

  return (
    <div
       className="fixed inset-0 z-[9999] flex items-stretch justify-center bg-[#202020]/45 p-0 backdrop-blur-[6px] sm:items-center sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="contents">
        <div
          className={cn(
           "flex h-dvh w-full flex-col overflow-hidden rounded-none border-0 bg-[#f7f5f1] shadow-[0_30px_90px_rgba(15,23,42,0.24)] sm:h-auto sm:max-h-[calc(100dvh-48px)] sm:rounded-[30px] sm:border sm:border-[#f0e2d3]",
            "animate-in fade-in-0 zoom-in-95 duration-200",
            sizeClasses[size],
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative shrink-0 overflow-hidden bg-[#f3eee7] px-5 py-5 sm:px-6 sm:py-6">
            <div className="absolute right-[-55px] top-[-70px] h-[180px] w-[180px] rounded-full bg-[#ff6200]/10 blur-3xl" />

            <div className="relative z-10 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[11px] font-black uppercase tracking-[0.08em] text-[#ff6200] shadow-[0_8px_20px_rgba(255,98,0,0.08)]">
                  <Pencil className="h-3.5 w-3.5" />
                  Редагування
                </span>

                <h3 className="mt-3 text-[26px] font-black leading-[0.95] tracking-[-0.05em] text-[#202020] sm:text-[32px]">
                  {title}
                </h3>

                {subtitle && (
                  <p className="mt-2 max-w-md text-sm font-medium leading-5 text-[#77716b]">
                    {subtitle}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => onClose?.()}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[#77716b] shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition hover:bg-[#fff3e9] hover:text-[#ff6200] active:scale-[0.96]"
                aria-label="Закрити"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-white px-5 py-5 sm:px-6">
            {children}
          </div>

          {footer && (
            <div className="shrink-0 border-t border-[#f0e7da] bg-[#fbfaf8] px-5 py-4 sm:px-6">
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
      "bg-[#ff5a00] text-white shadow-[0_16px_34px_rgba(255,90,0,0.24)] hover:bg-[#ef4f00]",
    secondary:
      "bg-white border border-[#eadbc9] text-[#202020] hover:bg-[#fff7f0] hover:border-[#ffd6bd]",
    danger:
      "border border-[#ffd6bd] bg-[#fff1e8] text-[#ff5a00] hover:border-[#ff5a00] hover:bg-[#ffe5d4]",
    ghost: "text-[#77716b] hover:bg-[#fff7f0]",
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
        "inline-flex items-center justify-center gap-2 font-black transition-all duration-200",
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
      "bg-white border border-[#eadbc9] text-[#77716b] hover:bg-[#fff7f0] hover:text-[#202020]",
    danger:
      "bg-white border border-[var(--color-danger-border)] text-[var(--color-danger-dark)] hover:bg-[var(--color-danger)] hover:text-white",
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
        <div className="relative min-w-0">
          <div className="absolute inset-0 rounded-2xl bg-[#ff5a00] opacity-20 blur-xl" />
          <div className="relative flex h-full items-center justify-center gap-2 rounded-2xl border border-[#eadbc9] bg-[#fff7f0] px-4 py-3 sm:gap-3 sm:px-6 sm:py-3">
            <Clock className="h-4.5 w-4.5 flex-shrink-0 text-[#202020] sm:h-5 sm:w-5" />
            <span className="truncate text-center text-lg font-bold text-[#202020] sm:text-2xl">
              {formatDuration(value)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#eadbc9] bg-white px-2.5 py-2 sm:gap-3 sm:px-3">
          <button
            type="button"
            onClick={() => onChange(Math.max(minVal, value - 5))}
            disabled={value <= minVal}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff7f0] text-[#77716b] transition-all hover:bg-[#ffe5d4] disabled:opacity-40 sm:h-10 sm:w-10"
          >
            <span className="text-lg font-bold">−</span>
          </button>

          <span className="text-xs text-[#77716b] sm:text-sm">
            ±5 хв
          </span>

          <button
            type="button"
            onClick={() => onChange(Math.min(maxVal, value + 5))}
            disabled={value >= maxVal}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff7f0] text-[#77716b] transition-all hover:bg-[#ffe5d4] disabled:opacity-40 sm:h-10 sm:w-10"
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
          <span className="text-[11px] text-[#77716b] sm:text-xs">
            5 хв
          </span>
          <span className="text-[11px] text-[#77716b] sm:text-xs">
            6 год
          </span>
          <span className="text-[11px] text-[#77716b] sm:text-xs">
            12 год
          </span>
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
              "items-center justify-center rounded-xl px-3 py-2 text-xs font-medium sm:px-4 sm:text-sm",
              value === preset.value
                ? "bg-[#ff5a00] text-white shadow-md"
                : "bg-[#fff7f0] text-[#77716b] hover:bg-[#ffe5d4]",
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function CategoryFilters({ value, onChange, categories }) {
  const items = [
    { id: "all", label: "Усі" },
    { id: UNCATEGORIZED_ID, label: "Без категорії" },
    ...categories.map((cat) => ({
      id: cat.id,
      label: cat.name,
    })),
  ];

  return (
    <div className="mb-6">
      <div className="no-scrollbar -mx-1 flex justify-center gap-2 overflow-x-auto px-1 pb-1">
        {items.map((item) => {
          const active = String(value) === String(item.id);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold border",
                active
                  ? "border-transparent bg-[#ff5a00] text-white shadow-md"
                  : "border-[#eadbc9] bg-white text-[#77716b] hover:border-[#ff5a00] hover:bg-[#fff7f0]",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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

  const servicesLoading = servicesQuery.isLoading && !servicesQuery.data;
  const mastersLoading = mastersQuery.isLoading && !mastersQuery.data;

  const [categoryModal, setCategoryModal] = useState({
    open: false,
    catId: null,
  });
  const [categoryDraftName, setCategoryDraftName] = useState("");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState("all");
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

  useEffect(() => {
    if (!studioId) return;

    const handleFocusRefresh = () => {
      queryClient.invalidateQueries({
        queryKey: ["studio-services", studioId],
      });
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

  const totalServices = blocks.reduce((acc, b) => acc + (b.services?.length || 0), 0);
  const showTips = totalServices === 0;
  const isModalOpen = categoryModal.open || serviceModal.open;

  const filteredBlocks = useMemo(() => {
    if (activeCategoryFilter === "all") return blocks;
    return blocks.filter(
      (block) => String(block.id) === String(activeCategoryFilter),
    );
  }, [blocks, activeCategoryFilter]);

  return (
    <div className="min-h-screen ">
<div className="mx-auto max-w-5xl space-y-6">
  {!isModalOpen && (
    <div className="relative mb-6 overflow-hidden rounded-[32px] border border-[#ebe7df] bg-white/95 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-7">
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#ff7a18] via-[#ff6200] to-[#ff8c42]" />

      <div className="relative">
        <h1 className="text-[40px] font-black leading-[0.95] tracking-tight text-[#202020] sm:text-6xl">
          Пос<span className="text-[#ff5a00]">луги</span>
        </h1>

        <p className="mt-3 max-w-[640px] text-[12px] font-semibold text-[#77716b] sm:text-[16px]">
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
              className="flex-1 rounded-xl border border-[#eadbc9] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#202020] outline-none transition-all placeholder:text-[#9b948c] hover:border-[#ffd6bd] hover:bg-[#fff7f0] focus:border-[#ff5a00] focus:ring-4 focus:ring-[#ff5a00]/10 sm:rounded-2xl sm:px-4 sm:py-3"
              onKeyDown={(e) => e.key === "Enter" && addCategory()}
            />

            <Button
              variant="primary"
              onClick={addCategory}
              disabled={!newCategoryName.trim() || !studio?.id}
              className="whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Додати категорію
            </Button>
          </div>
        </SectionCard>

        <CategoryFilters
          value={activeCategoryFilter}
          onChange={setActiveCategoryFilter}
          categories={serviceCategories}
        />

        <div className="space-y-5">
          {servicesLoading ? (
            <ServicesListSkeleton />
          ) : (
            <div className="space-y-5">
              {filteredBlocks.map((cat) => {
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
                      <div className="rounded-[24px] border-2 border-dashed border-[#ffd6bd] bg-[#fff7f0] p-6 text-center sm:p-8">
                        <div className="mb-3 flex items-center justify-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#ff5a00] shadow-sm">
                            <Scissors className="h-6 w-6" />
                          </div>
                        </div>

                        <p className="text-sm font-black text-[#202020]">
                          Тут ще немає послуг
                        </p>
                        <p className="mt-1 text-xs font-medium text-[#77716b]">
                          Натисніть "Додати послугу" щоб створити
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {cat.services.map((srv) => (
                          <div
                            key={srv.id}
                            className="group/service rounded-[24px] border border-[#eadbc9] bg-white p-3.5 shadow-[0_8px_24px_rgba(17,17,17,0.04)] transition-all hover:-translate-y-0.5 hover:border-[#ffd6bd] hover:shadow-[0_18px_44px_rgba(255,90,0,0.10)] sm:p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <h3 className="line-clamp-2 break-words text-sm font-black text-[#202020] sm:text-base">
                                  {srv.name}
                                </h3>

                                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-[#77716b] sm:text-sm">
                                  <span className="inline-flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {formatDuration(srv.duration)}
                                  </span>

                                  <span className="inline-flex items-center gap-1 font-black text-[#202020]">
                                    <Banknote className="h-3.5 w-3.5" />
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
                                  onClick={() => openEditService(cat.id, srv.id)}
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
          <div className="mt-8 rounded-[28px] border border-[#ffd6bd] bg-[#fff1e8] p-6">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-[#202020]">
              <Sparkles className="h-5 w-5 text-[#ff5a00]" />
              Як організувати послуги
            </h2>

            <ul className="space-y-2 text-sm font-medium leading-relaxed text-[#77716b]">
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
          <div className="flex w-full flex-row gap-2 sm:justify-end">
            <Button
              variant="secondary"
              onClick={() => setCategoryModal({ open: false, catId: null })}
              className="flex-1 sm:flex-none"
            >
              Скасувати
            </Button>

            <Button
              variant="primary"
              onClick={saveCategoryName}
              disabled={!categoryDraftName.trim()}
              className="flex-1 sm:flex-none"
            >
              <Check className="h-4 w-4" />
              Зберегти
            </Button>
          </div>
        }
      >
        <div>
          <label className="mb-2 block text-sm font-medium text-[#202020]">
            Назва категорії
          </label>

          <input
            value={categoryDraftName}
            onChange={(e) => setCategoryDraftName(e.target.value)}
            className="w-full rounded-xl border border-[#eadbc9] px-3 py-2.5 text-sm font-medium text-[#202020] outline-none transition-all placeholder:text-[#77716b] focus:border-[#ff5a00] focus:ring-4 focus:ring-[#ff5a00]/10"
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
          <div className="flex w-full flex-row gap-2 sm:justify-end">
            <Button
              variant="secondary"
              onClick={closeServiceModal}
              className="flex-1 sm:flex-none"
            >
              Скасувати
            </Button>

            <Button
              variant="primary"
              onClick={saveService}
              disabled={!canSaveServiceDraft(serviceDraft)}
              className="flex-1 sm:flex-none"
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
              <label className="mb-2 block text-sm font-medium text-[#202020]">
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
              <label className="mb-2 block text-sm font-medium text-[#202020]">
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
                className="w-full rounded-2xl border border-[#eadbc9] px-4 py-3 text-sm font-medium text-[#202020] outline-none transition-all placeholder:text-[#77716b] focus:border-[#ff5a00] focus:ring-4 focus:ring-[#ff5a00]/10"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#202020]">
              Назва послуги *
            </label>

            <input
              value={serviceDraft.name}
              onChange={(e) =>
                setServiceDraft((p) => ({ ...p, name: e.target.value }))
              }
              placeholder="Наприклад: Нарощування вій"
              className="w-full rounded-xl border border-[#eadbc9] px-3.5 py-2.5 text-sm font-medium text-[#202020] outline-none transition-all placeholder:text-[#77716b] focus:border-[#ff5a00] focus:ring-4 focus:ring-[#ff5a00]/10 sm:rounded-2xl sm:px-4 sm:py-3"
            />
          </div>

          <div>
            <label className="mb-4 block text-sm font-medium text-[#202020]">
              Тривалість
            </label>

            <DurationSlider
              value={serviceDraft.duration}
              onChange={(v) => setServiceDraft((p) => ({ ...p, duration: v }))}
            />
          </div>

          <div className="rounded-2xl border border-[#eadbc9] bg-[#fff7f0] p-3.5 sm:p-4">
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-[#77716b]" />
              <span className="font-medium text-[#202020]">Виконавці</span>
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
                    ? "border-2 border-[#ff5a00] bg-[#ff5a00] text-white"
                    : "border border-[#eadbc9] bg-white text-[#77716b] hover:bg-[#ffe5d4]",
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
                    ? "border-2 border-[#ff5a00] bg-[#ff5a00] text-white"
                    : "border border-[#eadbc9] bg-white text-[#77716b] hover:bg-[#ffe5d4]",
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
                        className="rounded-2xl border border-[#eadbc9] bg-white p-3"
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
                  <p className="text-sm text-[#77716b]">
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
                              ? "border-[#ff5a00] bg-[#fff7f0]"
                              : "border-[#eadbc9] bg-white hover:bg-[#fff7f0]",
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
                            className="h-4 w-4 rounded border-[#eadbc9] text-[#ff5a00] focus:ring-[#ff5a00]"
                          />

                          <MasterChip master={m} checked={checked} />
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
