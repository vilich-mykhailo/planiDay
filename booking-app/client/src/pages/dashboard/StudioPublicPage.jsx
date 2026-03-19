// StudioPublicPage.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
/* eslint-disable no-unused-vars */
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Clock,
  Banknote,
  ChevronDown,
  Copy,
  CheckCheck,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Search,
  Star,
  Heart,
  Share2,
  Phone,
  Instagram,
  Facebook,
  Wifi,
  Car,
  Users,
} from "lucide-react";
import StudioBookingWidget from "../../components/StudioBookingWidget";

const R2_PUBLIC = import.meta.env.VITE_R2_PUBLIC_BASE_URL;

function toPublicUrl(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return R2_PUBLIC ? `${R2_PUBLIC}/${s}` : s;
}

function safe(v) {
  return String(v || "").trim();
}

function parsePortfolio(value) {
  if (Array.isArray(value)) return value.map(toPublicUrl).filter(Boolean);

  const raw = String(value || "").trim();
  if (!raw) return [];

  return raw
    .split(/[\n,]/g)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(toPublicUrl);
}

function BookingModal({ open, title, onClose, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex" data-testid="booking-modal">
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        type="button"
        aria-label="Закрити"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      <div className="relative z-10 m-auto w-full max-w-2xl px-3 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="flex max-h-[92vh] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_40px_120px_-30px_rgba(0,0,0,0.2)]"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex-shrink-0 border-b border-[#E8E1DB] bg-white px-5 py-5 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C8A278]">
                  Онлайн бронювання
                </p>
                <h3
                  className="mt-1 truncate text-lg font-semibold text-[#2A2A2A] sm:text-xl"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {title}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E0DCD8] bg-[#F8F5F2] text-[#7A7A7A] transition-colors duration-200 hover:bg-[#F0EEEA] hover:text-[#2A2A2A]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-0 pt-6 sm:px-6">
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function ImageLightbox({ open, images = [], startIndex = 0, onClose }) {
  const [idx, setIdx] = useState(startIndex);

  useEffect(() => {
    setIdx(startIndex);
  }, [startIndex]);

  useEffect(() => {
    if (!open) return;

    function onKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx((p) => (p + 1) % images.length);
      if (e.key === "ArrowLeft")
        setIdx((p) => (p - 1 + images.length) % images.length);
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, images.length, onClose]);

  if (!open || !images.length) return null;

  const hasMany = images.length > 1;

  return (
    <div className="fixed inset-0 z-[120] bg-black/95">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0"
        aria-label="Закрити"
      />

      <div className="absolute inset-x-0 top-0 z-[130] flex items-center justify-between px-4 py-4">
        <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80 backdrop-blur-md">
          {idx + 1} / {images.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#2A2A2A] shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {hasMany && (
        <>
          <button
            type="button"
            onClick={() =>
              setIdx((p) => (p - 1 + images.length) % images.length)
            }
            className="absolute left-4 top-1/2 z-[130] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full  text-[#2A2A2A] shadow-xl transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            type="button"
            onClick={() => setIdx((p) => (p + 1) % images.length)}
            className="absolute right-4 top-1/2 z-[130] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#2A2A2A] shadow-xl transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      <div className="relative z-[121] flex h-full w-full items-center justify-center px-12 py-20">
        <AnimatePresence mode="wait">
          <motion.img
            key={idx}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            src={images[idx]}
            alt={`Фото ${idx + 1}`}
            className="max-h-[80vh] max-w-full select-none rounded-2xl object-contain shadow-2xl"
            draggable="false"
          />
        </AnimatePresence>
      </div>
    </div>
  );
}

function ServiceRow({ service, onBook }) {
  return (
    <div className="group flex items-center gap-4 rounded-2xl border border-[#ECE6E1] bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] sm:p-5">
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-[#2A2A2A] transition-colors duration-200 group-hover:text-[#4A5D4E] sm:text-base">
          {service.name}
        </p>
        {!!service.description && (
          <p className="mt-1 line-clamp-2 text-xs text-[#8A817A] sm:text-sm">
            {service.description}
          </p>
        )}
        <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-[#7A7A7A]">
          {service.duration && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F8F5F2] px-2.5 py-1">
              <Clock className="h-3.5 w-3.5 text-[#C8A278]" />
              {service.duration} хв
            </span>
          )}
          {service.price != null && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F8F5F2] px-2.5 py-1 font-semibold text-[#2A2A2A]">
              <Banknote className="h-3.5 w-3.5 text-[#C8A278]" />
              {service.price} грн
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onBook(service)}
        className="shrink-0 rounded-2xl bg-[#4A5D4E] px-4 py-3 text-xs font-bold text-white shadow-[0_8px_20px_rgba(74,93,78,0.2)] transition-all duration-200 hover:bg-[#3A4A3E] active:scale-[0.98] sm:px-5"
      >
        Забронювати
      </button>
    </div>
  );
}

function CategoryAccordion({ category, onBook }) {
  const [open, setOpen] = useState(false);
  const services = category.services || [];

  return (
    <div className="overflow-hidden rounded-[28px] border border-[#E6DFD8] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 p-5 text-left transition-colors duration-200 hover:bg-[#FBF9F7] sm:p-6"
      >
        <div className="min-w-0">
          <p className="text-base font-semibold text-[#2A2A2A] sm:text-lg">
            {category.name}
          </p>
          <p className="mt-0.5 text-xs text-[#7A7A7A]">
            {services.length} {services.length === 1 ? "послуга" : "послуг"}
          </p>
        </div>

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-[#E6DFD8] bg-[#F8F5F2] text-[#7A7A7A] transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        >
          <ChevronDown className="h-4 w-4" />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#EEE7E1] bg-[#FFFEFD] px-4 py-4 sm:px-6">
              {services.length === 0 ? (
                <p className="py-4 text-sm text-[#7A7A7A]">
                  Послуги не додані.
                </p>
              ) : (
                <div className="space-y-3">
                  {services.map((s) => (
                    <ServiceRow key={s.id} service={s} onBook={onBook} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StaffCard({ member }) {
  const photo = toPublicUrl(
    member?.photoUrl || member?.avatar || member?.image,
  );
  const name = safe(member?.name || member?.fullName || member?.title);
  const role = safe(member?.role || member?.position || member?.speciality);

  return (
    <div className="flex min-w-[96px] max-w-[120px] flex-col items-center text-center sm:min-w-[120px]">
      <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-[#EEE7E1] shadow-[0_10px_24px_rgba(0,0,0,0.06)] sm:h-24 sm:w-24">
        {photo ? (
          <img
            src={photo}
            alt={name || "member"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[#B8A49A]">
            {name ? name.slice(0, 1).toUpperCase() : "?"}
          </div>
        )}
      </div>
      <p className="mt-3 line-clamp-2 text-sm font-semibold text-[#2A2A2A]">
        {name || "Майстер"}
      </p>
      <p className="mt-0.5 line-clamp-2 text-xs text-[#8A817A]">
        {role || "Спеціаліст"}
      </p>
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <div className="rounded-[26px] border border-[#E7E0DA] bg-white p-5 shadow-[0_8px_25px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#2A2A2A]">
            {review.author}
          </p>
          <div className="mt-1 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${i < review.rating ? "fill-[#F5A524] text-[#F5A524]" : "text-[#E6DFD8]"}`}
              />
            ))}
          </div>
        </div>
        <span className="text-xs text-[#8A817A]">{review.date}</span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[#5E5752]">
        {review.text}
      </p>
    </div>
  );
}

export default function StudioPublicPage() {
  const { slug } = useParams();

  const [studio, setStudio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [openBooking, setOpenBooking] = useState(false);
  const [preselectedService, setPreselectedService] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(null);
  const [copied, setCopied] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("services");
  const [mobileTab, setMobileTab] = useState("services");

  const servicesRef = useRef(null);
  const reviewsRef = useRef(null);
  const portfolioRef = useRef(null);
  const detailsRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const [isFavourite, setIsFavourite] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    let alive = true;

    async function loadStudio() {
      if (!slug) return;

      setLoading(true);
      setError("");

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/client/${slug}`,
        );
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.message || `Load failed (${res.status})`);
        }

        const s = data?.studio || null;
        if (!s) throw new Error("Studio missing in response");

        const normalized = {
          ...s,
          slug: s.slug || s.id,
          coverUrl: toPublicUrl(s.coverUrl),
          logoUrl: toPublicUrl(s.logoUrl),
          portfolioUrls: s.portfolioUrls ?? [],
        };

        if (alive) setStudio(normalized);
      } catch (e) {
        console.error(e);
        if (alive) {
          setStudio(null);
          setError(String(e?.message || "Load failed"));
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadStudio();

    return () => {
      alive = false;
    };
  }, [slug]);

  const name = safe(studio?.name) || "Студія";
  const category = safe(studio?.category);
  const city = safe(studio?.city);
  const description = safe(studio?.description);
  const coverUrl = studio?.coverUrl || "";
  const logoUrl = studio?.logoUrl || "";
  const address = [studio?.street, studio?.building, studio?.apartment]
    .filter(Boolean)
    .join(", ");
  const fullAddress = [address, city].filter(Boolean).join(", ");
  const portfolio = useMemo(
    () => parsePortfolio(studio?.portfolioUrls),
    [studio],
  );
  const serviceCategories = studio?.serviceCategories || [];
  const uncategorizedServices = studio?.uncategorizedServices || [];
  const allServices = useMemo(() => {
    const serviceCategories = studio?.serviceCategories ?? [];
    const uncategorizedServices = studio?.uncategorizedServices ?? [];

    return [
      ...uncategorizedServices,
      ...serviceCategories.flatMap((cat) =>
        (cat.services || []).map((service) => ({
          ...service,
          categoryName: cat.name,
        })),
      ),
    ];
  }, [studio?.serviceCategories, studio?.uncategorizedServices]);

  const filteredUncategorizedServices = useMemo(() => {
    const q = search.trim().toLowerCase();
    const uncategorizedServices = studio?.uncategorizedServices ?? [];

    if (!q) return uncategorizedServices;

    return uncategorizedServices.filter((s) =>
      `${s.name} ${s.description || ""}`.toLowerCase().includes(q),
    );
  }, [search, studio?.uncategorizedServices]);

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    const serviceCategories = studio?.serviceCategories ?? [];

    if (!q) return serviceCategories;

    return serviceCategories
      .map((cat) => ({
        ...cat,
        services: (cat.services || []).filter((s) =>
          `${s.name} ${s.description || ""}`.toLowerCase().includes(q),
        ),
      }))
      .filter((cat) => cat.services.length > 0);
  }, [search, studio?.serviceCategories]);

  const displayedPortfolio = portfolio.slice(0, 12);
  const teamMembers =
    studio?.teamMembers || studio?.employees || studio?.staff || [];
  const studioPhone = safe(
    studio?.phone || studio?.phoneNumber || studio?.contactPhone,
  );

  const reviewsSummary = {
    rating: Number(studio?.rating || 4.9),
    count: Number(studio?.reviewsCount || 1090),
    distribution: studio?.ratingDistribution || {
      5: 1056,
      4: 19,
      3: 6,
      2: 6,
      1: 3,
    },
  };

  const reviews = useMemo(
    () =>
      (studio?.reviews && studio.reviews.length
        ? studio.reviews
        : [
            {
              id: 1,
              author: "Marcelina",
              rating: 5,
              date: "8 бер. 2026",
              text: "Хотіла коротку стрижку, але майстер порадив кращу форму під обличчя. Вийшло дуже круто. Рекомендую.",
            },
            {
              id: 2,
              author: "Magdalena",
              rating: 5,
              date: "8 бер. 2026",
              text: "Стрижка дитини, як завжди, бездоганна. Дуже приємна атмосфера і хороший сервіс.",
            },
          ]
      ).map((r, index) => ({
        id: r.id || index,
        author: r.author || r.name || "Клієнт",
        rating: Number(r.rating || 5),
        date: r.date || r.createdAt || "Нещодавно",
        text:
          r.text || r.comment || r.message || "Відгук буде доступний скоро.",
      })),
    [studio],
  );

  function handleCopyAddress() {
    if (!fullAddress) return;
    navigator.clipboard?.writeText(fullAddress).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function openBookingForService(service) {
    setPreselectedService({ categoryId: null, serviceId: service.id });
    setOpenBooking(true);
  }

  function scrollToSection(key) {
    setActiveTab(key);
    setMobileTab(key);

    const map = {
      services: servicesRef,
      reviews: reviewsRef,
      portfolio: portfolioRef,
      details: detailsRef,
    };

    map[key]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  useEffect(() => {
    const items = [
      { key: "services", ref: servicesRef },
      { key: "reviews", ref: reviewsRef },
      { key: "portfolio", ref: portfolioRef },
      { key: "details", ref: detailsRef },
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;
        const found = items.find((item) => item.ref.current === visible.target);
        if (found) setActiveTab(found.key);
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.15, 0.3, 0.6] },
    );

    items.forEach((item) => {
      if (item.ref.current) observer.observe(item.ref.current);
    });

    return () => observer.disconnect();
  }, [studio]);

function handleGoBack() {
  // Повернення назад → кажемо списку, що треба відновити скрол
  sessionStorage.setItem("restore-studios-scroll", "1");
  // y вже збережено раніше, тому повторно писати не обов'язково
  navigate(-1);
}

  async function handleShare() {
    const shareData = {
      title: name,
      text: `Переглянь студію ${name}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1600);
    } catch {
      // нічого критичного
    }
  }

  function handleToggleFavourite() {
    setIsFavourite((prev) => !prev);
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="rounded-2xl border border-[#E0DCD8] bg-white px-6 py-4 text-sm text-[#7A7A7A]">
          Завантаження студії...
        </div>
      </div>
    );
  }

  if (!studio) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-2xl rounded-[28px] border border-[#E0DCD8] bg-white p-12 text-center shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <h1 className="text-xl font-bold text-[#2A2A2A]">
            {error ? "Не вдалося завантажити студію" : "Студію не знайдено"}
          </h1>
          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        </div>
      </div>
    );
  }

return (
  <div
    className="min-h-screen bg-[#F8F5F2] text-[#2A2A2A]"
    data-testid="studio-public-page"
  >
    <div className="mx-auto w-full max-w-[1380px] px-3 sm:px-4 lg:px-6">
      <div className="mx-auto w-full max-w-[1200px] text-[#2A2A2A]">
        <section className="relative">
          <div className="relative h-[280px] overflow-hidden rounded-b-[20px] sm:h-[360px] lg:h-[420px]">
            {" "}
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[#E6E2DE]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-black/20" />
            <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pb-4 pt-4 sm:px-6">
              <button
                type="button"
                onClick={handleGoBack}
                aria-label="Назад"
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-[#2A2A2A] shadow-lg backdrop-blur-md transition hover:scale-105 active:scale-95"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="Поділитися"
                  title={shareCopied ? "Посилання скопійовано" : "Поділитися"}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-[#2A2A2A] shadow-lg backdrop-blur-md transition hover:scale-105 active:scale-95"
                >
                  <Share2 className="h-4.5 w-4.5" />
                </button>
                <button
                  type="button"
                  onClick={handleToggleFavourite}
                  aria-label="В обране"
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-lg backdrop-blur-md transition hover:scale-105 active:scale-95 ${
                    isFavourite
                      ? "bg-[#FFE8EE] text-[#E25577]"
                      : "bg-white/90 text-[#2A2A2A]"
                  }`}
                >
                  <Heart
                    className={`h-4.5 w-4.5 ${isFavourite ? "fill-current" : ""}`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="relative z-10 -mt-14 w-full px-0 sm:-mt-16 sm:px-6 lg:mx-auto lg:max-w-[1180px] lg:px-8">
            <div className="bg-white rounded-[30px] md:border md:border-white/70 md:shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
              {/* <div className="overflow-hidden rounded-[30px] border border-white/70 bg-white/92 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur-xl">           */}
              <div className="px-4 pb-5 pt-4 sm:px-6 sm:pb-6">
                <div className="flex items-start justify-between gap-6">
                  {/* ЛІВА ЧАСТИНА */}
                  <div className="flex items-center gap-4">
                    {/* LOGO */}
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[#EEE6DF] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)] sm:h-20 sm:w-20">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={`${name} logo`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-bold tracking-widest text-[#C8A278]">
                          LOGO
                        </div>
                      )}
                    </div>

                    {/* ТЕКСТ */}
                    <div className="flex flex-col">
                      <div className="flex flex-wrap items-center gap-2">
                        {category && (
                          <span className="rounded-full bg-[#4A5D4E]/8 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#4A5D4E]">
                            {category}
                          </span>
                        )}

                        {studio?.priceFrom != null && (
                          <span className="rounded-full bg-[#C8A278]/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#B98752]">
                            від {studio.priceFrom} грн
                          </span>
                        )}
                      </div>

                      <h1
                        className="mt-2 text-[26px] font-medium leading-[1.05] tracking-tight text-[#1F1F1F] sm:text-4xl lg:text-5xl"
                        style={{ fontFamily: "var(--font-heading)" }}
                      >
                        {name}
                      </h1>

                      {fullAddress && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-[#746D67]">
                          <MapPin className="h-4 w-4 shrink-0 text-[#C8A278]" />
                          <p className="line-clamp-1">{fullAddress}</p>
                        </div>
                      )}

                      <div className="mt-2 flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1.5 font-semibold text-[#1F1F1F]">
                          <Star className="h-4 w-4 fill-[#F5A524] text-[#F5A524]" />
                          {reviewsSummary.rating.toFixed(1)}
                          <span className="font-normal text-[#0A7EA4]">
                            ({reviewsSummary.count} відгуків)
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 rounded-full border border-green-300 bg-green-50 px-2 py-[2px] text-[11px] font-medium text-green-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          Працює зараз
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* КНОПКА */}
                  <div className="hidden lg:block mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setPreselectedService(null);
                        setOpenBooking(true);
                      }}
                      className="rounded-2xl bg-[#4A5D4E] px-7 py-4 text-sm font-bold text-white shadow-[0_10px_25px_rgba(74,93,78,0.22)] transition-all duration-200 hover:bg-[#3A4A3E]"
                    >
                      <span className="flex items-center gap-2 whitespace-nowrap">
                        Забронювати онлайн
                        <Sparkles className="h-4 w-4 opacity-75" />
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="sticky top-0 z-30 border-t border-[#EEE7E1] bg-white/95 backdrop-blur-xl">
                <div className="mx-auto max-w-[900px] px-4">
                  <div className="scrollbar-none flex justify-center overflow-x-auto">
                    {[
                      { key: "services", label: "Послуги" },
                      { key: "reviews", label: "Відгуки" },
                      { key: "portfolio", label: "Портфоліо" },
                      { key: "details", label: "Деталі" },
                    ].map((tab) => {
                      const isActive = activeTab === tab.key;

                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => scrollToSection(tab.key)}
                          className={`relative shrink-0 px-4 py-4 text-sm font-semibold transition-colors sm:px-5 ${
                            isActive
                              ? "text-[#1F1F1F]"
                              : "text-[#8A817A] hover:text-[#2A2A2A]"
                          }`}
                        >
                          {tab.label}

                          {isActive && (
                            <motion.span
                              layoutId="activeStudioTab"
                              className="absolute bottom-0 left-4 right-4 h-[2.5px] rounded-full bg-[#1F1F1F]"
                              transition={{
                                type: "spring",
                                stiffness: 380,
                                damping: 32,
                              }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="px-4 pb-8 pt-3 sm:px-0 lg:px-8">
                {mobileTab === "services" && (
                  <motion.section
                    key="services"
                    ref={servicesRef}
                    className="scroll-mt-28"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 18 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="rounded-[30px] p-4 sm:p-6">
                      <div className="mb-5 flex items-end justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C8A278]">
                            Меню послуг
                          </p>
                          <h2
                            className="mt-2 text-2xl font-medium tracking-tight sm:text-3xl"
                            style={{ fontFamily: "var(--font-heading)" }}
                          >
                            Популярні послуги
                          </h2>
                        </div>
                      </div>

                      <div className="relative mb-6">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B928B]" />
                        <input
                          type="text"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Пошук послуг"
                          className="h-12 w-full rounded-2xl border border-[#E8E1DB] bg-[#FBFAF8] pl-11 pr-4 text-sm text-[#2A2A2A] outline-none transition focus:border-[#C8A278]"
                        />
                      </div>

                      {filteredCategories.length === 0 &&
                      filteredUncategorizedServices.length === 0 ? (
                        <div className="rounded-2xl bg-[#F8F5F2] p-8 text-center text-sm text-[#7A7A7A]">
                          Послуги не знайдено.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {filteredUncategorizedServices.length > 0 && (
                            <div className="space-y-3">
                              {filteredUncategorizedServices.map((s) => (
                                <ServiceRow
                                  key={s.id}
                                  service={s}
                                  onBook={openBookingForService}
                                />
                              ))}
                            </div>
                          )}

                          {filteredCategories.map((cat) => (
                            <CategoryAccordion
                              key={cat.id}
                              category={cat}
                              onBook={openBookingForService}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.section>
                )}

                {mobileTab === "reviews" && (
                  <motion.section
                    key="reviews"
                    ref={reviewsRef}
                    className="scroll-mt-28"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 18 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="rounded-[30px] p-4 sm:p-6">
                      <div className="mb-6 flex items-end justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C8A278]">
                            Довіра клієнтів
                          </p>
                          <h2
                            className="mt-2 text-2xl font-medium tracking-tight sm:text-3xl"
                            style={{ fontFamily: "var(--font-heading)" }}
                          >
                            Відгуки
                          </h2>
                        </div>
                        <span className="text-sm text-[#8A817A]">
                          {reviewsSummary.count} відгуків
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px,1fr]">
                        <div className="rounded-[26px] border border-[#E7E0DA] bg-[#FFFEFD] p-5">
                          <div className="text-center">
                            <p className="text-5xl font-light text-[#2A2A2A]">
                              {reviewsSummary.rating.toFixed(1)}
                            </p>
                            <div className="mt-3 flex items-center justify-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className="h-5 w-5 fill-[#F5A524] text-[#F5A524]"
                                />
                              ))}
                            </div>
                            <p className="mt-2 text-sm text-[#8A817A]">
                              {reviewsSummary.count} відгуків
                            </p>
                          </div>

                          <div className="mt-6 space-y-2.5">
                            {[5, 4, 3, 2, 1].map((num) => {
                              const val =
                                reviewsSummary.distribution?.[num] || 0;
                              const max = reviewsSummary.distribution?.[5] || 1;
                              return (
                                <div
                                  key={num}
                                  className="flex items-center gap-3 text-xs text-[#6E665F]"
                                >
                                  <span className="w-2">{num}</span>
                                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EFE8E2]">
                                    <div
                                      className="h-full rounded-full bg-[#F5A524]"
                                      style={{ width: `${(val / max) * 100}%` }}
                                    />
                                  </div>
                                  <span className="w-8 text-right">{val}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-4">
                          {displayedPortfolio.length > 0 && (
                            <div>
                              <p className="mb-3 text-sm font-semibold text-[#2A2A2A]">
                                Фотографії клієнтів
                              </p>
                              <div className="flex gap-3 overflow-x-auto pb-1">
                                {displayedPortfolio
                                  .slice(0, 6)
                                  .map((url, idx) => (
                                    <button
                                      key={url + idx}
                                      type="button"
                                      onClick={() => setPreviewIndex(idx)}
                                      className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-[#ECE5DE] bg-[#EEE7E1] sm:h-24 sm:w-24"
                                    >
                                      <img
                                        src={url}
                                        alt={`review-portfolio-${idx}`}
                                        className="h-full w-full object-cover"
                                      />
                                    </button>
                                  ))}
                              </div>
                            </div>
                          )}

                          <div className="grid gap-4 md:grid-cols-2">
                            {reviews.map((review) => (
                              <ReviewCard key={review.id} review={review} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.section>
                )}

                {displayedPortfolio.length > 0 && mobileTab === "portfolio" && (
                  <motion.section
                    key="portfolio"
                    ref={portfolioRef}
                    className="scroll-mt-28"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 18 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="rounded-[30px] p-4 sm:p-6">
                      <div className="mb-10">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#C8A278]">
                          Наші роботи
                        </p>
                        <h2
                          className="text-2xl font-medium tracking-tight text-[#2A2A2A] md:text-4xl"
                          style={{ fontFamily: "var(--font-heading)" }}
                        >
                          Портфоліо
                        </h2>
                      </div>

                      <div className="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4">
                        {displayedPortfolio.map((url, idx) => (
                          <motion.button
                            key={url + idx}
                            type="button"
                            onClick={() => setPreviewIndex(idx)}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.05, duration: 0.4 }}
                            className="group relative mb-3 block w-full cursor-zoom-in overflow-hidden rounded-2xl bg-[#E6E2DE] sm:mb-4"
                          >
                            <img
                              src={url}
                              alt={`Портфоліо ${idx + 1}`}
                              className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                                idx % 3 === 0
                                  ? "aspect-[3/4]"
                                  : idx % 3 === 1
                                    ? "aspect-square"
                                    : "aspect-[4/5]"
                              }`}
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.section>
                )}

                {mobileTab === "details" && (
                  <motion.section
                    key="details"
                    ref={detailsRef}
                    className="scroll-mt-28"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 18 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="rounded-[30px] p-4 sm:p-6">
                      <div className="mb-6">
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C8A278]">
                          Контакти та інформація
                        </p>
                        <h2
                          className="mt-2 text-2xl font-medium tracking-tight sm:text-3xl"
                          style={{ fontFamily: "var(--font-heading)" }}
                        >
                          Деталі
                        </h2>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
                        <div className="rounded-[28px] border border-[#E8E1DB] bg-[#FBFAF8] p-5">
                          <div className="overflow-hidden rounded-[16px] border border-[#E8E1DB] bg-white">
                            <div className="relative h-[220px] bg-[linear-gradient(135deg,#ece5de_0%,#f7f4f1_100%)]">
                              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(74,93,78,0.12),transparent_28%),radial-gradient(circle_at_70%_40%,rgba(200,162,120,0.18),transparent_26%),linear-gradient(0deg,rgba(255,255,255,0.35),rgba(255,255,255,0.35))]" />
                              <div className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#1F1F1F] text-white shadow-xl">
                                <MapPin className="h-5 w-5" />
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 p-4">
                              <div className="min-w-0">
                                <p className="text-lg font-semibold text-[#2A2A2A]">
                                  {name}
                                </p>
                                <p className="mt-1 text-sm text-[#6E665F]">
                                  {fullAddress || "Адресу ще не додано"}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={handleCopyAddress}
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#E8E1DB] bg-white text-[#6E665F] transition hover:bg-[#F3F0ED]"
                                title={copied ? "Скопійовано" : "Копіювати"}
                              >
                                {copied ? (
                                  <CheckCheck className="h-4 w-4 text-[#4A5D4E]" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          {!!description && (
                            <div className="mt-4 rounded-[24px] border border-[#E8E1DB] bg-white p-5">
                              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#B08A64]">
                                Про нас
                              </p>
                              <p className="mt-3 text-sm leading-7 text-[#5E5752]">
                                {description}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div className="rounded-[28px] border border-[#E8E1DB] bg-[#FBFAF8] p-5">
                            <div className="rounded-[30px] border border-[#E8E1DB] bg-white/70 backdrop-blur-xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
                              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#B08A64]">
                                ГРАФІК РОБОТИ
                              </p>

                              <div className="mt-5 space-y-2 text-sm">
                                {studioPhone && (
                                  <a
                                    href={`tel:${studioPhone}`}
                                    className="flex items-center justify-between rounded-xl px-3 py-2 transition "
                                  >
                                    <span className="flex items-center gap-3 font-medium text-[#2A2A2A]">
                                      <Phone className="h-4 w-4 text-[#C8A278]" />
                                      {studioPhone}
                                    </span>

                                    <span className="text-[#4A5D4E] text-xs font-semibold">
                                      Подзвонити
                                    </span>
                                  </a>
                                )}

                                {[
                                  { day: "Понеділок", hours: "10:00 - 20:00" },
                                  { day: "Вівторок", hours: "10:00 - 20:00" },
                                  { day: "Середа", hours: "10:00 - 20:00" },
                                  { day: "Четвер", hours: "10:00 - 20:00" },
                                  { day: "П’ятниця", hours: "10:00 - 20:00" },
                                  { day: "Субота", hours: "10:00 - 18:00" },
                                  { day: "Неділя", hours: "Вихідний" },
                                ].map((item, index) => {
                                  const today = new Date().getDay();
                                  const dayIndex = index === 6 ? 0 : index + 1;
                                  const isToday = today === dayIndex;

                                  return (
                                    <div
                                      key={item.day}
                                      className={`flex items-center justify-between rounded-xl px-3 py-2 transition ${
                                        isToday ? "bg-[#F8F5F2]" : ""
                                      }`}
                                    >
                                      <span
                                        className={`flex items-center gap-3 ${
                                          isToday
                                            ? "font-semibold text-[#2A2A2A]"
                                            : "text-[#6E665F]"
                                        }`}
                                      >
                                        <Clock className="h-4 w-4 text-[#C8A278]" />
                                        {item.day}
                                      </span>

                                      <span
                                        className={`font-medium ${
                                          item.hours === "Вихідний"
                                            ? "text-[#B3261E]"
                                            : isToday
                                              ? "text-[#4A5D4E]"
                                              : "text-[#2A2A2A]"
                                        }`}
                                      >
                                        {item.hours}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="rounded-[28px] border border-[#E8E1DB] bg-[#FBFAF8] p-5">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#B08A64]">
                              Зручності закладу
                            </p>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                              {[
                                { icon: Car, label: "Паркування" },
                                { icon: Wifi, label: "Wi‑Fi" },
                                { icon: Users, label: "Можна з дітьми" },
                              ].map((item) => (
                                <div
                                  key={item.label}
                                  className="flex items-center gap-3 rounded-2xl border border-[#E8E1DB] bg-white px-4 py-3 text-sm text-[#2A2A2A]"
                                >
                                  <item.icon className="h-4 w-4 text-[#4CB8B8]" />
                                  {item.label}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {teamMembers.length > 0 && (
                        <div className="mt-6 rounded-[28px] border border-[#E8E1DB] bg-[#FBFAF8] p-5">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#B08A64]">
                            Працівники
                          </p>
                          <div className="mt-5 flex gap-5 overflow-x-auto pb-2">
                            {teamMembers.map((member, idx) => (
                              <StaffCard
                                key={member.id || idx}
                                member={member}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.section>
                )}
              </div>
            </div>
          </div>
        </section>

        <AnimatePresence>
          {openBooking && (
            <BookingModal
              open={openBooking}
              title={name}
              onClose={() => {
                setOpenBooking(false);
                setPreselectedService(null);
              }}
            >
              <StudioBookingWidget
                studio={studio}
                preselectedService={preselectedService}
                onCancel={() => {
                  setOpenBooking(false);
                  setPreselectedService(null);
                }}
                onSuccess={(data) => {
                  setSuccessData(data);
                  setOpenBooking(false);
                }}
              />
            </BookingModal>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {previewIndex !== null && (
            <ImageLightbox
              open={previewIndex !== null}
              images={displayedPortfolio}
              startIndex={previewIndex}
              onClose={() => setPreviewIndex(null)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {successData && (
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="fixed bottom-4 left-4 right-4 z-[200] mx-auto max-w-md rounded-2xl border border-[#E0DCD8] bg-white p-5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] sm:bottom-8 sm:left-auto sm:right-8"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4A5D4E]/10">
                  <CheckCheck className="h-5 w-5 text-[#4A5D4E]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#2A2A2A]">
                    Запис створено!
                  </p>
                  <p className="mt-1 text-xs text-[#7A7A7A]">
                    {successData.serviceName} · {successData.date} о{" "}
                    {successData.time}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSuccessData(null)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[#7A7A7A] transition-colors duration-200 hover:bg-[#F0EEEA]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </div>
  );
}
