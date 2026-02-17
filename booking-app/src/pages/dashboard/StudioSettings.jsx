import { useEffect, useMemo, useRef, useState } from "react";
import { useStudio } from "../../context/studio/useStudio";

const MAX_IMAGE_SIZE = 1024 * 1024; // 1MB
const MAX_DESC = 400;
const MAX_PORTFOLIO = 12;

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function isHttpUrl(value) {
  if (!value?.trim()) return true;
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
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
    { key: "name", label: "Назва студії", ok: !!form.name?.trim() },
    { key: "category", label: "Категорія", ok: !!form.category?.trim() },
    {
      key: "description",
      label: "Опис",
      ok: !!form.description?.trim(), // будь-який непорожній текст = готово
    },
    { key: "coverUrl", label: "Обкладинка", ok: !!form.coverUrl?.trim() },
    { key: "logoUrl", label: "Логотип", ok: !!form.logoUrl?.trim() },
    { key: "city", label: "Місто", ok: !!form.city?.trim() },
    {
      key: "address",
      label: "Адреса (вулиця + будинок)",
      ok: !!form.street?.trim() && !!form.building?.trim(),
    },
    {
      key: "portfolio",
      label: "Портфоліо",
      ok: (form.portfolioUrls?.length || 0) >= 4,
    },

    { key: "instagram", label: "Instagram", ok: !!form.instagram?.trim() },
  ];

  const done = items.filter((i) => i.ok).length;
  const total = items.length;
  const percent = Math.round((done / total) * 100);

  // Найперший незаповнений пункт для “що зробити далі”
  const next = items.find((i) => !i.ok);

  return { items, done, total, percent, next };
}

