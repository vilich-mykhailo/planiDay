import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useStudio } from "../../context/studio/useStudio";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DESC = 400;
const MAX_PORTFOLIO = 12;
const PUBLIC = import.meta.env.VITE_R2_PUBLIC_BASE_URL;

function fileToPreviewUrl(file) {
  return file ? URL.createObjectURL(file) : "";
}

function toPublicUrl(v) {
  const s = String(v || "").trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s; // вже повний URL
  return PUBLIC ? `${PUBLIC}/${s}` : s; // це key -> робимо URL
}

function Field({ label, hint, error, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-gray-900">{label}</label>
        {hint && <span className="text-xs text-gray-500">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Card({ title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06)]">
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

function completeness(form) {
  const items = [
    {
      key: "name",
      label: "Назва студії",
      ok: Boolean(form.name?.trim()),
    },
    {
      key: "category",
      label: "Категорія",
      ok: Boolean(form.category?.trim()),
    },
    {
      key: "phone",
      label: "Номер телефону",
      ok: Boolean(form.phone?.trim()),
    },

    {
      key: "description",
      label: "Опис",
      ok: Boolean(form.description?.trim()),
    },
    {
      key: "coverUrl",
      label: "Обкладинка",
      ok: Boolean(form.coverUrl?.trim()),
    },
    {
      key: "logoUrl",
      label: "Логотип",
      ok: Boolean(form.logoUrl?.trim()),
    },
    {
      key: "address",
      label: "Адреса",
      ok: Boolean(form.street?.trim() && form.building?.trim()),
    },
    {
      key: "portfolio",
      label: "Портфоліо",
      ok: Array.isArray(form.portfolioUrls) && form.portfolioUrls.length >= 1,
    },
  ];

  const done = items.filter((i) => i.ok).length;
  const total = items.length;
  const percent = Math.round((done / total) * 100);

  // Найперший незаповнений пункт для “що зробити далі”
  const next = items.find((i) => !i.ok);

  return { items, done, total, percent, next };
}

function CollapsibleCard({
  title,
  subtitle,
  children,
  defaultOpen = true,
  rightSlot,
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left border-b border-gray-100 px-5 py-4 flex items-start justify-between gap-3 hover:bg-gray-50 transition"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {rightSlot}
          <span
            className={[
              "grid place-items-center h-9 w-9 rounded-xl border border-gray-200 bg-white transition",
              open ? "rotate-180" : "rotate-0",
            ].join(" ")}
            aria-hidden="true"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </button>

      <div
        className={[
          "grid transition-[grid-template-rows] duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        ].join(" ")}
      >
        <div className="overflow-hidden px-5 py-5">{children}</div>
      </div>
    </section>
  );
}

export default function StudioSettings() {
  const { studio, updateStudio } = useStudio();
  const [searchParams, setSearchParams] = useSearchParams();

const tabFromUrl = searchParams.get("tab");
const initialTab = ["profile", "location", "links"].includes(tabFromUrl)
  ? tabFromUrl
  : "profile";

const [tab, setTab] = useState(initialTab);

function setTabUrl(nextTab) {
  setTab(nextTab);

  setSearchParams((prev) => {
    const p = new URLSearchParams(prev);
    p.set("tab", nextTab);
    return p;
  }, { replace: true });
}
  const [checklistOpen, setChecklistOpen] = useState(false); // ✅ по дефолту сховано
  const [form, setForm] = useState({
    name: "",
    category: "",
    phone: "",
    description: "",
    city: "",
    street: "",
    building: "",
    apartment: "",
    coverUrl: "",
    logoUrl: "",
    portfolioUrls: [],
    coverFile: null,
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
      ? "ring-2 ring-emerald-400/70 bg-emerald-50 border-emerald-300"
      : "ring-2 ring-black/25 bg-gray-50 border-gray-300";
  const baseFieldClass =
    "w-full rounded-xl border border-gray-200 bg-white p-3 text-sm font-medium text-gray-900 outline-none " +
    "transition-[box-shadow,border-color,background-color] " +
    "focus:border-black";

  const [pendingDeletes, setPendingDeletes] = useState([]); // keys які треба видалити після Save

  function stageDelete(key) {
    const k = String(key || "").trim();
    if (!k) return;
    if (/^https?:\/\//i.test(k)) return; // якщо раптом url — не чіпаємо
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
    open: false,
    type: "success",
    title: "",
    text: "",
  });

  function showToast({ type = "success", title, text }) {
    setToast({ open: true, type, title, text });

    clearTimeout(showToast._t);
    const ms = type === "error" ? 4500 : 3200;

    showToast._t = setTimeout(() => {
      setToast((prev) => ({ ...prev, open: false }));
    }, ms);
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
    document.body.classList.add("modal-open"); // у тебе вже є CSS для цього

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("modal-open");
    };
  }, [portfolioPreview.open]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // ✅ важливо: дозволяємо редагування навіть якщо studio ще не прийшов
    if (!studio) {
      setHydrated(true); // тепер dirty може рахуватись від пустого стану
      return;
    }

    setForm({
      name: studio?.name || "",
      category: studio?.category || "",
      phone: studio?.phone || "",
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
  }, [studio]);

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

    if (!form.name.trim()) e.name = "Вкажи назву студії.";
    if (!form.category.trim()) e.category = "Вкажи категорію.";
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

    setPendingDeletes([]); // ✅
    setForm({
      name: studio?.name || "",
      category: studio?.category || "",
      phone: studio?.phone || "",
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
    return data; // { key, url }
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
    return data; // { keys, urls }
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

    // ✅ зберігаємо ЛИШЕ локально, в Cloudflare піде лише після Save
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
      .filter((k) => !/^https?:\/\//i.test(k)); // на всяк випадок

    if (!list.length) return;

    // паралельно (обмежимо батчами, щоб не “задушити” сервер)
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

    // будуємо combined як індекси, а не об’єкти
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

    // ✅ REMOTE
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

    // ✅ LOCAL
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
      // ✅ remote ставимо в чергу на delete після Save
      if (hadRemote) remoteKeys.forEach(stageDelete);

      // ✅ чистимо UI: і remote, і local
      setForm((p) => ({
        ...p,
        portfolioUrls: [],
        portfolioFiles: [],
      }));

      // (опціонально) маленька пауза для “Очищення...”
      await new Promise((r) => setTimeout(r, 350));

      // ✅ правильне повідомлення
      if (hadRemote && hadLocal) {
        showToast({
          type: "success",
          title: "Портфоліо очищено",
          text: "Нові фото прибрано. Старі фото будуть видалені після “Зберегти”.",
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

    // ✅ ставимо в чергу на видалення
    stageDelete(key);

    // ✅ прибираємо з форми одразу (UI)
    setForm((prev) => ({
      ...prev,
      [fieldKey]: "",
      ...(fieldKey === "coverUrl" ? { coverFile: null } : {}),
      ...(fieldKey === "logoUrl" ? { logoFile: null } : {}),
    }));

    // (опціонально) якщо хочеш — тост “буде видалено після збереження”
    showToast({
      type: "success",
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

      // ✅ зберемо все, що треба видалити після збереження
      const deletesAfterSave = [...pendingDeletes];

      // cover upload (якщо міняємо)
      if (form.coverFile) {
        const out = await uploadOne(studio.id, form.coverFile, "cover", token);
        nextCoverKey = out.key;

        // ✅ старий cover в чергу (а не видаляти зараз)
        if (form.coverUrl && form.coverUrl !== out.key) {
          deletesAfterSave.push(form.coverUrl);
        }
      }

      // logo upload
      if (form.logoFile) {
        const out = await uploadOne(studio.id, form.logoFile, "logo", token);
        nextLogoKey = out.key;

        if (form.logoUrl && form.logoUrl !== out.key) {
          deletesAfterSave.push(form.logoUrl);
        }
      }

      // portfolio upload
      if ((form.portfolioFiles?.length || 0) > 0) {
        const out = await uploadMany(studio.id, form.portfolioFiles, token);
        const newKeys = out.keys || [];
        nextPortfolioKeys = [...nextPortfolioKeys, ...newKeys].slice(
          0,
          MAX_PORTFOLIO,
        );
      }

      // ✅ 1) спочатку оновлюємо БД
      await updateStudio({
        name: form.name.trim(),
        category: form.category.trim(),
        phone: form.phone.trim(),
        description: form.description.trim(),
        city: form.city.trim(),
        street: form.street.trim(),
        building: form.building.trim(),
        apartment: form.apartment.trim(),
        coverUrl: nextCoverKey,
        logoUrl: nextLogoKey,
        portfolioUrls: nextPortfolioKeys,
      });

      // ✅ 2) чистимо локальні файли і pendingDeletes
      setForm((p) => ({
        ...p,
        coverUrl: nextCoverKey,
        logoUrl: nextLogoKey,
        portfolioUrls: nextPortfolioKeys,
        coverFile: null,
        logoFile: null,
        portfolioFiles: [],
      }));

      setPendingDeletes([]); // важливо!

      // ✅ 3) і ТІЛЬКИ ТЕПЕР видаляємо з R2 (якщо щось є)
      const uniq = Array.from(new Set(deletesAfterSave)).filter(Boolean);
      if (uniq.length) {
        // якщо хочеш без падіння save при delete-помилці:
        try {
          await deleteManyFromR2(uniq);
        } catch (err) {
          console.error(err);
          showToast({
            type: "error",
            title: "Збережено, але…",
            text: "Не всі старі файли вдалося видалити з Cloudflare.",
          });
        }
      }

      showToast({
        type: "success",
        title: "Збережено",
        text: "Зміни успішно оновлено.",
      });
    } catch (error) {
      console.error(error);
      showToast({
        type: "error",
        title: "Не збережено",
        text: "Сталася помилка. Спробуй ще раз.",
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

    // recreate observer on resize
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

    // ✅ address = підсвітити всі 4 поля, без highlightId
    if (key === "portfolio") {
      setTabUrl("links");

      requestAnimationFrame(() => {
        setTimeout(() => {
          // скролимо до секції портфоліо
          document.getElementById("studio-field-portfolio")?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });

          // підсвічуємо саме кнопку "Додати фото"
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
      value: form.portfolioFiles?.[i], // File
    }));

    return [...remote, ...local].slice(0, MAX_PORTFOLIO);
  }, [form.portfolioUrls, form.portfolioFiles, portfolioPreviewUrls]);

  return (
    <div className="mx-auto max-w-6xl min-h-[100svh] pb-10 md:pb-0">
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

      {/* Top header */}
      <div className="mb-5">
        <div className="flex items-start justify-between gap-4">
          <div ref={headerTriggerRef}>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              Профіль студії
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Створіть профіль, який переконує клієнтів обрати вас.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-2 overflow-x-auto rounded-2xl border border-gray-200 bg-white p-2">
          {[
            { id: "profile", label: "Профіль" },
            { id: "location", label: "Локація" },
            { id: "links", label: "Портфоліо" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTabUrl(t.id)}
              className={[
                "whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition",
                tab === t.id
                  ? "bg-black text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50",
              ].join(" ")}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left column: Preview + Media */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live preview */}
          <div className={tab === "profile" ? "block" : "hidden"}>
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06)]">
              <div
                id="studio-field-coverUrl"
                className={[
                  "relative h-44 bg-gray-100",
                  highlightId === "studio-field-coverUrl" ? highlightClass : "",
                ].join(" ")}
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
                  <div className="flex h-full items-center justify-center px-6 text-center text-sm text-gray-500">
                    <button
                      type="button"
                      onClick={pickCoverFromPreview}
                      onKeyDown={onKeyboardPick(pickCoverFromPreview)}
                      className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-gray-500 hover:text-gray-700 transition"
                      title="Завантажити обкладинку"
                    >
                      + Додати обкладинку
                    </button>
                  </div>
                )}
                {/* ✅ readability overlay */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
                {/* ❌ DELETE COVER */}

                {hasCover && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage("coverUrl");
                    }}
                    className="
                            absolute right-2 top-2 z-10
                            grid h-6 w-6 place-items-center rounded-md
                            bg-white/90 backdrop-blur border border-gray-200
                            text-gray-900 hover:bg-red-50 hover:text-red-600 hover:border-red-200
                            shadow-sm transition
                          "
                    title="Видалити обкладинку"
                    aria-label="Remove cover"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M6 6l12 12M18 6l-12 12"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                )}

                <div className="absolute -bottom-10 left-3 right-3 flex items-end gap-2 min-w-0">
                  <div
                    id="studio-field-logoUrl"
                    className={[
                      "relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-white",
                      highlightId === "studio-field-logoUrl"
                        ? highlightClass
                        : "",
                    ].join(" ")}
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
                        <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-500">
                          + Додати лого
                        </div>
                      )}
                    </button>

                    {/* ❌ DELETE LOGO */}
                    {hasLogo && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage("logoUrl");
                        }}
                        className="
                              absolute right-1 top-1 z-10
                              grid h-5 w-5 place-items-center rounded-md
                              bg-white/90 backdrop-blur border border-gray-200
                              text-gray-900 hover:bg-red-50 hover:text-red-600 hover:border-red-200
                              shadow-sm transition
                            "
                        title="Видалити логотип"
                        aria-label="Remove logo"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M6 6l12 12M18 6l-12 12"
                            stroke="currentColor"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2 flex flex-col justify-end min-h-[44px]">
                    {" "}
                    {/* Назва студії — максимум 2 рядки */}
                    <p
                      className="w-full min-w-0 text-sm sm:text-base font-extrabold text-gray-900 leading-5 line-clamp-2 break-words"
                      title={form.name.trim() ? form.name : "Назва студії"}
                    >
                      {form.name.trim() ? form.name : "Назва студії"}
                    </p>
                    {/* Категорія + місто — максимум 2 рядки */}
                    <p
                      className="w-full min-w-0 text-xs sm:text-sm text-gray-600 line-clamp-2 break-words"
                      title={`${form.category.trim() ? form.category : "Категорія"} • ${
                        form.city.trim() ? form.city : "Місто"
                      }`}
                    >
                      {(form.category.trim() ? form.category : "Категорія") +
                        " • " +
                        (form.city.trim() ? form.city : "Місто")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-3 pb-3 pt-14">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold text-gray-500">Адреса</p>
                  <p
                    className="mt-1 text-sm font-semibold text-gray-900 line-clamp-2 break-words"
                    title={AddressLine}
                  >
                    {AddressLine}
                  </p>

                  <p className="mt-3 text-xs font-semibold text-gray-500">
                    Опис
                  </p>
                  <p className="mt-1 text-sm text-gray-700">
                    {form.description.trim()
                      ? form.description.trim()
                      : "Додай короткий опис: досвід, стиль, стерильність, бренди, гарантії."}
                  </p>
                </div>
              </div>
            </section>
          </div>
          <section className="rounded-2xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06)]">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">
                    Заповненість профілю
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Чим повніший профіль — тим більше записів.
                  </p>
                </div>
                <div
                  className={[
                    "rounded-xl border px-3 py-2 text-sm font-extrabold transition-colors",
                    profile.percent === 100
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-gray-200 bg-gray-50 text-gray-900",
                  ].join(" ")}
                >
                  {profile.percent}%
                </div>
              </div>
            </div>

            <div className="px-5 py-5 space-y-4">
              {/* progress bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>
                    Готово: {profile.done}/{profile.total}
                  </span>
                  <span>{profile.percent}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={[
                      "h-full rounded-full transition-[width,background-color] duration-300",
                      profile.percent === 100 ? "bg-green-500" : "bg-black",
                    ].join(" ")}
                    style={{ width: `${profile.percent}%` }}
                  />
                </div>
              </div>

              {/* next step */}
              {profile.next && (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-center">
                  <p className="text-xs font-semibold text-gray-500">
                    Наступний крок
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {profile.next.label}
                  </p>

                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={goToNextIncomplete}
                      className="rounded-xl bg-black px-4 py-2.5 ui-button-one"
                    >
                      Перейти
                    </button>
                  </div>
                </div>
              )}

              {/* checklist wizard (expand + click -> tab + focus + highlight) */}
              {/* checklist wizard (FULL collapsible) */}
              {(() => {
                const sorted = [...profile.items].sort((a, b) => {
                  if (a.ok === b.ok) return 0;
                  return a.ok ? 1 : -1; // незаповнені зверху
                });

                return (
                  <div className="space-y-3">
                    {/* Toggle row */}
                    <div className="flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setChecklistOpen((v) => !v)}
                        className="ui-button-one flex items-center gap-2"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`h-4 w-4 transition-transform duration-300 ${
                            checklistOpen ? "rotate-180" : ""
                          }`}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>

                        {checklistOpen
                          ? "Сховати кроки заповнення"
                          : "Показати кроки заповнення"}
                      </button>
                    </div>

                    {/* Animated container */}
                    <div
                      className={[
                        "grid transition-[grid-template-rows] duration-300 ease-out",
                        checklistOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                      ].join(" ")}
                    >
                      <div className="overflow-hidden">
                        <div className="grid grid-cols-1 gap-2">
                          {sorted.map((i) => (
                            <button
                              key={i.key}
                              type="button"
                              onClick={() =>
                                goToField(i.key, { tone: "green" })
                              }
                              className="
    group w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-left
    hover:bg-gray-50 active:scale-[0.99] transition
  "
                            >
                              <div className="flex items-center gap-4">
                                {/* LEFT ICON */}
                                <span
                                  className={[
                                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border",
                                    i.ok
                                      ? "border-green-200 bg-green-50 text-green-700"
                                      : "border-gray-200 bg-gray-50 text-gray-700",
                                  ].join(" ")}
                                >
                                  {i.ok ? "✓" : "+"}
                                </span>

                                {/* CENTER CONTENT */}
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-semibold text-gray-900">
                                    {i.label}
                                  </div>

                                  <div className="mt-1 flex items-center justify-between">
                                    <div className="text-xs text-gray-500">
                                      {i.ok
                                        ? "Заповнено"
                                        : "Натисни, щоб додати"}
                                    </div>
                                  </div>
                                </div>

                                {/* RIGHT ARROW (VERTICALLY CENTERED) */}
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center text-gray-400">
                                  <svg
                                    className="transition group-hover:translate-x-0.5"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                  >
                                    <path
                                      d="M9 18l6-6-6-6"
                                      stroke="currentColor"
                                      strokeWidth="2.6"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </section>
        </div>

        {/* Right column: Forms */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={save} className="space-y-6">
            {tab === "profile" && (
              <Card
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
                    <input
                      id="studio-field-category"
                      value={form.category}
                      onChange={(e) => setField("category", e.target.value)}
                      placeholder="Нігті / Барбер / Масаж…"
                      className={fieldClass("studio-field-category")}
                    />
                  </Field>
                  <div className="sm:col-span-2">
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
                  </div>

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
                    <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-500">
                          Рекомендація
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          Детальний опис допомагає клієнтам краще зрозуміти ваш
                          досвід і підвищує ймовірність запису. Опишіть свою
                          спеціалізацію, підхід до роботи та ключові переваги.
                        </p>
                      </div>

                      {/* divider */}
                      <div className="h-px bg-gray-200" />

                      {/* additional tips */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500">
                          Що варто вказати:
                        </p>

                        <ul className="mt-1 space-y-1 text-sm text-gray-700">
                          <li>• Скільки років досвіду має студія</li>
                          <li>• Які послуги або техніки ви використовуєте</li>
                          <li>• Які бренди матеріалів застосовуєте</li>
                          <li>• Чим ви відрізняєтесь від інших</li>
                          <li>• Гарантії, стерильність або сертифікацію</li>
                        </ul>
                      </div>

                      {/* extra highlight */}
                      <div className="rounded-lg bg-white border border-gray-200 px-3 py-2">
                        <p className="text-xs text-gray-600">
                          💡 Студії з повним описом отримують більше переглядів
                          і записів.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {tab === "location" && (
              <Card
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

                  <div className="sm:col-span-2 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs font-semibold text-gray-500">
                      Перевірка
                    </p>

                    <p
                      className="mt-1 text-sm font-semibold text-gray-900 line-clamp-2 break-words"
                      title={AddressLine}
                    >
                      {AddressLine}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {tab === "links" && (
              <Card
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
                      {/* actions */}
                      <div className="flex flex-wrap items-center gap-2">
                        <label
                          id="studio-field-portfolio-add"
                          className={[
                            "ui-button-primary",
                            highlightId === "studio-field-portfolio-add"
                              ? highlightClass
                              : "",
                          ].join(" ")}
                        >
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
                          <button
                            type="button"
                            onClick={clearPortfolio}
                            disabled={
                              !portfolioCount || clearingPortfolio || saving
                            }
                            className={[
                              "ui-button-danger",
                              clearingPortfolio || saving
                                ? "opacity-60 cursor-not-allowed"
                                : "",
                            ].join(" ")}
                          >
                            {clearingPortfolio ? "Очищення..." : "Очистити"}
                          </button>
                        )}
                      </div>

                      {/* Grid preview */}
                      <div className="mt-4">
                        {!hasAnyPortfolio ? (
                          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                            Додай фото робіт — це найсильніший доказ якості.
                          </div>
                        ) : (
                          <div
                            className="
                                      grid gap-4
                                      grid-cols-2
                                      sm:grid-cols-3
                                      lg:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]
                                    "
                          >
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
                                    className="
          group block w-full overflow-hidden rounded-2xl
          border border-gray-200 bg-gray-100
          hover:shadow-md transition
        "
                                    style={{ aspectRatio: "1 / 1" }}
                                  >
                                    <img
                                      src={src}
                                      alt={`work ${idx + 1}`}
                                      className="h-full w-full object-cover"
                                    />

                                    {/* bottom toolbar */}
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
                                            className="
                          flex h-9 w-9 items-center justify-center rounded-full
                          bg-white/90 text-gray-900
                          backdrop-blur-md
                          shadow-sm ring-1 ring-black/5
                          hover:bg-white hover:shadow-md
                          active:scale-95 transition-all
                          disabled:opacity-30 disabled:hover:bg-white/90 disabled:shadow-sm
                        "
                                            title="Вліво"
                                            aria-label="Move left"
                                          >
                                            <svg
                                              width="16"
                                              height="16"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                            >
                                              <path
                                                d="M15 18l-6-6 6-6"
                                                stroke="currentColor"
                                                strokeWidth="2.4"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              />
                                            </svg>
                                          </button>

                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              movePortfolioMixed(idx, idx + 1);
                                            }}
                                            disabled={isLast}
                                            className="
                          flex h-9 w-9 items-center justify-center rounded-full
                          bg-white/90 text-gray-900
                          backdrop-blur-md
                          shadow-sm ring-1 ring-black/5
                          hover:bg-white hover:shadow-md
                          active:scale-95 transition-all
                          disabled:opacity-30 disabled:hover:bg-white/90 disabled:shadow-sm
                        "
                                            title="Вправо"
                                            aria-label="Move right"
                                          >
                                            <svg
                                              width="16"
                                              height="16"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                            >
                                              <path
                                                d="M9 18l6-6-6-6"
                                                stroke="currentColor"
                                                strokeWidth="2.4"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              />
                                            </svg>
                                          </button>
                                        </div>

                                        {/* delete */}
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            removePortfolioMixed(idx);
                                          }}
                                          className="
                                              flex h-9 w-9 items-center justify-center rounded-full
                                              bg-white/90 text-gray-900
                                              backdrop-blur-md
                                              shadow-sm ring-1 ring-black/5
                                              hover:bg-red-50 hover:text-red-600 hover:ring-red-200 hover:shadow-md
                                              active:scale-95 transition-all
                                            "
                                          title="Видалити"
                                          aria-label="Remove"
                                        >
                                          <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                          >
                                            <path
                                              d="M6 6l12 12M18 6l-12 12"
                                              stroke="currentColor"
                                              strokeWidth="2.4"
                                              strokeLinecap="round"
                                            />
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                  </button>

                                  <div className="mt-1 text-center text-xs text-gray-500">
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
              </Card>
            )}

            {/* Desktop buttons inside form are hidden (we have top bar). Keep mobile bar below */}
          </form>
        </div>
      </div>

      {/* Professional Toast */}
<div
  className={[
    "fixed z-[90] left-1/2 top-[calc(12px+env(safe-area-inset-top))] -translate-x-1/2 md:left-4 md:bottom-6 md:top-auto md:translate-x-0",
    "w-[calc(100%-2rem)] max-w-[420px] md:w-auto md:min-w-[260px] md:max-w-[340px]",
    "transition-all duration-300",
    toast.open
      ? "opacity-100 translate-y-0"
      : "pointer-events-none opacity-0 -translate-y-3",
  ].join(" ")}
  role="status"
  aria-live="polite"
>
  <div
    className={[
      "relative overflow-hidden rounded-2xl border bg-white",
      "shadow-[0_12px_30px_rgba(0,0,0,0.16)]",
      toast.type === "success"
        ? "border-emerald-300"
        : toast.type === "warning"
        ? "border-amber-300"
        : "border-red-300",
    ].join(" ")}
  >
    {/* Glow */}
    <div
      className={[
        "pointer-events-none absolute -inset-10 blur-2xl opacity-30",
        toast.type === "success"
          ? "bg-emerald-300"
          : toast.type === "warning"
          ? "bg-amber-300"
          : "bg-red-300",
      ].join(" ")}
    />

    {/* Left accent */}
    <div
      className={[
        "absolute left-0 top-0 h-full w-1.5",
        toast.type === "success"
          ? "bg-emerald-500"
          : toast.type === "warning"
          ? "bg-amber-500"
          : "bg-red-500",
      ].join(" ")}
    />

    <div className="relative flex items-start gap-3 p-4 pl-5">
      {/* Icon bubble */}
      <div
        className={[
          "flex h-10 w-10 items-center justify-center rounded-xl",
          "shadow-[0_6px_14px_rgba(0,0,0,0.12)]",
          "animate-[toastPop_260ms_ease-out]",
          toast.type === "success"
            ? "bg-emerald-600 text-white"
            : toast.type === "warning"
            ? "bg-amber-500 text-white"
            : "bg-red-600 text-white",
        ].join(" ")}
        aria-hidden="true"
      >
        {toast.type === "success" && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 6L9 17l-5-5"
              stroke="#ffffff"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}

        {toast.type === "warning" && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 9v4"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
            <path
              d="M12 16h.01"
              stroke="currentColor"
              strokeWidth="3.6"
              strokeLinecap="round"
            />
          </svg>
        )}

        {toast.type === "error" && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 6l12 12M18 6l-12 12"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>

      {/* Text */}
      <div className="min-w-0">
        <p className="text-sm font-extrabold text-gray-900 leading-5">
          {toast.title}
        </p>
        <p className="mt-1 text-sm text-gray-700 leading-5">
          {toast.text}
        </p>
      </div>
    </div>

    {/* Progress bar */}
    <div className="h-[4px] w-full bg-gray-100">
      <div
        className={[
          "h-full w-full origin-left animate-[toastbar_3.2s_linear_forwards]",
          toast.type === "success"
            ? "bg-emerald-500"
            : toast.type === "warning"
            ? "bg-amber-500"
            : "bg-red-500",
        ].join(" ")}
      />
    </div>
  </div>
</div>

      {portfolioPreview.open && (
        <div
          className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPortfolioPreview({ open: false, src: "" })}
        >
          <div className="max-w-3xl w-full">
            <img
              src={portfolioPreview.src}
              alt="Portfolio preview"
              className="w-full max-h-[80dvh] object-contain rounded-2xl bg-black"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-gray-900"
                onClick={() => setPortfolioPreview({ open: false, src: "" })}
              >
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error modal */}
      {errorModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 z-[9999]">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-extrabold text-gray-900">
              {errorModal.title}
            </h3>
            <p className="mt-2 text-sm text-gray-700">{errorModal.message}</p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  setErrorModal({ open: false, title: "", message: "" })
                }
                className="rounded-xl bg-black px-5 py-2.5 text-sm font-bold text-white hover:bg-gray-900"
              >
                Зрозуміло
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Top-right Save (appears only when header is visible) */}
      <div
        className={[
          "fixed right-4 z-[9999] transition-all duration-300",
          checklistOpen ? "top-20" : "top-4",
          floatingVisible
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-2 pointer-events-none",
        ].join(" ")}
      ></div>

      {/* Mobile bottom actions */}
      <div className="fixed inset-x-0 bottom-0 md:hidden z-[60]">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/95 to-transparent" />

        <div className="relative mx-auto max-w-5xl px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="flex gap-2">
            {/* Save */}
            <button
              type="button"
              onClick={save}
              disabled={!canSave}
              className={[
                "w-1/2 rounded-2xl px-4 py-3 text-sm font-extrabold transition active:scale-[0.99]",
                canSave ? "ui-button-primary" : "ui-button-primary",
              ].join(" ")}
            >
              {saving ? "Збереження..." : "Зберегти"}
            </button>
            {/* Cancel */}
            <button
              type="button"
              onClick={resetChanges}
              disabled={!dirty || saving}
              className={[
                "w-1/2 rounded-2xl px-4 py-3 text-sm font-extrabold transition active:scale-[0.99]",
                dirty && !saving
                  ? "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50"
                  : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed",
              ].join(" ")}
            >
              Скасувати
            </button>
          </div>
        </div>
      </div>

      {/* Tablet + Desktop bottom-right actions */}
      <div className="hidden md:block fixed right-6 bottom-6 z-[80]">
        <div className="flex items-center gap-3">
          {hasPendingChanges && (
            <span className="mr-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 pill-enter">
              Збережи зміни
            </span>
          )}
          {/* Save */}
          <button
            type="button"
            onClick={save}
            disabled={!canSave}
            className={[
              "rounded-2xl px-6 py-3 text-sm font-extrabold shadow-sm",
              "transition active:scale-[0.98]",
              canSave ? "ui-button-primary" : "ui-button-primary",
            ].join(" ")}
          >
            {saving ? "Збереження..." : "Зберегти"}
          </button>
          {/* Cancel */}
          <button
            type="button"
            onClick={resetChanges}
            disabled={!dirty || saving}
            className={[
              "rounded-2xl px-5 py-3 text-sm font-extrabold shadow-sm",
              "transition active:scale-[0.98]",
              dirty && !saving ? "ui-button-cancel" : "ui-button-cancel",
            ].join(" ")}
          >
            Скасувати
          </button>
        </div>
      </div>
    </div>
  );
}
