import { useEffect, useMemo, useRef, useState } from "react";
import { useStudio } from "../../context/studio/useStudio";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DESC = 400;
const MAX_PORTFOLIO = 12;
const PUBLIC = import.meta.env.VITE_R2_PUBLIC_BASE_URL;

function toPublicUrl(v) {
  const s = String(v || "").trim();
  if (!s) return "";
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
  const [checklistOpen, setChecklistOpen] = useState(false); // ✅ по дефолту сховано
  const [tab, setTab] = useState("profile"); // profile | location | links
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
  });

  const [highlightId, setHighlightId] = useState("");
  const [highlightAddress, setHighlightAddress] = useState(false);

  // ✅ нове
  const [highlightTone, setHighlightTone] = useState("green"); // "green" | "default"

  // ✅ один клас на всі кейси
  const highlightClass =
    highlightTone === "green"
      ? "ring-2 ring-emerald-400/70 bg-emerald-50 border-emerald-300"
      : "ring-2 ring-black/25 bg-gray-50 border-gray-300";
  const baseFieldClass =
    "w-full rounded-xl border border-gray-200 bg-white p-3 text-sm font-medium text-gray-900 outline-none " +
    "transition-[box-shadow,border-color,background-color] " +
    "focus:border-black";

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
    type: "success", // success | error
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

  const hasCover = Boolean(form.coverUrl?.trim());
  const hasLogo = Boolean(form.logoUrl?.trim());
  const [portfolioPreview, setPortfolioPreview] = useState({
    open: false,
    src: "",
  });
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
    if (!studio) return;

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
    });

    setHydrated(true);
  }, [studio]);

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
        JSON.stringify(form.portfolioUrls || [])
    );
  }, [studio, form]);

  function resetChanges() {
    if (!studio) return;

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
    });
  }

  const dirty = hydrated ? rawDirty : false;
  const hasPendingChanges = dirty;
  const canSave = dirty && Object.keys(errors).length === 0 && !saving;

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

  async function pickImage(e, key) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!studio?.id) return;
    if (file.size > MAX_IMAGE_SIZE) {
      setErrorModal({
        open: true,
        title: "Файл завеликий",
        message: "До 5 MB.",
      });
      e.target.value = "";
      return;
    }

    try {
      const token = localStorage.getItem("token"); // якщо треба
      const kind = key === "coverUrl" ? "cover" : "logo";

      const out = await uploadOne(studio.id, file, kind, token);
      setForm((prev) => ({ ...prev, [key]: out.key })); // зберігаємо key
    } catch (err) {
      console.error(err);
      setErrorModal({
        open: true,
        title: "Помилка",
        message: err.message || "Upload failed",
      });
    } finally {
      e.target.value = "";
    }
  }

  async function pickPortfolioImages(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;

    const left = MAX_PORTFOLIO - (form.portfolioUrls?.length || 0);
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

    try {
      const token = localStorage.getItem("token");
      const out = await uploadMany(studio.id, okFiles, token);

      const keys = out.keys || [];
      setForm((prev) => ({
        ...prev,
        portfolioUrls: [...(prev.portfolioUrls || []), ...keys].slice(
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
    } catch (err) {
      console.error(err);
      setErrorModal({
        open: true,
        title: "Помилка",
        message: err.message || "Upload failed",
      });
    }
  }

  async function deleteFromR2(key) {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/media/delete`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ key }),
    }
  );

  if (!res.ok) throw new Error("Delete failed");
}

async function removePortfolio(index) {
  const key = form.portfolioUrls[index];
  if (!key) return;

  try {
    await deleteFromR2(key);

    setForm((prev) => ({
      ...prev,
      portfolioUrls: prev.portfolioUrls.filter((_, i) => i !== index),
    }));
  } catch (err) {
    console.error(err);
    showToast({
      type: "error",
      title: "Помилка",
      text: "Не вдалося видалити фото.",
    });
  }
}

  function movePortfolio(from, to) {
    setForm((prev) => {
      const arr = [...(prev.portfolioUrls || [])];
      if (to < 0 || to >= arr.length) return prev;
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return { ...prev, portfolioUrls: arr };
    });
  }

  // 👉 ВСТАВИТИ ОДРАЗУ ТУТ
async function removeImage(fieldKey) {
  const key = form[fieldKey];
  if (!key) return;

  try {
    await deleteFromR2(key);

    setForm((prev) => ({
      ...prev,
      [fieldKey]: "",
    }));

    showToast({
      type: "success",
      title: "Фото видалено",
      text: "Файл успішно видалено з сервера.",
    });
  } catch (err) {
    console.error(err);
    showToast({
      type: "error",
      title: "Помилка",
      text: "Не вдалося видалити фото.",
    });
  }
}

  async function save(e) {
    e?.preventDefault?.();
    if (!canSave) return;

    setSaving(true);
    try {
      await updateStudio({
        name: form.name.trim(),
        category: form.category.trim(),
        phone: form.phone.trim(),
        description: form.description.trim(),
        city: form.city.trim(),
        street: form.street.trim(),
        building: form.building.trim(),
        apartment: form.apartment.trim(),
        coverUrl: form.coverUrl || "",
        logoUrl: form.logoUrl || "",
        portfolioUrls: form.portfolioUrls || [],
      });

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
    setTab(nextTab);

    // ✅ address = підсвітити всі 4 поля, без highlightId
    if (key === "portfolio") {
      setTab("links");

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
      setTab("profile");
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
      setTab("profile");
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
              onClick={() => setTab(t.id)}
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
          <div className={tab === "profile" ? "block" : "hidden md:block"}>
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
                      src={toPublicUrl(form.coverUrl)}
                      alt="Обкладинка"
                      className="h-full w-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = "none")}
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
                          src={toPublicUrl(form.logoUrl)}
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

                  <div className="min-w-0 rounded-xl border border-white/70 bg-white/95 backdrop-blur-md shadow-lg px-3 py-2 flex flex-col justify-end min-h-[44px]">
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
                        className="ui-button-one"
                      >
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
                      hint={`${form.portfolioUrls?.length || 0}/${MAX_PORTFOLIO}`}
                    >
                      {/* actions */}
                      <div className="flex flex-wrap items-center gap-2">
                        <label
                          id="studio-field-portfolio-add"
                          className={[
                            "inline-flex cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 active:scale-[0.99] transition",
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

                        {Boolean(form.portfolioUrls?.length) && (
                          <button
                            type="button"
                            onClick={() =>
                              setForm((p) => ({ ...p, portfolioUrls: [] }))
                            }
                            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 active:scale-[0.99] transition"
                          >
                            Очистити
                          </button>
                        )}
                      </div>

                      {/* Grid preview */}
                      <div className="mt-4">
                        {!form.portfolioUrls?.length ? (
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
                            {form.portfolioUrls.map((src, idx) => {
                              const isFirst = idx === 0;
                              const isLast =
                                idx === form.portfolioUrls.length - 1;

                              return (
                                <div key={`${src}-${idx}`} className="relative">
                                  {/* image */}
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
                                      src={toPublicUrl(src)}
                                      alt={`work ${idx + 1}`}
                                      className="h-full w-full object-cover"
                                    />

                                    {/* bottom toolbar */}
                                    <div className="pointer-events-none absolute inset-x-0 bottom-0 p-2">
                                      {/* gradient overlay */}
                                      <div className="absolute inset-x-0 bottom-0 h-16 rounded-b-2xl bg-gradient-to-t from-black/60 via-black/25 to-transparent" />

                                      <div className="pointer-events-auto relative flex items-center justify-between">
                                        {/* left/right */}
                                        <div className="flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              movePortfolio(idx, idx - 1);
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
                                              movePortfolio(idx, idx + 1);
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
                                            removePortfolio(idx);
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

      {/* Mobile Save Button — iOS safe */}
      {/* <div className="fixed inset-x-0 bottom-0 md:hidden isolate">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 -z-10 bg-gradient-to-t from-white via-white/95 to-transparent" />

        <div className="relative z-10 mx-auto max-w-6xl px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={save}
            disabled={!canSave}
            className="
        w-full rounded-2xl bg-black px-5 py-4
        text-sm font-bold text-white
        shadow-[0_10px_30px_rgba(0,0,0,0.25)]
        active:scale-[0.99]
        disabled:opacity-40 disabled:shadow-none
        transition-all
      "
          >
            {saving ? "Збереження..." : "Зберегти"}
          </button>
        </div>
      </div> */}

      {/* Professional Toast */}
      <div
        className={[
          // ✅ Mobile: top-center
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
            toast.type === "success" ? "border-emerald-300" : "border-red-300",
          ].join(" ")}
        >
          {/* Glow */}
          <div
            className={[
              "pointer-events-none absolute -inset-10 blur-2xl opacity-30",
              toast.type === "success" ? "bg-emerald-300" : "bg-red-300",
            ].join(" ")}
          />

          {/* Left accent */}
          <div
            className={[
              "absolute left-0 top-0 h-full w-1.5",
              toast.type === "success" ? "bg-emerald-500" : "bg-red-500",
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
                  : "bg-red-600 text-white",
              ].join(" ")}
              aria-hidden="true"
            >
              {toast.type === "success" ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="#ffffff"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 9v5"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 17h.01"
                    stroke="currentColor"
                    strokeWidth="3.6"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>

            {/* Text */}
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-gray-900 leading-5">
                {toast.title ||
                  (toast.type === "success" ? "Збережено" : "Помилка")}
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
                toast.type === "success" ? "bg-emerald-500" : "bg-red-500",
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
              src={toPublicUrl(portfolioPreview.src)}
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
                canSave
                  ? "bg-black text-white hover:bg-gray-900"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed",
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
              canSave ? "ui-button-one" : "ui-button-one",
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
              dirty && !saving ? "ui-button" : "ui-button",
            ].join(" ")}
          >
            Скасувати
          </button>
        </div>
      </div>
    </div>
  );
}
