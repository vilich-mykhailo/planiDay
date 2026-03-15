// Services.jsx //
import { useEffect, useMemo, useRef, useState } from "react";
import { useStudio } from "../../context/studio/useStudio";

const UNCATEGORIZED_ID = "__uncategorized__";

function getMastersWord(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "майстер";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
    return "майстри";
  return "майстрів";
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
      <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border border-[#E9DED2] bg-white">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="h-full w-full object-cover"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-[#F7F1EA] text-xs font-semibold text-[#7D7065]">
            {initials || "M"}
          </div>
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[#1F2A22]">{name}</p>
        <p
          className={`text-xs ${checked ? "text-[#4A5D4E]" : "text-[#8B7F73]"}`}
        >
          {checked ? "Обрано" : "Доступний"}
        </p>
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, right, children }) {
  return (
    <section className="overflow-hidden rounded-[26px] border border-[#E9DED2]  shadow-[0_10px_30px_rgba(93,64,55,0.06)] sm:rounded-[30px]">
      <div className="flex flex-col gap-3 border-b border-[#F1E7DE] px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <div className="min-w-0">
          <h2 className="text-[18px] font-extrabold tracking-[-0.02em] text-[#1F2A22]">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm text-[#857A70]">{subtitle}</p>
          )}
        </div>

        {right && <div className="w-full sm:w-auto">{right}</div>}
      </div>

      <div className="px-4 py-4 sm:px-5 sm:py-5">{children}</div>
    </section>
  );
}

