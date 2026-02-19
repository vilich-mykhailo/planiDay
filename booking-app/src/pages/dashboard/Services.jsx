import { useEffect, useMemo, useState } from "react";
import { useStudio } from "../../context/studio/useStudio";

const UNCATEGORIZED_ID = "__uncategorized__";

function makeId(prefix = "id") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function getMastersWord(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "майстер";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "майстри";
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
        <p className={`text-xs ${checked ? "text-emerald-700" : "text-gray-500"}`}>
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


function Modal({ open, onClose, title, subtitle, children, footer }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center px-4 bg-black/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
          {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
        </div>

        <div className="p-5 space-y-4">{children}</div>

        {footer && <div className="border-t px-5 py-4">{footer}</div>}
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
    <button type="button" className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export default function Services() {
  const { studio, updateStudio } = useStudio();

  const masters = useMemo(
    () => (Array.isArray(studio?.masters) ? studio.masters : []),
    [studio]
  );

  const categories = useMemo(
    () => (Array.isArray(studio?.serviceCategories) ? studio.serviceCategories : []),
    [studio]
  );

  const uncategorizedServices = useMemo(
    () => (Array.isArray(studio?.uncategorizedServices) ? studio.uncategorizedServices : []),
    [studio]
  );

  // -----------------------------
  // MODALS
  // -----------------------------
  const [categoryModal, setCategoryModal] = useState({ open: false, catId: null }); // edit category name
  const [categoryDraftName, setCategoryDraftName] = useState("");

  const [serviceModal, setServiceModal] = useState({
    open: false,
    mode: "add", // add | edit
    catId: UNCATEGORIZED_ID,
    serviceId: null,
  });

  const [serviceDraft, setServiceDraft] = useState({
    id: null,
    categoryId: UNCATEGORIZED_ID, // allows move between categories
    name: "",
    duration: 60,
    price: "",
    allMasters: true,
    masters: [],
  });

  const durationOptions = [
    { value: 30, label: "30 хв" },
    { value: 60, label: "60 хв" },
    { value: 90, label: "90 хв" },
  ];

  // lock scroll when modal open
  useEffect(() => {
    const open = Boolean(categoryModal.open || serviceModal.open);
    document.body.classList.toggle("modal-open", open);
    return () => document.body.classList.remove("modal-open");
  }, [categoryModal.open, serviceModal.open]);

  // -----------------------------
  // BLOCK 1: add category
  // -----------------------------
  const [newCategoryName, setNewCategoryName] = useState("");

  async function addCategory() {
    const name = newCategoryName.trim();
    if (!name) return;

    const next = [...categories, { id: makeId("cat"), name, services: [] }];
    await updateStudio({ serviceCategories: next });
    setNewCategoryName("");
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
    const mastersOk = d?.allMasters || (Array.isArray(d?.masters) && d.masters.length > 0);
    return nameOk && priceOk && mastersOk;
  }

  function getCategoryServices(catId) {
    if (catId === UNCATEGORIZED_ID) return uncategorizedServices;
    const cat = categories.find((c) => c.id === catId);
    return Array.isArray(cat?.services) ? cat.services : [];
  }

  // -----------------------------
  // Category edit/delete
  // -----------------------------
  function openEditCategory(catId) {
    if (catId === UNCATEGORIZED_ID) return;
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    setCategoryDraftName(cat.name || "");
    setCategoryModal({ open: true, catId });
  }

  async function saveCategoryName() {
    const name = categoryDraftName.trim();
    if (!name || !categoryModal.catId) return;

    const next = categories.map((c) => (c.id === categoryModal.catId ? { ...c, name } : c));
    await updateStudio({ serviceCategories: next });
    setCategoryModal({ open: false, catId: null });
    setCategoryDraftName("");
  }

  async function deleteCategory(catId) {
    if (catId === UNCATEGORIZED_ID) return;

    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;

    const catServices = Array.isArray(cat.services) ? cat.services : [];
    const nextCategories = categories.filter((c) => c.id !== catId);
    const nextUnc = [...uncategorizedServices, ...catServices];

    await updateStudio({
      serviceCategories: nextCategories,
      uncategorizedServices: nextUnc,
    });
  }

  // -----------------------------
  // Service add/edit/delete
  // -----------------------------
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

    setServiceModal({ open: true, mode: "edit", catId, serviceId });
    setServiceDraft({
      id: original.id,
      categoryId: catId,
      name: original.name || "",
      duration: Number(original.duration || 60),
      price: String(original.price ?? ""),
      allMasters: Boolean(original.allMasters),
      masters: Array.isArray(original.masters) ? [...original.masters] : [],
    });
  }

  function closeServiceModal() {
    setServiceModal({ open: false, mode: "add", catId: UNCATEGORIZED_ID, serviceId: null });
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
    if (catId === UNCATEGORIZED_ID) {
      await updateStudio({
        uncategorizedServices: uncategorizedServices.filter((s) => s.id !== serviceId),
      });
      return;
    }

    const nextCategories = categories.map((c) => {
      if (c.id !== catId) return c;
      return { ...c, services: (c.services || []).filter((s) => s.id !== serviceId) };
    });

    await updateStudio({ serviceCategories: nextCategories });
  }

  async function saveService() {
    if (!canSaveServiceDraft(serviceDraft)) return;

    const fromCatId = serviceModal.catId;
    const toCatId = serviceDraft.categoryId || UNCATEGORIZED_ID;

    const cleaned = {
      id: serviceDraft.id || makeId("srv"),
      name: String(serviceDraft.name || "").trim(),
      duration: Number(serviceDraft.duration || 60),
      price: Number(serviceDraft.price),
      allMasters: Boolean(serviceDraft.allMasters),
      masters: serviceDraft.allMasters ? [] : (serviceDraft.masters || []),
    };

    // ADD: just add to target
    if (serviceModal.mode === "add") {
      if (toCatId === UNCATEGORIZED_ID) {
        await updateStudio({ uncategorizedServices: [...uncategorizedServices, cleaned] });
      } else {
        const nextCategories = categories.map((c) => {
          if (c.id !== toCatId) return c;
          return { ...c, services: [...(c.services || []), cleaned] };
        });
        await updateStudio({ serviceCategories: nextCategories });
      }

      closeServiceModal();
      return;
    }

    // EDIT: remove from source, add to target (supports moving)
    let nextCategories = categories.map((c) => {
      if (c.id !== fromCatId) return c;
      return { ...c, services: (c.services || []).filter((s) => s.id !== cleaned.id) };
    });

    let nextUnc = uncategorizedServices.filter((s) => s.id !== cleaned.id);

    if (toCatId === UNCATEGORIZED_ID) {
      nextUnc = [...nextUnc, cleaned];
    } else {
      nextCategories = nextCategories.map((c) => {
        if (c.id !== toCatId) return c;
        return { ...c, services: [...(c.services || []), cleaned] };
      });
    }

    await updateStudio({
      serviceCategories: nextCategories,
      uncategorizedServices: nextUnc,
    });

    closeServiceModal();
  }

  // -----------------------------
  // UI blocks:
  // 1) categories add
  // 2) uncategorized block
  // 3) each added category block
  // -----------------------------
  const blocks = useMemo(() => {
    const unc = {
      id: UNCATEGORIZED_ID,
      name: "Послуги без категорії",
      services: uncategorizedServices,
      _virtual: true,
    };

    return [unc, ...categories.map((c) => ({ ...c, services: c.services || [] }))];
  }, [categories, uncategorizedServices]);

  return (
    <div className="space-y-6">
      {/* BLOCK 1: add category */}
      <SectionCard
        title="Категорії"
        subtitle="Додай категорію (наприклад: Вії, Нігті, Брови)."
        right={
          <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700">
            Всього: {categories.length}
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
            disabled={!newCategoryName.trim()}
            className="rounded-2xl bg-black px-5 py-3 text-sm font-extrabold text-white hover:bg-gray-900 active:scale-[0.99] transition disabled:bg-gray-200 disabled:text-gray-500"
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
              subtitle={`${(cat.services?.length || 0)} послуг`}
right={
  <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
    {!isUnc && (
      <Button className="w-full sm:w-auto" onClick={() => openEditCategory(cat.id)}>
        Редагувати
      </Button>
    )}

    <Button className="w-full sm:w-auto" variant="primary" onClick={() => openAddService(cat.id)}>
      Додати послугу
    </Button>

    {!isUnc && (
      <Button
        className="col-span-2 sm:col-auto w-full sm:w-auto"
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
                          <p className="font-extrabold text-gray-900 truncate">{srv.name}</p>
                          <p className="mt-1 text-sm text-gray-600">
                            {srv.duration} хв • {srv.price} грн • {resolveServiceMastersText(srv)}
                          </p>
                        </div>

<div className="grid grid-cols-2 sm:flex gap-2 sm:shrink-0">
  <Button className="w-full sm:w-auto" onClick={() => openEditService(cat.id, srv.id)}>
    Редагувати
  </Button>
  <Button className="w-full sm:w-auto" variant="danger" onClick={() => deleteService(cat.id, srv.id)}>
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
        footer={
          <div className="flex items-center justify-end gap-2">
                        <Button variant="primary" onClick={saveCategoryName} disabled={!categoryDraftName.trim()}>
              Зберегти
            </Button>
            <Button
              onClick={() => setCategoryModal({ open: false, catId: null })}
            >
              Скасувати
            </Button>

          </div>
        }
      >
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">Назва категорії</label>
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
        title={serviceModal.mode === "add" ? "Додати послугу" : "Редагувати послугу"}
        subtitle="За потреби можна перенести послугу в іншу категорію."
        footer={
          <div className="flex items-center justify-end gap-2">
                        <Button variant="primary" onClick={saveService} disabled={!canSaveServiceDraft(serviceDraft)}>
              Зберегти
            </Button>
            <Button onClick={closeServiceModal}>Скасувати</Button>

          </div>
        }
      >
        <div className="space-y-4">
          {/* category */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">Категорія</label>
            <select
              value={serviceDraft.categoryId || UNCATEGORIZED_ID}
              onChange={(e) => setServiceDraft((p) => ({ ...p, categoryId: e.target.value }))}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/15"
            >
              <option value={UNCATEGORIZED_ID}>Послуги без категорії</option>
              {categories.map((c) => (
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
            <label className="block text-sm font-semibold text-gray-900 mb-1">Назва послуги</label>
            <input
              value={serviceDraft.name}
              onChange={(e) => setServiceDraft((p) => ({ ...p, name: e.target.value }))}
              placeholder="Напр. Нарощування"
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/15"
            />
          </div>

          {/* duration + price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Тривалість</label>
              <select
                value={serviceDraft.duration}
                onChange={(e) =>
                  setServiceDraft((p) => ({ ...p, duration: Number(e.target.value) }))
                }
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/15"
              >
                {durationOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Ціна</label>
              <input
                type="number"
                value={serviceDraft.price}
                onChange={(e) => setServiceDraft((p) => ({ ...p, price: e.target.value }))}
                placeholder="грн"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/15"
              />
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
                onClick={() => setServiceDraft((p) => ({ ...p, allMasters: true, masters: [] }))}
                className={[
                  "rounded-xl px-4 py-2 text-sm font-extrabold border transition",
                  serviceDraft.allMasters
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50",
                ].join(" ")}
              >
                Для всіх майстрів
              </button>

              <button
                type="button"
                onClick={() => setServiceDraft((p) => ({ ...p, allMasters: false }))}
                className={[
                  "rounded-xl px-4 py-2 text-sm font-extrabold border transition",
                  !serviceDraft.allMasters
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50",
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
                <span className="font-extrabold">{(serviceDraft.masters || []).length}</span>
              </p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