export default function StudioSettings() {
  const { studio, updateStudio } = useStudio();

  const [tab, setTab] = useState("profile"); // profile | location | links
  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    city: "",
    street: "",
    building: "",
    apartment: "",
    instagram: "",
    website: "",
    coverUrl: "",
    logoUrl: "",
    portfolioUrls: [],
  });

  useEffect(() => {
    setForm({
      name: studio?.name || "",
      category: studio?.category || "",
      description: studio?.description || "",
      city: studio?.city || "",
      street: studio?.street || "",
      building: studio?.building || "",
      apartment: studio?.apartment || "",
      instagram: studio?.instagram || "",
      website: studio?.website || "",
      coverUrl: studio?.coverUrl || "",
      logoUrl: studio?.logoUrl || "",
      portfolioUrls: Array.isArray(studio?.portfolioUrls)
        ? studio.portfolioUrls
        : [],
    });
  }, [studio]);

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

  const dirty = useMemo(() => {
    const currentPortfolio = Array.isArray(studio?.portfolioUrls)
      ? studio.portfolioUrls
      : [];

    return (
      (studio?.name || "") !== form.name ||
      (studio?.category || "") !== form.category ||
      (studio?.description || "") !== form.description ||
      (studio?.city || "") !== form.city ||
      (studio?.street || "") !== form.street ||
      (studio?.building || "") !== form.building ||
      (studio?.apartment || "") !== form.apartment ||
      (studio?.instagram || "") !== form.instagram ||
      (studio?.website || "") !== form.website ||
      (studio?.coverUrl || "") !== form.coverUrl ||
      (studio?.logoUrl || "") !== form.logoUrl ||
      JSON.stringify(currentPortfolio) !==
        JSON.stringify(form.portfolioUrls || [])
    );
  }, [studio, form]);

  const errors = useMemo(() => {
    const e = {};

    if (!form.name.trim()) e.name = "Вкажи назву студії.";
    if (!form.category.trim()) e.category = "Вкажи категорію.";
    if (form.description.length > MAX_DESC) e.description = "Опис завеликий.";

    if (!isHttpUrl(form.instagram)) e.instagram = "Некоректний URL Instagram.";
    if (!isHttpUrl(form.website)) e.website = "Некоректний URL сайту.";

    if ((form.portfolioUrls?.length || 0) > MAX_PORTFOLIO) {
      e.portfolioUrls = `Максимум ${MAX_PORTFOLIO} фото.`;
    }

    return e;
  }, [form]);

  const canSave = dirty && Object.keys(errors).length === 0 && !saving;

  function setField(name, value) {
    if (name === "description" && value.length > MAX_DESC) return;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function pickImage(e, key) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE) {
      setErrorModal({
        open: true,
        title: "Файл завеликий",
        message: "Обери фото розміром до 1 MB.",
      });
      e.target.value = "";
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);

      // страховка від “важких” base64
      if (dataUrl.length > 1_500_000) {
        setErrorModal({
          open: true,
          title: "Фото надто важке",
          message: "Стисни фото або обери інше зображення.",
        });
        e.target.value = "";
        return;
      }

      setForm((prev) => ({ ...prev, [key]: dataUrl }));
    } catch (err) {
      console.error(err);
      setErrorModal({
        open: true,
        title: "Помилка завантаження",
        message: "Не вдалося обробити зображення. Спробуй інше фото.",
      });
    } finally {
      e.target.value = "";
    }
  }

  async function pickPortfolioImages(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const left = MAX_PORTFOLIO - (form.portfolioUrls?.length || 0);
    const take = files.slice(0, Math.max(0, left));

    let skipped = 0;

    try {
      const dataUrls = [];

      for (const file of take) {
        if (file.size > MAX_IMAGE_SIZE) {
          skipped++;
          continue;
        }

        const dataUrl = await fileToDataUrl(file);
        if (dataUrl.length > 1_500_000) {
          skipped++;
          continue;
        }

        dataUrls.push(dataUrl);
      }

      if (!dataUrls.length) {
        setErrorModal({
          open: true,
          title: "Не вдалося додати фото",
          message: "Фото завеликі або не підтримуються. Обери інші (до 1MB).",
        });
        return;
      }

      setForm((prev) => ({
        ...prev,
        portfolioUrls: [...(prev.portfolioUrls || []), ...dataUrls].slice(
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
    } finally {
      e.target.value = "";
    }
  }

  function removePortfolio(index) {
    setForm((prev) => ({
      ...prev,
      portfolioUrls: prev.portfolioUrls.filter((_, i) => i !== index),
    }));
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

  function removeImage(key) {
    setForm((prev) => ({ ...prev, [key]: "" }));
  }

  async function save(e) {
    e?.preventDefault?.();
    if (!canSave) return;

    setSaving(true);
    try {
      await updateStudio({
        name: form.name.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
        city: form.city.trim(),
        street: form.street.trim(),
        building: form.building.trim(),
        apartment: form.apartment.trim(),
        instagram: form.instagram.trim(),
        website: form.website.trim(),
        coverUrl: form.coverUrl,
        logoUrl: form.logoUrl,
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

useEffect(() => {
  const el = headerTriggerRef.current;
  if (!el) return;

  const io = new IntersectionObserver(
    ([entry]) => {
      // ✅ показуємо коли заголовок ВЖЕ НЕ ВИДНО (ти проскролив нижче)
      setShowTopSave(!entry.isIntersecting);
    },
    {
      threshold: 0,
      // (опційно) зробити появу трохи раніше/пізніше:
      // rootMargin: "-8px 0px 0px 0px",
    }
  );

  io.observe(el);
  return () => io.disconnect();
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
  const [profileExpanded, setProfileExpanded] = useState(false);
  const [highlightId, setHighlightId] = useState("");

  const FIELD_ID = {
    name: "studio-field-name",
    category: "studio-field-category",
    description: "studio-field-description",

    city: "studio-field-city",
    street: "studio-field-street",
    building: "studio-field-building",
    apartment: "studio-field-apartment",

    instagram: "studio-field-instagram",
    website: "studio-field-website",
    portfolio: "studio-field-portfolio",

    coverUrl: "studio-field-coverUrl",
    logoUrl: "studio-field-logoUrl",

    address: "studio-field-street",
  };

  function resolveTabByKey(key) {
    if (["city", "street", "building", "apartment", "address"].includes(key)) {
      return "location";
    }
    if (["portfolio", "instagram", "website"].includes(key)) {
      return "links";
    }
    return "profile";
  }

  function goToField(key) {
    const nextTab = resolveTabByKey(key);
    setTab(nextTab);

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

        // focus only if it's focusable (input/textarea/select)
        if (typeof el.focus === "function") {
          el.focus({ preventScroll: true });
        } else {
          const focusable = el.querySelector?.(
            "input, textarea, select, button",
          );
          focusable?.focus?.({ preventScroll: true });
        }

        // glow highlight
        setHighlightId(id);
        window.setTimeout(() => setHighlightId(""), 1600);
      }, 120);
    });
  }

  return (
    <div className="mx-auto max-w-6xl min-h-[100dvh] pb-32 md:pb-0">
      {/* Top header */}
      <div className="mb-5">
        <div className="flex items-start justify-between gap-4">
<div ref={headerTriggerRef}>
  <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
    Профіль студії
  </h1>
  <p className="mt-1 text-sm text-gray-600">
    Оформлення як у топових сервісах: превʼю + вкладки + швидке збереження.
  </p>
</div>


          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={save}
              disabled={!canSave}
              className="rounded-xl bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-gray-900 disabled:opacity-40"
            >
              {saving ? "Збереження..." : "Зберегти"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-2 overflow-x-auto rounded-2xl border border-gray-200 bg-white p-2">
          {[
            { id: "profile", label: "Профіль" },
            { id: "location", label: "Локація" },
            { id: "links", label: "Посилання" },
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
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06)]">
            <div className="relative h-44 bg-gray-100">
              {hasCover ? (
                <img
                  src={form.coverUrl}
                  alt="Обкладинка"
                  className="h-full w-full object-cover"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm text-gray-500">
                  Додай обкладинку, щоб профіль виглядав як у Booksy ✨
                </div>
              )}

              <div className="absolute -bottom-10 left-5 flex items-end gap-3">
                <div className="h-20 w-20 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                  {hasLogo ? (
                    <img
                      src={form.logoUrl}
                      alt="Лого"
                      className="h-full w-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-500">
                      Лого
                    </div>
                  )}
                </div>

                <div className="pb-2">
                  <p className="text-xs font-semibold text-gray-500">Превʼю</p>
                  <p className="text-base font-extrabold text-gray-900">
                    {form.name.trim() ? form.name : "Назва студії"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {(form.category.trim() ? form.category : "Категорія") +
                      " • " +
                      (form.city.trim() ? form.city : "Місто")}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-5 pb-5 pt-14">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold text-gray-500">Адреса</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {AddressLine}
                </p>

                <p className="mt-3 text-xs font-semibold text-gray-500">Опис</p>
                <p className="mt-1 text-sm text-gray-700">
                  {form.description.trim()
                    ? form.description.trim()
                    : "Додай короткий опис: досвід, стиль, стерильність, бренди, гарантії."}
                </p>
              </div>
            </div>
          </section>
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
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-extrabold text-gray-900">
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
                    className="h-full rounded-full bg-black transition-[width] duration-300"
                    style={{ width: `${profile.percent}%` }}
                  />
                </div>
              </div>

              {/* next step */}
              {profile.next && (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold text-gray-500">
                    Наступний крок
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {profile.next.label}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        // груба але ефективна навігація по вкладках
                        if (["city", "address"].includes(profile.next.key))
                          setTab("location");
                        else if (
                          ["portfolio", "instagram"].includes(profile.next.key)
                        )
                          setTab("links");
                        else setTab("profile");

                        // трохи UX — прокрутка до верху форми
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white hover:bg-gray-900"
                    >
                      Перейти
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        window.scrollTo({ top: 0, behavior: "smooth" })
                      }
                      className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-900 hover:bg-gray-50"
                    >
                      Переглянути
                    </button>
                  </div>
                </div>
              )}

              {/* checklist wizard (expand + click -> tab + focus + highlight) */}
              {(() => {
                const collapsedCount = 6;
                const isLong = profile.items.length > collapsedCount;

                const sorted = [...profile.items].sort((a, b) => {
                  if (a.ok === b.ok) return 0;
                  return a.ok ? 1 : -1; // незаповнені зверху
                });

                // оцінка висоти згорнутого стану (приблизно під 6 рядків)
                const collapsedMax = 420;

                // великий maxHeight для розгорнутого (щоб точно вмістилось)
                const expandedMax = 2000;

                return (
                  <div className="space-y-3">
                    <div
                      className="overflow-hidden transition-[max-height] duration-300 ease-out"
                      style={{
                        maxHeight: profileExpanded ? expandedMax : collapsedMax,
                      }}
                    >
                      <div className="grid grid-cols-1 gap-2">
                        {sorted.map((i) => (
                          <button
                            key={i.key}
                            type="button"
                            onClick={() => goToField(i.key)}
                            className={[
                              "group flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left",
                              "hover:bg-gray-50 active:scale-[0.99] transition",
                            ].join(" ")}
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              {/* status icon */}
                              <span
                                className={[
                                  "flex h-8 w-8 items-center justify-center rounded-xl border",
                                  i.ok
                                    ? "border-green-200 bg-green-50 text-green-700"
                                    : "border-gray-200 bg-gray-50 text-gray-700",
                                ].join(" ")}
                                aria-hidden="true"
                              >
                                {i.ok ? (
                                  <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                  >
                                    <path
                                      d="M20 6L9 17l-5-5"
                                      stroke="currentColor"
                                      strokeWidth="2.6"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                  >
                                    <path
                                      d="M12 7v10"
                                      stroke="currentColor"
                                      strokeWidth="2.6"
                                      strokeLinecap="round"
                                    />
                                    <path
                                      d="M7 12h10"
                                      stroke="currentColor"
                                      strokeWidth="2.6"
                                      strokeLinecap="round"
                                    />
                                  </svg>
                                )}
                              </span>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-gray-900">
                                  {i.label}
                                </p>
                                <p className="mt-0.5 text-xs text-gray-500">
                                  {i.ok ? "Заповнено" : "Натисни, щоб додати"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={[
                                  "text-xs font-extrabold rounded-full px-3 py-1 border",
                                  i.ok
                                    ? "border-green-200 bg-green-50 text-green-700"
                                    : "border-gray-200 bg-gray-50 text-gray-700",
                                ].join(" ")}
                              >
                                {i.ok ? "Готово" : "Додати"}
                              </span>

                              <span
                                className="text-gray-400 transition group-hover:translate-x-0.5"
                                aria-hidden="true"
                              >
                                <svg
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

                    {isLong && (
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          {profileExpanded
                            ? "Показані всі пункти"
                            : `+ ще ${profile.items.length - collapsedCount} пункт(и)`}
                        </p>

                        <button
                          type="button"
                          onClick={() => setProfileExpanded((v) => !v)}
                          className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-900 hover:bg-gray-50"
                        >
                          {profileExpanded ? "Сховати" : "Показати всі"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </section>

          {/* Media actions */}
          <Card
            title="Медіа профілю"
            subtitle="Обкладинка та логотип — це перше, що бачить клієнт."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* COVER */}
              <div
                id="studio-field-coverUrl"
                className={[
                  "space-y-2 rounded-2xl",
                  highlightId === "studio-field-coverUrl"
                    ? "ring-2 ring-black ring-offset-2"
                    : "",
                ].join(" ")}
              >
                <p className="text-sm font-semibold text-gray-900">
                  Обкладинка
                </p>
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-gray-50">
                    Завантажити
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => pickImage(e, "coverUrl")}
                      className="hidden"
                    />
                  </label>
                  {hasCover && (
                    <button
                      type="button"
                      onClick={() => removeImage("coverUrl")}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-gray-50"
                    >
                      Видалити
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  JPG/PNG до 1MB, бажано 1200×400+
                </p>
              </div>

              {/* LOGO */}
              <div
                id="studio-field-logoUrl"
                className={[
                  "space-y-2 rounded-2xl",
                  highlightId === "studio-field-logoUrl"
                    ? "ring-2 ring-black ring-offset-2"
                    : "",
                ].join(" ")}
              >
                <p className="text-sm font-semibold text-gray-900">Логотип</p>
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-gray-50">
                    Завантажити
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => pickImage(e, "logoUrl")}
                      className="hidden"
                    />
                  </label>
                  {hasLogo && (
                    <button
                      type="button"
                      onClick={() => removeImage("logoUrl")}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-gray-50"
                    >
                      Видалити
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  JPG/PNG до 1MB, бажано 400×400+
                </p>
              </div>
            </div>
          </Card>
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
                      className={[
                        "w-full rounded-xl border border-gray-200 bg-white p-3 text-sm font-medium text-gray-900 outline-none transition-all",
                        "focus:border-black focus:ring-2 focus:ring-black focus:ring-offset-0",
                        highlightId === "studio-field-name"
                          ? "ring-2 ring-black ring-offset-0 border-black"
                          : "",
                      ].join(" ")}
                    />
                  </Field>

                  <Field label="Категорія" error={errors.category}>
                    <input
                      id="studio-field-category"
                      value={form.category}
                      onChange={(e) => setField("category", e.target.value)}
                      placeholder="Нігті / Барбер / Масаж…"
                      className={[
                        "w-full rounded-xl border border-gray-200 bg-white p-3 text-sm font-medium text-gray-900 outline-none focus:border-black",
                        highlightId === "studio-field-category"
                          ? "ring-2 ring-black ring-offset-2"
                          : "",
                      ].join(" ")}
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
                        placeholder="2–4 речення: досвід, стерильність, бренди, гарантія, що отримає клієнт."
                        className={[
                          "w-full resize-none rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-900 outline-none focus:border-black",
                          highlightId === "studio-field-description"
                            ? "ring-2 ring-black ring-offset-2"
                            : "",
                        ].join(" ")}
                      />
                    </Field>
                    <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs font-semibold text-gray-500">
                        Шаблон (можна скопіювати)
                      </p>
                      <p className="mt-1 text-sm text-gray-700">
                        “Працюємо з{" "}
                        {form.category.trim() ? form.category : "послугами"}.
                        Стерильні інструменти, якісні матеріали, гарантія на
                        покриття. Підбираємо форму/стиль під вас. Запис онлайн
                        за 1 хвилину.”
                      </p>
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
                      className={[
                        "w-full rounded-xl border border-gray-200 bg-white p-3 text-sm font-medium text-gray-900 outline-none focus:border-black",
                        highlightId === "studio-field-city"
                          ? "ring-2 ring-black ring-offset-2"
                          : "",
                      ].join(" ")}
                    />
                  </Field>

                  <Field label="Вулиця">
                    <input
                      id="studio-field-street"
                      value={form.street}
                      onChange={(e) => setField("street", e.target.value)}
                      placeholder="Хрещатик"
                      className={[
                        "w-full rounded-xl border border-gray-200 bg-white p-3 text-sm font-medium text-gray-900 outline-none focus:border-black",
                        highlightId === "studio-field-street"
                          ? "ring-2 ring-black ring-offset-2"
                          : "",
                      ].join(" ")}
                    />
                  </Field>

                  <Field label="Будинок">
                    <input
                      id="studio-field-building"
                      value={form.building}
                      onChange={(e) => setField("building", e.target.value)}
                      placeholder="10"
                      className={[
                        "w-full rounded-xl border border-gray-200 bg-white p-3 text-sm font-medium text-gray-900 outline-none focus:border-black",
                        highlightId === "studio-field-building"
                          ? "ring-2 ring-black ring-offset-2"
                          : "",
                      ].join(" ")}
                    />
                  </Field>

                  <Field label="Квартира/Офіс">
                    <input
                      id="studio-field-apartment"
                      value={form.apartment}
                      onChange={(e) => setField("apartment", e.target.value)}
                      placeholder="23"
                      className={[
                        "w-full rounded-xl border border-gray-200 bg-white p-3 text-sm font-medium text-gray-900 outline-none focus:border-black",
                        highlightId === "studio-field-apartment"
                          ? "ring-2 ring-black ring-offset-2"
                          : "",
                      ].join(" ")}
                    />
                  </Field>

                  <div className="sm:col-span-2 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs font-semibold text-gray-500">
                      Перевірка
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {AddressLine}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {tab === "links" && (
              <Card
                title="Посилання та портфоліо"
                subtitle="Додай 4–12 фото робіт — це сильніше за будь-який текст."
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Instagram" error={errors.instagram}>
                    <input
                      id="studio-field-instagram"
                      value={form.instagram}
                      onChange={(e) => setField("instagram", e.target.value)}
                      placeholder="https://instagram.com/..."
                      className={[
                        "w-full rounded-xl border border-gray-200 bg-white p-3 text-sm font-medium text-gray-900 outline-none focus:border-black",
                        highlightId === "studio-field-instagram"
                          ? "ring-2 ring-black ring-offset-2"
                          : "",
                      ].join(" ")}
                    />
                  </Field>

                  <Field label="Сайт" error={errors.website}>
                    <input
                      id="studio-field-website"
                      value={form.website}
                      onChange={(e) => setField("website", e.target.value)}
                      placeholder="https://yourstudio.com"
                      className={[
                        "w-full rounded-xl border border-gray-200 bg-white p-3 text-sm font-medium text-gray-900 outline-none focus:border-black",
                        highlightId === "studio-field-website"
                          ? "ring-2 ring-black ring-offset-2"
                          : "",
                      ].join(" ")}
                    />
                  </Field>

                  <div id="studio-field-portfolio" className="sm:col-span-2">
<Field
  label="Портфоліо (фото робіт)"
  error={errors.portfolioUrls}
  hint={`${form.portfolioUrls?.length || 0}/${MAX_PORTFOLIO}`}
>
  {/* actions */}
  <div className="flex flex-wrap items-center gap-2">
    <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 active:scale-[0.99] transition">
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
        onClick={() => setForm((p) => ({ ...p, portfolioUrls: [] }))}
        className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 active:scale-[0.99] transition"
      >
        Очистити
      </button>
    )}
  </div>

  <p className="mt-2 text-xs text-gray-500">
    Додавай 4–12 фото. JPG/PNG до 1MB. Натисни на фото для перегляду.
  </p>

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
          const isLast = idx === form.portfolioUrls.length - 1;

          return (
            <div key={`${src}-${idx}`} className="relative">
              {/* image */}
              <button
                type="button"
                onClick={() => setPortfolioPreview({ open: true, src })}
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
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
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
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
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
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
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
          "fixed z-[90] left-4 bottom-6",
          "w-auto min-w-[260px] max-w-[340px]",
          "transition-all duration-300",
          toast.open
            ? "opacity-100 translate-x-0 translate-y-0"
            : "pointer-events-none opacity-0 -translate-x-5 translate-y-4",
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

        <style>{`
    @keyframes toastbar {
      from { transform: scaleX(1); }
      to { transform: scaleX(0); }
    }
    @keyframes toastPop {
      from { transform: scale(0.92); opacity: 0.6; }
      to { transform: scale(1); opacity: 1; }
    }
  `}</style>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
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
    "fixed right-4 top-4 z-[9999]",
    "transition-all duration-300",
    showTopSave
      ? "opacity-100 translate-y-0 pointer-events-auto"
      : "opacity-0 -translate-y-2 pointer-events-none",
  ].join(" ")}
>
  <button
    type="button"
    onClick={save}
    disabled={!canSave}
    className="
      rounded-2xl bg-black px-5 py-3
      text-sm font-extrabold text-white
      shadow-[0_12px_30px_rgba(0,0,0,0.22)]
      hover:bg-gray-900 active:scale-[0.99]
      disabled:opacity-40 disabled:shadow-none
      transition
    "
  >
    {saving ? "Збереження..." : "Зберегти"}
  </button>
</div>

    </div>
  );
}