function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  center = false,
}) {
  const mouseDownOnBackdropRef = useRef(false);
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] overflow-y-auto bg-[rgba(32,24,18,0.35)] backdrop-blur-[3px]"
      onMouseDown={(e) => {
        mouseDownOnBackdropRef.current = e.target === e.currentTarget;
      }}
      onMouseUp={(e) => {
        const upOnBackdrop = e.target === e.currentTarget;
        if (mouseDownOnBackdropRef.current && upOnBackdrop) onClose?.();
        mouseDownOnBackdropRef.current = false;
      }}
      onMouseLeave={() => {
        mouseDownOnBackdropRef.current = false;
      }}
    >
      <div
        className={[
          "min-h-full px-4 py-6 flex justify-center",
          center ? "items-center" : "items-start",
        ].join(" ")}
      >
        <div
          className="w-full max-w-2xl overflow-hidden rounded-[30px] border border-[#E9DED2] bg-white shadow-[0_24px_80px_rgba(93,64,55,0.18)]"
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="border-b border-[#F1E7DE] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C89D72]">
              {title}
            </p>
            {subtitle && (
              <p className="mt-1 text-sm text-[#857A70]">{subtitle}</p>
            )}
          </div>

          {center ? (
            <div className="space-y-4 p-5">{children}</div>
          ) : (
            <div className="max-h-[calc(100vh-210px)] overflow-y-auto px-5 py-5">
              <div className="space-y-4">{children}</div>
            </div>
          )}

          {footer && (
            <div className="border-t border-[#F1E7DE] px-5 py-4">{footer}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Button({ variant = "default", className = "", children, ...props }) {
  const base =
    "rounded-[16px] px-3 py-2 text-xs font-extrabold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50";

  const styles = {
    default:
      "border border-[#E7DED6] bg-white text-[#5F544B] hover:bg-[#FAF7F4] hover:text-[#1F2A22]",
    primary:
      "bg-[#4A5D4E] text-white shadow-[0_10px_24px_rgba(74,93,78,0.22)] hover:bg-[#3F5143]",
    danger:
      "border border-[#F0D6D1] bg-[#FFF3F1] text-[#B2504A] hover:bg-[#FDE8E4]",
  };

  const variantClass = className ? "" : styles[variant] || styles.default;

  return (
    <button
      type="button"
      className={`${base} ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/** ---- API helper ---- */
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
  if (!res.ok)
    throw new Error(data?.message || `Request failed (${res.status})`);
  return data;
}

function normalizeService(s) {
  const mastersArr = Array.isArray(s?.masters) ? s.masters.map(String) : [];
  const allMasters = s?.allMasters === true || mastersArr.length === 0; // якщо нема списку — вважаємо "всі"

  return {
    id: s?.id ?? crypto.randomUUID(),
    name: String(s?.name || "").trim(),
    duration: Number(s?.duration || 0) || 60,
    price: Number(s?.price ?? 0) || 0,
    allMasters,
    masters: allMasters ? [] : mastersArr,
  };
}

function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-[#EFE6DD] ${className}`}
      aria-hidden="true"
    />
  );
}

function ServicesSkeleton() {
  return (
    <div className="space-y-6 bg-[#FFFDF9]">
      <div className="mb-6 space-y-3">
        <SkeletonBlock className="h-12 w-56 rounded-2xl sm:h-14 sm:w-72" />
        <SkeletonBlock className="h-4 w-[420px] max-w-full" />
      </div>

      <section className="overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06)] sm:rounded-[28px]">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
          <div className="space-y-2">
            <SkeletonBlock className="h-5 w-28" />
            <SkeletonBlock className="h-4 w-72 max-w-full" />
          </div>

          <SkeletonBlock className="h-8 w-20 rounded-full" />
        </div>

        <div className="px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex flex-col gap-2 sm:flex-row">
            <SkeletonBlock className="h-12 w-full rounded-2xl" />
            <SkeletonBlock className="h-12 w-full rounded-2xl sm:w-48" />
          </div>
        </div>
      </section>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, blockIndex) => (
          <section
            key={blockIndex}
            className="overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06)] sm:rounded-[28px]"
          >
            <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
              <div className="space-y-2">
                <SkeletonBlock className="h-5 w-40" />
                <SkeletonBlock className="h-4 w-36" />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex">
                <SkeletonBlock className="h-10 w-full rounded-xl sm:w-36" />
                <SkeletonBlock className="h-10 w-full rounded-xl sm:w-10" />
                <SkeletonBlock className="col-span-2 h-10 w-full rounded-xl sm:col-auto sm:w-10" />
              </div>
            </div>

            <div className="space-y-3 px-4 py-4 sm:px-5 sm:py-5">
              {Array.from({ length: 2 }).map((_, serviceIndex) => (
                <div
                  key={serviceIndex}
                  className="rounded-2xl border border-gray-200 bg-white p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-2">
                      <SkeletonBlock className="h-5 w-40 max-w-full" />
                      <SkeletonBlock className="h-4 w-56 max-w-full" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
                      <SkeletonBlock className="h-10 w-full rounded-xl sm:w-10" />
                      <SkeletonBlock className="h-10 w-full rounded-xl sm:w-10" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default function Services() {
  const { studio } = useStudio();

  // ✅ UI state for services from API (not from studio)
  const [serviceCategories, setServiceCategories] = useState([]);
  const [uncategorizedServices, setUncategorizedServices] = useState([]);
  const [mastersLocal, setMastersLocal] = useState([]);
  const [loading, setLoading] = useState(true);

  const masters = mastersLocal;

  async function refresh() {
    if (!studio?.id) return;
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const [servicesData, mastersData] = await Promise.all([
        api(`/studio/${studio.id}/services`, { token }),
        api(`/studio/${studio.id}/masters`, { token }),
      ]);

      setServiceCategories(
        Array.isArray(servicesData?.serviceCategories)
          ? servicesData.serviceCategories
          : [],
      );

      setUncategorizedServices(
        Array.isArray(servicesData?.uncategorizedServices)
          ? servicesData.uncategorizedServices
          : [],
      );

      setMastersLocal(
        Array.isArray(mastersData?.masters) ? mastersData.masters : [],
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studio?.id]);

  // -----------------------------
  // MODALS
  // -----------------------------
  const [categoryModal, setCategoryModal] = useState({
    open: false,
    catId: null,
  });
  const [categoryDraftName, setCategoryDraftName] = useState("");

  const [serviceModal, setServiceModal] = useState({
    open: false,
    mode: "add", // add | edit
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

  // lock scroll when modal open
  useEffect(() => {
    const open = Boolean(categoryModal.open || serviceModal.open);
    document.body.classList.toggle("modal-open", open);
    return () => document.body.classList.remove("modal-open");
  }, [categoryModal.open, serviceModal.open]);

  // -----------------------------
  // DURATION PICKER (your logic)
  // -----------------------------
  const [durationHM, setDurationHM] = useState({ h: 1, m: 0 });
  const hoursRef = useRef(null);
  const minutesRef = useRef(null);
  const hoursTimerRef = useRef(null);
  const minutesTimerRef = useRef(null);

  function pickCenteredValue(containerEl) {
    if (!containerEl) return null;
    const items = Array.from(containerEl.querySelectorAll("[data-value]"));
    if (!items.length) return null;

    const rect = containerEl.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;

    let best = { dist: Infinity, value: null };
    for (const el of items) {
      const r = el.getBoundingClientRect();
      const elCenter = r.top + r.height / 2;
      const dist = Math.abs(elCenter - centerY);
      if (dist < best.dist)
        best = { dist, value: el.getAttribute("data-value") };
    }
    return best.value != null ? Number(best.value) : null;
  }

  function normalizeHM(next) {
    let h = Number(next.h ?? 0);
    let m = Number(next.m ?? 0);
    if (h < 0) h = 0;

    if (m < 0) m = 0;
    if (m > 59) m = 55;
    m = Math.round(m / 5) * 5;
    if (m === 60) m = 55;

    const total = h * 60 + m;
    return { h, m, total: total || 5 };
  }

  function setDuration(nextPartial) {
    setDurationHM((prev) => {
      const merged = { ...prev, ...nextPartial };
      const n = normalizeHM(merged);

      setServiceDraft((p) =>
        p.duration === n.total ? p : { ...p, duration: n.total },
      );
      return { h: n.h, m: n.m };
    });
  }

  // -----------------------------
  // Helpers
  // -----------------------------
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
          body: { service: payload }, // ✅ ВАЖЛИВО
        });
      } else {
        await api(`/studio/services/${serviceDraft.id}`, {
          method: "PATCH",
          token,
          body: { service: payload }, // ✅ ВАЖЛИВО
        });
      }

      closeServiceModal();
      await refresh();
    } catch (e) {
      console.error(e);
      alert(e.message || "Не вдалося зберегти послугу");
    }
  }
  // -----------------------------
  // Category CRUD (API)
  // -----------------------------
  const [newCategoryName, setNewCategoryName] = useState("");

  async function addCategory() {
    const name = newCategoryName.trim();
    if (!name || !studio?.id) return;

    const token = localStorage.getItem("token");
    await api(`/studio/${studio.id}/categories`, {
      method: "POST",
      token,
      body: { name },
    });

    setNewCategoryName("");
    refresh();
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

    const token = localStorage.getItem("token");
    await api(`/media/categories/${categoryModal.catId}`, {
      method: "PATCH",
      token,
      body: { name },
    });

    setCategoryModal({ open: false, catId: null });
    setCategoryDraftName("");
    refresh();
  }

  async function deleteCategory(catId) {
    if (catId === UNCATEGORIZED_ID) return;
    if (!studio?.id) return;

    const token = localStorage.getItem("token");
    await api(`/media/studio/${studio.id}/categories/${catId}`, {
      method: "DELETE",
      token,
    });

    refresh();
  }

  // -----------------------------
  // Service CRUD (API)
  // -----------------------------
  function openAddService(catId) {
    setServiceModal({ open: true, mode: "add", catId, serviceId: null });
    setDuration({ h: 1, m: 0 });
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

    const total = Number(original.duration || 60);

    setServiceModal({ open: true, mode: "edit", catId, serviceId });

    const masterIds = Array.isArray(original.masters)
      ? original.masters.map(String)
      : [];
    const allMastersFixed =
      Boolean(original.allMasters) || masterIds.length === 0;

    setServiceDraft({
      id: original.id,
      categoryId: catId,
      name: original.name || "",
      duration: total,
      price: String(original.price ?? ""),
      allMasters: allMastersFixed,
      masters: allMastersFixed ? [] : masterIds,
    });

    setDurationHM({ h: Math.floor(total / 60), m: total % 60 });
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

  async function deleteService(catId, serviceId) {
    try {
      const token = localStorage.getItem("token");
      await api(`/studio/services/${serviceId}`, { method: "DELETE", token });
      refresh();
    } catch (e) {
      console.error(e);
      alert(e.message);
    }
  }

  const blocks = useMemo(() => {
    const unc = {
      id: UNCATEGORIZED_ID,
      name: "Послуги без категорії",
      services: (uncategorizedServices || []).map(normalizeService),
      _virtual: true,
    };

    const cats = (serviceCategories || []).map((c) => ({
      ...c,
      services: (c.services || []).map(normalizeService),
    }));

    return [unc, ...cats];
  }, [serviceCategories, uncategorizedServices]);

  const showTips =
    serviceCategories.length === 0 &&
    (uncategorizedServices?.length || 0) === 0;

  if (loading) {
    return <ServicesSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#C89D72]">
          меню студії
        </p>

        <h1 className="mt-2 text-4xl font-black leading-[1.02] tracking-[-0.03em] text-[#1F2A22] sm:text-5xl md:text-6xl">
          Послуги
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#857A70] sm:text-[15px]">
          Налаштуйте категорії та послуги у м’якому, зрозумілому форматі — саме
          так клієнти бачитимуть їх під час онлайн-запису.
        </p>
      </div>

      {/* BLOCK 1: add category */}
      <SectionCard
        title="Категорії"
        subtitle="Додай категорію (наприклад: Вії, Нігті, Брови)."
        right={
          <span className="rounded-full border border-[#E9DED2] bg-[#F8F4EF] px-3 py-1 text-xs font-semibold text-[#7B6D61]">
            {" "}
          </span>
        }
      >
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Напр. Вії"
            className="w-full rounded-[18px] border border-[#E9DED2] px-4 py-3 text-sm font-semibold text-[#1F2A22] outline-none transition placeholder:text-[#B1A59A] hover:bg-[#FCF8F3] hover:border-[#DDCFC1] focus:border-[#4A5D4E] focus:ring-2 focus:ring-[#4A5D4E]/15"
          />
          <button
            type="button"
            onClick={addCategory}
            disabled={!newCategoryName.trim() || !studio?.id}
            className="inline-flex items-center justify-center gap-2 rounded-[18px] bg-[#4A5D4E] px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(74,93,78,0.22)] transition hover:bg-[#3F5143] disabled:cursor-not-allowed disabled:bg-[#BFC8C0]"
          >
            Додати категорію
          </button>
        </div>
      </SectionCard>

      {/* BLOCK 2 + 3: uncategorized + categories */}
      <div className="space-y-4">
        {blocks.map((cat) => {
          const isUnc = cat.id === UNCATEGORIZED_ID;

          return (
            <SectionCard
              key={cat.id}
              title={cat.name}
              subtitle={`Кількість послуг: ${cat.services?.length || 0}`}
              right={
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    className="inline-flex items-center gap-2 rounded-[18px] bg-[#4A5D4E] px-4 py-2.5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(74,93,78,0.22)] transition hover:bg-[#3F5143] flex items-center gap-2"
                    onClick={() => openAddService(cat.id)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M12 5v14" />
                      <path d="M5 12h14" />
                    </svg>
                    Додати послугу
                  </Button>
                  {!isUnc && (
                    <Button
                      className="w-full sm:w-auto inline-flex items-center justify-center rounded-[16px] border border-[#E7DED6] bg-white px-3 py-2 text-[#6B625A] transition hover:bg-[#FAF7F4] hover:text-[#1F2A22]"
                      onClick={() => openEditCategory(cat.id)}
                      title="Редагувати"
                      aria-label="Редагувати"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z" />
                      </svg>
                    </Button>
                  )}

                  {!isUnc && (
                    <Button
                      className="w-full sm:w-auto inline-flex items-center justify-center rounded-[16px] border border-[#F0D6D1] bg-[#FFF3F1] px-3 py-2 text-[#B2504A] transition hover:bg-[#FDE8E4]"
                      onClick={() => deleteCategory(cat.id)}
                      title="Категорія буде видалена, а послуги перенесуться в “Без категорії”"
                      aria-label="Видалити категорію"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M9 6V4h6v2" />
                      </svg>
                    </Button>
                  )}
                </div>
              }
            >
              {(cat.services?.length || 0) === 0 ? (
                <div className="rounded-[22px] border border-[#E9DED2] bg-[#FBF7F2] p-4 text-sm text-[#857A70]">
                  Тут ще немає послуг. Натисни “Додати послугу”.
                </div>
              ) : (
                <div className="space-y-3">
                  {cat.services.map((srv) => (
                    <div
                      key={srv.id}
className="rounded-[24px] border border-[#E9DED2] bg-white p-4 transition hover:bg-[#FCF8F3] hover:shadow-[0_8px_20px_rgba(93,64,55,0.05)]"                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[15px] font-extrabold text-[#1F2A22]">
                            {srv.name}
                          </p>
                          <p className="mt-1 text-sm text-[#857A70]">
                            {srv.duration} хв • {srv.price} грн •{" "}
                            {resolveServiceMastersText(srv)}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 sm:flex gap-2 sm:shrink-0">
                          <Button
                            className="w-full sm:w-auto inline-flex items-center justify-center rounded-[16px] border border-[#E7DED6] bg-white px-3 py-2 text-[#6B625A] transition hover:bg-[#FAF7F4] hover:text-[#1F2A22]"
                            onClick={() => openEditService(cat.id, srv.id)}
                            title="Редагувати"
                            aria-label="Редагувати"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4"
                            >
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z" />
                            </svg>
                          </Button>
                          <Button
                      className="w-full sm:w-auto inline-flex items-center justify-center rounded-[16px] border border-[#F0D6D1] bg-[#FFF3F1] px-3 py-2 text-[#B2504A] transition hover:bg-[#FDE8E4]"
                            onClick={() => deleteService(cat.id, srv.id)}
                            title="Видалити"
                            aria-label="Видалити"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14H6L5 6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                              <path d="M9 6V4h6v2" />
                            </svg>
                          </Button>
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

      {/* EDIT CATEGORY MODAL */}
      <Modal
        open={categoryModal.open}
        onClose={() => setCategoryModal({ open: false, catId: null })}
        title="Редагування категорії"
        subtitle="Зміни назву та збережи."
        center
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              onClick={saveCategoryName}
              disabled={!categoryDraftName.trim()}
              className="inline-flex items-center gap-2 rounded-[18px] bg-[#4A5D4E] px-4 py-2.5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(74,93,78,0.22)] transition hover:bg-[#3F5143]"
            >
              Зберегти
            </Button>
            <Button
              onClick={() => setCategoryModal({ open: false, catId: null })}
              className="ui-button-cancel"
            >
              Скасувати
            </Button>
          </div>
        }
      >
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">
            Назва категорії
          </label>
          <input
            value={categoryDraftName}
            onChange={(e) => setCategoryDraftName(e.target.value)}
            className="w-full rounded-[18px] border border-[#E9DED2]  px-4 py-3 text-sm font-semibold text-[#1F2A22] outline-none transition placeholder:text-[#B1A59A] hover:bg-[#FCF8F3] hover:border-[#DDCFC1] focus:border-[#4A5D4E] focus:ring-2 focus:ring-[#4A5D4E]/15"
            placeholder="Напр. Вії"
          />
        </div>
      </Modal>

      {/* ADD/EDIT SERVICE MODAL */}
      <Modal
        open={serviceModal.open}
        onClose={closeServiceModal}
        title={
          serviceModal.mode === "add" ? "Додати послугу" : "Редагувати послугу"
        }
        subtitle="За потреби можна перенести послугу в іншу категорію."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="primary"
              onClick={saveService}
              disabled={!canSaveServiceDraft(serviceDraft)}
className="rounded-[16px] bg-[#4A5D4E] px-5 py-2.5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(74,93,78,0.22)] transition hover:bg-[#3F5143]"            >
              Зберегти
            </Button>
            <Button onClick={closeServiceModal} 
            className="rounded-[16px] border border-[#E7DED6] bg-white px-5 py-2.5 text-sm font-extrabold text-[#6B625A] transition hover:bg-[#FAF7F4]"
            >
              Скасувати
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* category */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Категорія
            </label>
            <select
              value={serviceDraft.categoryId || UNCATEGORIZED_ID}
              onChange={(e) =>
                setServiceDraft((p) => ({ ...p, categoryId: e.target.value }))
              }
              className="w-full rounded-[18px] border border-[#E9DED2]  px-4 py-3 text-sm font-semibold text-[#1F2A22] outline-none transition placeholder:text-[#B1A59A] hover:bg-[#FCF8F3] hover:border-[#DDCFC1] focus:border-[#4A5D4E] focus:ring-2 focus:ring-[#4A5D4E]/15"
            >
              <option value={UNCATEGORIZED_ID}>Послуги без категорії</option>
              {serviceCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Якщо хочеш — можна перенести послугу в іншу категорію.
            </p>
          </div>

          {/* name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Назва послуги
            </label>
            <input
              value={serviceDraft.name}
              onChange={(e) =>
                setServiceDraft((p) => ({ ...p, name: e.target.value }))
              }
              placeholder="Напр. Нарощування"
              className="w-full rounded-[18px] border border-[#E9DED2]  px-4 py-3 text-sm font-semibold text-[#1F2A22] outline-none transition placeholder:text-[#B1A59A] hover:bg-[#FCF8F3] hover:border-[#DDCFC1] focus:border-[#4A5D4E] focus:ring-2 focus:ring-[#4A5D4E]/15"
            />
          </div>

          {/* price */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Ціна
            </label>
            <input
              type="number"
              value={serviceDraft.price}
              onChange={(e) =>
                setServiceDraft((p) => ({ ...p, price: e.target.value }))
              }
              placeholder="грн"
              className="w-full rounded-[18px] border border-[#E9DED2]  px-4 py-3 text-sm font-semibold text-[#1F2A22] outline-none transition placeholder:text-[#B1A59A] hover:bg-[#FCF8F3] hover:border-[#DDCFC1] focus:border-[#4A5D4E] focus:ring-2 focus:ring-[#4A5D4E]/15"
            />
          </div>

          {/* duration */}
          <div className="flex justify-center">
            <div className="w-full max-w-[420px]">
              <label className="block text-sm font-semibold text-gray-900 mb-3 text-center">
                Тривалість
              </label>

              <div className="grid grid-cols-2 gap-3">
                {/* hours */}
                <div className="rounded-[22px] border border-[#E9DED2]  px-3 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2 text-center">
                    Години
                  </p>
                  <div className="relative overflow-x-hidden">
<div className="pointer-events-none absolute left-0 right-0 top-1/2 h-10 -translate-y-1/2 rounded-xl border border-[#E9DED2] bg-[#F8F4EF]" />                    <div
                      ref={hoursRef}
                      onScroll={() => {
                        if (hoursTimerRef.current)
                          clearTimeout(hoursTimerRef.current);
                        hoursTimerRef.current = setTimeout(() => {
                          const v = pickCenteredValue(hoursRef.current);
                          if (v == null) return;
                          setDuration({ h: v });
                        }, 80);
                      }}
                      className="h-40 overflow-y-auto overflow-x-hidden snap-y snap-mandatory scroll-smooth no-scrollbar py-16 touch-pan-y"
                    >
                      {Array.from({ length: 13 }, (_, i) => i).map((h) => {
                        const active = Number(durationHM.h) === h;
                        return (
                          <div
                            key={h}
                            data-value={h}
                            className={[
                              "w-full snap-center h-10 grid place-items-center rounded-xl font-extrabold select-none",
                              "transition-all duration-200",
                              active
                                ? "text-gray-900 scale-[1.15]"
                                : "text-gray-400 scale-[0.92] opacity-70",
                            ].join(" ")}
                          >
                            {h}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* minutes */}
                <div className="rounded-2xl border border-gray-200 bg-white px-3 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2 text-center">
                    Хвилини
                  </p>
                  <div className="relative overflow-x-hidden">
<div className="pointer-events-none absolute left-0 right-0 top-1/2 h-10 -translate-y-1/2 rounded-xl border border-[#E9DED2] bg-[#F8F4EF]" />                    <div
                      ref={minutesRef}
                      onScroll={() => {
                        if (minutesTimerRef.current)
                          clearTimeout(minutesTimerRef.current);
                        minutesTimerRef.current = setTimeout(() => {
                          const v = pickCenteredValue(minutesRef.current);
                          if (v == null) return;
                          setDuration({ m: v });
                        }, 80);
                      }}
                      className="h-40 overflow-y-auto overflow-x-hidden snap-y snap-mandatory scroll-smooth no-scrollbar py-16 touch-pan-y"
                    >
                      {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => {
                        const active = Number(durationHM.m) === m;
                        return (
                          <div
                            key={m}
                            data-value={m}
                            className={[
                              "w-full snap-center h-10 grid place-items-center rounded-xl font-extrabold select-none",
                              "transition-all duration-200",
active
  ? "text-[#1F2A22] scale-[1.15]"
  : "text-[#B6AA9E] scale-[0.92] opacity-70",
                            ].join(" ")}
                          >
                            {String(m).padStart(2, "0")}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* summary */}
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-[#8B7F73]">
                  Підсумок:{" "}
                  <span className="font-extrabold text-[#1F2A22]">
                    {serviceDraft.duration} хв
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => setDuration({ h: 1, m: 0 })}
                  className="text-xs font-extrabold text-[#4A5D4E] transition hover:underline"
                >
                  Скинути
                </button>
              </div>
            </div>
          </div>

          {/* masters */}
<div className="rounded-[24px] border border-[#E9DED2] bg-[#FBF7F2] p-4">
              <p className="text-sm font-extrabold text-[#1F2A22]">Виконавці</p>
            <p className="mt-1 text-xs text-[#857A70]">
              За замовчуванням — всі майстри. Якщо потрібно — обери конкретних.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setServiceDraft((p) => ({
                    ...p,
                    allMasters: true,
                    masters: [],
                  }))
                }
className={[
  "rounded-[16px] border px-4 py-2 text-sm font-extrabold transition",
  serviceDraft.allMasters
    ? "border-[#B8DDBE] bg-[#EAF7EC] text-[#4A5D4E]"
    : "border-[#E7DED6] bg-white text-[#6B625A] hover:bg-[#FAF7F4]",
].join(" ")}
              >
                Для всіх майстрів
              </button>

              <button
                type="button"
                onClick={() =>
                  setServiceDraft((p) => {
                    const next = { ...p, allMasters: false };
                    if (
                      (next.masters || []).length === 0 &&
                      masters.length > 0
                    ) {
                      next.masters = [String(masters[0].id ?? masters[0].name)];
                    }
                    return next;
                  })
                }
className={[
  "rounded-[16px] border px-4 py-2 text-sm font-extrabold transition",
  !serviceDraft.allMasters
    ? "border-[#B8DDBE] bg-[#EAF7EC] text-[#4A5D4E]"
    : "border-[#E7DED6] bg-white text-[#6B625A] hover:bg-[#FAF7F4]",
].join(" ")}
              >
                Обрати майстрів
              </button>
            </div>

            {!serviceDraft.allMasters && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {masters.length === 0 ? (
<div className="rounded-[18px] border border-[#E9DED2] bg-white p-3 text-sm text-[#857A70]">
  Спочатку додайте майстрів.
</div>
                ) : (
                  masters.map((m) => {
                    const id = String(m.id ?? m.name);
                    const checked = (serviceDraft.masters || []).includes(id);

                    return (
                      <label
                        key={id}
                        className={[
                          "flex items-center gap-3 rounded-2xl border p-3 cursor-pointer transition",
checked
  ? "border-[#B8DDBE] bg-[#EAF7EC]"
  : "border-[#E9DED2] bg-white hover:bg-[#FCF8F3]",
                        ].join(" ")}
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
                          className="h-4 w-4 accent-emerald-300 cursor-pointer"
                        />
                        <MasterChip master={m} checked={checked} />
                      </label>
                    );
                  })
                )}
              </div>
            )}

            {!serviceDraft.allMasters && (
<p className="mt-2 text-xs text-[#8B7F73]">
  Обрано:{" "}
  <span className="font-extrabold text-[#1F2A22]">
    {(serviceDraft.masters || []).length}
  </span>
</p>
            )}
          </div>
        </div>
      </Modal>
      {showTips && (
<div className="rounded-[28px] border border-[#E9DED2]  px-4 py-5 shadow-[0_10px_30px_rgba(93,64,55,0.06)] sm:px-6">          
  <h2 className="text-center text-lg font-extrabold text-[#1F2A22] sm:text-xl">
            Як правильно організувати послуги
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-[#857A70]">
            Щоб клієнтам було зручно орієнтуватися у вашому прайсі, послуги
            варто структурувати логічно та зрозуміло.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#857A70]">
            Якщо у вас є{" "}
            <span className="font-semibold text-[#1F2A22]">
              одна основна послуга з кількома варіантами або напрямками
            </span>
            , рекомендується створити{" "}
            <span className="font-semibold text-[#1F2A22]">категорію</span>.
            Усередині цієї категорії ви зможете додати окремі послуги з різною
            тривалістю, ціною або особливостями виконання.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#857A70]">
            Якщо ж послуга є{" "}
            <span className="font-semibold text-[#1F2A22]">
              самостійною та не потребує поділу
            </span>
            , її можна додати{" "}
            <span className="font-semibold text-[#1F2A22]">
              без створення категорії
            </span>
            . Такий варіант підходить для простих або одиничних послуг.
          </p>
          <div className="mt-3 rounded-[22px] border border-[#E9DED2] bg-[#FBF7F2] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C89D72]">
              Приклад
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#857A70]">
              Для{" "}
              <span className="font-semibold text-[#1F2A22]">
                перукарських послуг
              </span>{" "}
              можна створити категорії:
              <span className="font-semibold text-[#1F2A22]">
                {" "}
                “Жіночі стрижки”, “Чоловічі стрижки”, “Фарбування”
              </span>
              . У категорії{" "}
              <span className="font-semibold text-[#1F2A22]">
                “Фарбування”
              </span>{" "}
              можна додати послуги:
              <span className="font-semibold text-[#1F2A22]">
                {" "}
                “Тонування”, “Балаяж”, “Омбре”
              </span>
              .
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
