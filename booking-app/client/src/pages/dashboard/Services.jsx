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
    <div className="flex items-center gap-3 min-w-0">
      <div className="h-9 w-9 rounded-full overflow-hidden border bg-white flex-shrink-0">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="h-full w-full object-cover"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        ) : (
          <div className="h-full w-full grid place-items-center text-xs font-semibold text-gray-600 bg-gray-100">
            {initials || "M"}
          </div>
        )}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
        <p
          className={`text-xs ${checked ? "text-emerald-700" : "text-gray-500"}`}
        >
          {checked ? "Обрано" : "Доступний"}
        </p>
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, right, children }) {
  return (
    <section className="rounded-[24px] sm:rounded-[28px] border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06)] overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-extrabold text-gray-900">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
        </div>

        {right && <div className="w-full sm:w-auto">{right}</div>}
      </div>

      <div className="px-4 sm:px-5 py-4 sm:py-5">{children}</div>
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
      className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-[2px] overflow-y-auto"
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
          className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-xl"
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="border-b px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {title}
            </p>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
            )}
          </div>

          {center ? (
            <div className="p-5 space-y-4">{children}</div>
          ) : (
            <div className="px-5 py-5 max-h-[calc(100vh-210px)] overflow-y-auto">
              <div className="space-y-4">{children}</div>
            </div>
          )}

          {footer && <div className="border-t px-5 py-4">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

function Button({ variant = "default", className = "", children, ...props }) {
  const base =
    "rounded-xl px-3 py-2 text-xs font-extrabold active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed";
  const styles = {
    default: "border border-gray-200 bg-white text-gray-900 hover:bg-gray-50",
    primary: "bg-black text-white hover:bg-gray-900",
    danger: "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  };

  return (
    <button
      type="button"
      className={`${base} ${styles[variant]} ${className}`}
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

export default function Services() {
  const { studio } = useStudio();

  // ✅ UI state for services from API (not from studio)
  const [serviceCategories, setServiceCategories] = useState([]);
  const [uncategorizedServices, setUncategorizedServices] = useState([]);

  const [loading, setLoading] = useState(false);

  const masters = useMemo(
    () => (Array.isArray(studio?.masters) ? studio.masters : []),
    [studio],
  );

  // -----------------------------
  // LOAD from API
  // -----------------------------
  async function refresh() {
    if (!studio?.id) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const data = await api(`/studio/${studio.id}/services`, { token });

      setServiceCategories(
        Array.isArray(data?.serviceCategories) ? data.serviceCategories : [],
      );
      setUncategorizedServices(
        Array.isArray(data?.uncategorizedServices)
          ? data.uncategorizedServices
          : [],
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
    await api(`/categories/${categoryModal.catId}`, {
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

    setServiceDraft({
      id: original.id,
      categoryId: catId, // source category for UI; user can change select
      name: original.name || "",
      duration: total,
      price: String(original.price ?? ""),
      allMasters: Boolean(original.allMasters),
      masters: Array.isArray(original.masters) ? [...original.masters] : [],
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

  async function saveService() {
    if (!canSaveServiceDraft(serviceDraft) || !studio?.id) return;

    const token = localStorage.getItem("token");
    const toCatId = serviceDraft.categoryId || UNCATEGORIZED_ID;

    const payload = {
      name: String(serviceDraft.name || "").trim(),
      duration: Number(serviceDraft.duration || 60),
      price: Number(serviceDraft.price),
      allMasters: Boolean(serviceDraft.allMasters),
      categoryId: toCatId === UNCATEGORIZED_ID ? null : toCatId,
      masters: serviceDraft.allMasters
        ? []
        : (serviceDraft.masters || []).map(String),
    };

    if (serviceModal.mode === "add") {
      // ✅ CREATE
      await api(`/studio/${studio.id}/services`, {
        method: "POST",
        token,
        body: { service: payload },
      });
    } else {
      // ✅ UPDATE
      await api(`/services/${serviceDraft.id}`, {
        method: "PATCH",
        token,
        body: { service: payload },
      });
    }

    closeServiceModal();
    refresh();
  }
  // -----------------------------
  // Derived blocks for UI
  // -----------------------------
  const blocks = useMemo(() => {
    const unc = {
      id: UNCATEGORIZED_ID,
      name: "Послуги без категорії",
      services: uncategorizedServices,
      _virtual: true,
    };
    return [
      unc,
      ...serviceCategories.map((c) => ({ ...c, services: c.services || [] })),
    ];
  }, [serviceCategories, uncategorizedServices]);

  const showTips =
    serviceCategories.length === 0 &&
    (uncategorizedServices?.length || 0) === 0;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#0F172A] tracking-tight leading-[1.05]">
          Послуги
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Налаштуйте категорії та послуги. Клієнти бачитимуть їх у записі
          онлайн.
        </p>
        {loading && (
          <p className="mt-2 text-xs text-gray-500">Завантаження...</p>
        )}
      </div>

      {/* BLOCK 1: add category */}
      <SectionCard
        title="Категорії"
        subtitle="Додай категорію (наприклад: Вії, Нігті, Брови)."
        right={
          <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700">
            Всього: {serviceCategories.length}
          </span>
        }
      >
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Напр. Вії"
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/15"
          />
          <button
            type="button"
            onClick={addCategory}
            disabled={!newCategoryName.trim() || !studio?.id}
            className="ui-button-one"
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
                  {!isUnc && (
                    <Button
                      className="w-full sm:w-auto ui-button-primary"
                      onClick={() => openEditCategory(cat.id)}
                    >
                      Редагувати
                    </Button>
                  )}

                  <Button
                    className="w-full sm:w-auto ui-button-one"
                    variant="primary"
                    onClick={() => openAddService(cat.id)}
                  >
                    Додати послугу
                  </Button>

                  {!isUnc && (
                    <Button
                      className="col-span-2 sm:col-auto w-full sm:w-auto ui-button-danger"
                      variant="danger"
                      onClick={() => deleteCategory(cat.id)}
                      title="Категорія буде видалена, а послуги перенесуться в “Без категорії”"
                    >
                      Видалити
                    </Button>
                  )}
                </div>
              }
            >
              {(cat.services?.length || 0) === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  Тут ще немає послуг. Натисни “Додати послугу”.
                </div>
              ) : (
                <div className="space-y-3">
                  {cat.services.map((srv) => (
                    <div
                      key={srv.id}
                      className="rounded-2xl border border-gray-200 bg-white p-4 hover:bg-gray-50/60 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-extrabold text-gray-900 truncate">
                            {srv.name}
                          </p>
                          <p className="mt-1 text-sm text-gray-600">
                            {srv.duration} хв • {srv.price} грн •{" "}
                            {resolveServiceMastersText(srv)}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 sm:flex gap-2 sm:shrink-0">
                          <Button
                            className="w-full sm:w-auto ui-button-primary"
                            onClick={() => openEditService(cat.id, srv.id)}
                          >
                            Редагувати
                          </Button>
                          <Button
                            className="w-full sm:w-auto ui-button-danger"
                            variant="danger"
                            onClick={() => deleteService(cat.id, srv.id)}
                          >
                            Видалити
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
              variant="primary"
              onClick={saveCategoryName}
              disabled={!categoryDraftName.trim()}
              className="ui-button-one"
            >
              Зберегти
            </Button>
            <Button
              onClick={() => setCategoryModal({ open: false, catId: null })}
              className="ui-button"
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
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/15"
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
              className="ui-button-one"
            >
              Зберегти
            </Button>
            <Button onClick={closeServiceModal} className="ui-button">
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
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/15"
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
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/15"
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
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/15"
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
                <div className="rounded-2xl border border-gray-200 bg-white px-3 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2 text-center">
                    Години
                  </p>
                  <div className="relative overflow-x-hidden">
                    <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 h-10 rounded-xl border border-gray-200 bg-gray-50/70" />
                    <div
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
                    <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 h-10 rounded-xl border border-gray-200 bg-gray-50/70" />
                    <div
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
                                ? "text-gray-900 scale-[1.15]"
                                : "text-gray-400 scale-[0.92] opacity-70",
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
                <p className="text-xs text-gray-500">
                  Підсумок:{" "}
                  <span className="font-extrabold text-gray-900">
                    {serviceDraft.duration} хв
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => setDuration({ h: 1, m: 0 })}
                  className="text-xs font-extrabold text-gray-900 hover:underline"
                >
                  Скинути
                </button>
              </div>
            </div>
          </div>

          {/* masters */}
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-extrabold text-gray-900">Виконавці</p>
            <p className="mt-1 text-xs text-gray-600">
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
                  "rounded-xl px-4 py-2 text-sm font-extrabold border transition",
                  serviceDraft.allMasters ? "ui-button-one" : "ui-button-one",
                ].join(" ")}
              >
                Для всіх майстрів
              </button>

              <button
                type="button"
                onClick={() =>
                  setServiceDraft((p) => ({ ...p, allMasters: false }))
                }
                className={[
                  "rounded-xl px-4 py-2 text-sm font-extrabold border transition",
                  !serviceDraft.allMasters ? "ui-button" : "ui-button",
                ].join(" ")}
              >
                Обрати майстрів
              </button>
            </div>

            {!serviceDraft.allMasters && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {masters.length === 0 ? (
                  <div className="rounded-xl border bg-white p-3 text-sm text-gray-600">
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
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-gray-200 bg-white hover:bg-gray-50",
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
              <p className="mt-2 text-xs text-gray-500">
                Обрано:{" "}
                <span className="font-extrabold">
                  {(serviceDraft.masters || []).length}
                </span>
              </p>
            )}
          </div>
        </div>
      </Modal>
      {showTips && (
        <div className="rounded-[24px] sm:rounded-[28px] border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06)] px-4 sm:px-6 py-5">
          <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 text-center">
            Як правильно організувати послуги
          </h2>

          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            Щоб клієнтам було зручно орієнтуватися у вашому прайсі, послуги
            варто структурувати логічно та зрозуміло.
          </p>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            Якщо у вас є{" "}
            <span className="font-semibold text-gray-900">
              одна основна послуга з кількома варіантами або напрямками
            </span>
            , рекомендується створити{" "}
            <span className="font-semibold text-gray-900">категорію</span>.
            Усередині цієї категорії ви зможете додати окремі послуги з різною
            тривалістю, ціною або особливостями виконання.
          </p>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            Якщо ж послуга є{" "}
            <span className="font-semibold text-gray-900">
              самостійною та не потребує поділу
            </span>
            , її можна додати{" "}
            <span className="font-semibold text-gray-900">
              без створення категорії
            </span>
            . Такий варіант підходить для простих або одиничних послуг.
          </p>
          <div className="mt-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Приклад
            </p>
            <p className="mt-2 text-sm text-gray-700 leading-relaxed">
              Для{" "}
              <span className="font-semibold text-gray-900">
                перукарських послуг
              </span>{" "}
              можна створити категорії:
              <span className="font-semibold text-gray-900">
                {" "}
                “Жіночі стрижки”, “Чоловічі стрижки”, “Фарбування”
              </span>
              . У категорії{" "}
              <span className="font-semibold text-gray-900">
                “Фарбування”
              </span>{" "}
              можна додати послуги:
              <span className="font-semibold text-gray-900">
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
