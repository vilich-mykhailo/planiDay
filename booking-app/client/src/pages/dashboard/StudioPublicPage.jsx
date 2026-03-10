import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
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

// ─── Modal ────────────────────────────────────────────────────
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
        data-testid="booking-modal-backdrop"
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
          data-testid="booking-modal-content"
        >
          <div className="flex-shrink-0 border-b border-[#E0DCD8] bg-white px-5 py-5 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C8A278]">
                  Онлайн бронювання
                </p>
                <h3
                  className="mt-1 truncate text-lg font-semibold text-[#2A2A2A] sm:text-xl"
                  style={{ fontFamily: "var(--font-heading)" }}
                  data-testid="booking-modal-title"
                >
                  {title}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                data-testid="booking-modal-close-btn"
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

// ─── Image Lightbox ───────────────────────────────────────────
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
      if (e.key === "ArrowLeft") setIdx((p) => (p - 1 + images.length) % images.length);
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, images.length, onClose]);

  if (!open || !images.length) return null;

  const hasMany = images.length > 1;

  return (
    <div className="fixed inset-0 z-[120] bg-black/95" data-testid="image-lightbox">
      <button type="button" onClick={onClose} className="absolute inset-0" aria-label="Закрити" />

      <div className="absolute inset-x-0 top-0 z-[130] flex items-center justify-between px-4 py-4">
        <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80 backdrop-blur-md">
          {idx + 1} / {images.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          data-testid="lightbox-close-btn"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#2A2A2A] shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {hasMany && (
        <>
          <button
            type="button"
            onClick={() => setIdx((p) => (p - 1 + images.length) % images.length)}
            data-testid="lightbox-prev-btn"
            className="absolute left-4 top-1/2 z-[130] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#2A2A2A] shadow-xl transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            type="button"
            onClick={() => setIdx((p) => (p + 1) % images.length)}
            data-testid="lightbox-next-btn"
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

// ─── Service Row ──────────────────────────────────────────────
function ServiceRow({ service, onBook }) {
  return (
    <div
      className="group flex flex-col justify-between gap-3 border-b border-[#E0DCD8] py-5 sm:flex-row sm:items-center"
      data-testid={`service-row-${service.id}`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold text-[#2A2A2A] transition-colors duration-200 group-hover:text-[#4A5D4E]">
          {service.name}
        </p>
        <div className="mt-1.5 flex items-center gap-4">
          {service.duration && (
            <span className="flex items-center gap-1.5 text-xs text-[#7A7A7A]">
              <Clock className="h-3 w-3 text-[#C8A278]" />
              {service.duration} хв
            </span>
          )}
          {service.price != null && (
            <span className="flex items-center gap-1.5 text-xs text-[#7A7A7A]">
              <Banknote className="h-3 w-3 text-[#C8A278]" />
              {service.price} грн
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onBook(service)}
        data-testid={`book-service-${service.id}`}
        className="self-start rounded-xl bg-[#4A5D4E] px-5 py-2.5 text-xs font-bold text-white transition-colors duration-200 hover:bg-[#3A4A3E] active:scale-[0.97] sm:self-center"
      >
        Записатись
      </button>
    </div>
  );
}

// ─── Category Accordion ───────────────────────────────────────
function CategoryAccordion({ category, onBook }) {
  const [open, setOpen] = useState(false);
  const services = category.services || [];

  return (
    <div
      className="overflow-hidden rounded-3xl border border-[#E0DCD8] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
      data-testid={`category-${category.id}`}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        data-testid={`category-toggle-${category.id}`}
        className="flex w-full items-center justify-between gap-3 p-5 text-left transition-colors duration-200 hover:bg-[#F8F5F2]/50 sm:p-7"
      >
        <div className="min-w-0">
          <p className="text-base font-semibold text-[#2A2A2A] sm:text-lg">{category.name}</p>
          <p className="mt-0.5 text-xs text-[#7A7A7A]">
            {services.length} {services.length === 1 ? "послуга" : "послуг"}
          </p>
        </div>

        <div
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-[#E0DCD8] bg-[#F8F5F2] text-[#7A7A7A] transition-transform duration-300 ${
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
            <div className="border-t border-[#E0DCD8] px-5 py-2 sm:px-7">
              {services.length === 0 ? (
                <p className="py-4 text-sm text-[#7A7A7A]">Послуги не додані.</p>
              ) : (
                <div className="divide-y divide-[#E0DCD8]">
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

// ─── Main Page ────────────────────────────────────────────────
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

  useEffect(() => {
    const locked = openBooking || previewIndex !== null;
    document.body.style.overflow = locked ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [openBooking, previewIndex]);

  useEffect(() => {
    let alive = true;

    async function loadStudio() {
      if (!slug) return;

      setLoading(true);
      setError("");

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/client/${slug}`);
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
  const address = [studio?.street, studio?.building, studio?.apartment].filter(Boolean).join(", ");
  const fullAddress = [city, address].filter(Boolean).join(", ");
  const portfolio = useMemo(() => parsePortfolio(studio?.portfolioUrls), [studio]);
  const serviceCategories = studio?.serviceCategories || [];
  const uncategorizedServices = studio?.uncategorizedServices || [];

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
    <div className="grain-overlay min-h-screen bg-[#F8F5F2]" data-testid="studio-public-page">
      <section className="relative" data-testid="hero-section">
        <div className="relative h-[55vh] overflow-hidden sm:h-[65vh] lg:h-[70vh]">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={name}
              className="absolute inset-0 h-full w-full object-cover"
              data-testid="hero-cover-image"
            />
          ) : (
            <div className="absolute inset-0 bg-[#E6E2DE]" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-[#F8F5F2] via-transparent to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto -mt-36 max-w-[1400px] px-4 sm:-mt-44 md:px-8">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:gap-7">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border-4 border-[#F8F5F2] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] sm:h-28 sm:w-28"
              data-testid="studio-logo"
            >
              {logoUrl ? (
                <img src={logoUrl} alt={`${name} logo`} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-bold tracking-widest text-[#C8A278]">
                  LOGO
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="min-w-0 flex-1"
            >
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-white/50 bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#4A5D4E] shadow-sm backdrop-blur-md">
                  {category}
                </span>

                {city && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/50 bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#7A7A7A] shadow-sm backdrop-blur-md">
                    <MapPin className="h-3 w-3" />
                    {city}
                  </span>
                )}

                {studio?.priceFrom != null && (
                  <span className="inline-flex items-center rounded-full border border-[#C8A278]/20 bg-[#C8A278]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#C8A278] backdrop-blur-md">
                    від {studio?.priceFrom} грн
                  </span>
                )}
              </div>

              <h1
                className="text-3xl font-light leading-[1.1] tracking-tight text-[#2A2A2A] sm:text-5xl lg:text-6xl"
                style={{ fontFamily: "var(--font-heading)" }}
                data-testid="studio-name"
              >
                {name}
              </h1>

              {fullAddress && (
                <div className="mt-3 flex items-center gap-2">
                  <p className="text-sm text-[#7A7A7A]" data-testid="studio-address">
                    {fullAddress}
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyAddress}
                    data-testid="copy-address-btn"
                    className="group relative flex h-7 w-7 items-center justify-center rounded-lg border border-[#E0DCD8] bg-white text-[#7A7A7A] transition-colors duration-200 hover:bg-[#F0EEEA] hover:text-[#2A2A2A] active:scale-95"
                    title={copied ? "Скопійовано!" : "Копіювати адресу"}
                  >
                    {copied ? (
                      <CheckCheck className="h-3.5 w-3.5 text-[#4A5D4E]" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex-shrink-0 self-end pb-2"
            >
              <button
                type="button"
                onClick={() => setOpenBooking(true)}
                data-testid="hero-book-btn"
                className="group rounded-2xl bg-[#4A5D4E] px-7 py-4 text-sm font-bold text-white shadow-[0_8px_30px_rgba(74,93,78,0.25)] transition-colors duration-200 hover:bg-[#3A4A3E] active:scale-[0.97]"
              >
                <span className="flex items-center gap-2">
                  Записатись онлайн
                  <Sparkles className="h-4 w-4 opacity-60" />
                </span>
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="mx-auto mt-10 max-w-[1400px] space-y-16 px-4 pb-16 sm:mt-14 sm:space-y-24 md:px-8">
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          data-testid="about-section"
        >
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#C8A278]">
                Про нас
              </p>
              <h2
                className="text-2xl font-medium tracking-tight text-[#2A2A2A] md:text-3xl"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Ваш простір краси
              </h2>
            </div>

            <div className="md:col-span-8">
              <p className="text-base leading-relaxed text-[#7A7A7A] md:text-lg" data-testid="studio-description">
                {description || "Опис ще не додано."}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {fullAddress && (
                  <div className="flex items-center gap-2 rounded-xl border border-[#E0DCD8] bg-white px-4 py-2.5 text-sm text-[#2A2A2A]">
                    <MapPin className="h-4 w-4 text-[#C8A278]" />
                    {fullAddress}
                  </div>
                )}
                <div className="flex items-center gap-2 rounded-xl border border-[#E0DCD8] bg-white px-4 py-2.5 text-sm text-[#2A2A2A]">
                  <Clock className="h-4 w-4 text-[#C8A278]" />
                  Пн-Пт: 09:00 — 20:00
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[#4A5D4E]/10 bg-[#4A5D4E]/5 px-4 py-3">
                <span className="h-2 w-2 flex-shrink-0 animate-pulse rounded-full bg-[#4A5D4E]" />
                <p className="text-xs font-medium text-[#4A5D4E]">
                  Миттєве підтвердження запису на ваш телефон
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          data-testid="services-section"
        >
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#C8A278]">
                Меню послуг
              </p>
              <h2
                className="text-2xl font-medium tracking-tight text-[#2A2A2A] md:text-4xl"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Послуги
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setOpenBooking(true)}
              data-testid="services-book-btn"
              className="flex items-center gap-2 rounded-xl bg-[#4A5D4E] px-5 py-3 text-sm font-bold text-white transition-colors duration-200 hover:bg-[#3A4A3E] active:scale-[0.97]"
            >
              Форма запису
            </button>
          </div>

          {serviceCategories.length === 0 && uncategorizedServices.length === 0 ? (
            <div className="rounded-2xl bg-[#F0EEEA] p-8 text-center text-sm text-[#7A7A7A]">
              Послуги ще не додані.
            </div>
          ) : (
            <div className="space-y-6">
              {uncategorizedServices.length > 0 && (
                <div className="rounded-3xl border border-[#E0DCD8] bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-7">
                  <div className="divide-y divide-[#E0DCD8]">
                    {uncategorizedServices.map((s) => (
                      <ServiceRow key={s.id} service={s} onBook={openBookingForService} />
                    ))}
                  </div>
                </div>
              )}

              {serviceCategories.map((cat) => (
                <CategoryAccordion key={cat.id} category={cat} onBook={openBookingForService} />
              ))}
            </div>
          )}
        </motion.section>

        {portfolio.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            data-testid="portfolio-section"
          >
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
              {portfolio.slice(0, 12).map((url, idx) => (
                <motion.button
                  key={url + idx}
                  type="button"
                  onClick={() => setPreviewIndex(idx)}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05, duration: 0.4 }}
                  data-testid={`portfolio-image-${idx}`}
                  className="group relative mb-3 block w-full cursor-zoom-in overflow-hidden rounded-2xl bg-[#E6E2DE] sm:mb-4"
                >
                  <img
                    src={url}
                    alt={`Портфоліо ${idx + 1}`}
                    className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                      idx % 3 === 0 ? "aspect-[3/4]" : idx % 3 === 1 ? "aspect-square" : "aspect-[4/5]"
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
          </motion.section>
        )}
      </div>

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
            images={portfolio.slice(0, 12)}
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
            className="fixed bottom-8 right-8 z-[200] w-96 rounded-2xl border border-[#E0DCD8] bg-white p-5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]"
            data-testid="booking-success-toast"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#4A5D4E]/10">
                <CheckCheck className="h-5 w-5 text-[#4A5D4E]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#2A2A2A]">Запис створено!</p>
                <p className="mt-1 text-xs text-[#7A7A7A]">
                  {successData.serviceName} &middot; {successData.date} о {successData.time}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSuccessData(null)}
                data-testid="success-toast-close"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#7A7A7A] transition-colors duration-200 hover:bg-[#F0EEEA]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}