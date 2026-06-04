// Clients.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../api/http";
import XLSX from "xlsx-js-style";
import { useStudio } from "../../context/studio/useStudio";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Download,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Clock,
  X,
  XCircle,
  ChevronLeft,
  ChevronRight,
  CheckCheck,
  Check,
  Crown,
  NotebookText,
  Repeat,
  Search,
  ShieldOff,
  Sparkles,
  Star,
  TrendingDown,
  Trash2,
  UserPlus,
  Users,
  Wallet,
  Archive,
  BadgeCheck,
  Heart,
  UserStar,
  Scissors,
  User,
  Cake,
  Phone,
  Mail,
  Copy,
  ContactRound,
  MoreVertical,
  Plus,
  CircleCheckBig,
  CookingPot,
  PartyPopper,
  Banknote,
  Receipt,
  CircleAlert,
} from "lucide-react";

const PUBLIC = import.meta.env.VITE_R2_PUBLIC_BASE_URL;

function toPublicUrl(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return PUBLIC ? `${PUBLIC}/${s}` : s;
}

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function initialsFromName(name) {
  const s = String(name || "").trim();
  if (!s) return "C";

  return (
    s
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "C"
  );
}

function formatMoney(value) {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function dateScore(value) {
  if (!value) return 0;

  const raw = String(value);

  if (raw.includes("T") || raw.includes("-")) {
    const time = new Date(raw).getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  const [day, month, year] = raw.split(".").map(Number);
  return new Date(year || 0, (month || 1) - 1, day || 1).getTime();
}

function formatDateUA(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("uk-UA");
}

function getBookingStatusUi(status, canceledBy = null) {
  const base =
    "border border-[#eadbc9] bg-white shadow-[0_8px_22px_rgba(17,17,17,0.05)]";

  if (status === "CONFIRMED") {
    return {
      text: "Підтверджено",
      icon: CircleCheckBig,
      badge: `${base} text-[#0f8a5f]`,
    };
  }

  if (status === "CANCELED") {
    const canceledText =
      canceledBy === "owner" || canceledBy === "studio"
        ? "Скасовано вами"
        : "Скасовано клієнтом";

    return {
      text: canceledText,
      icon: XCircle,
      badge: `${base} text-[#e5484d]`,
    };
  }

  if (status === "COMPLETED") {
    return {
      text: "Завершено",
      icon: PartyPopper,
      badge: "border border-[#e5e7eb] bg-[#f8f9fa] text-[#6b7280]",
    };
  }

  return {
    text: "Очікує підтвердження",
    icon: Clock,
    badge: `${base} text-[#ff5a00]`,
  };
}

function Avatar({ name, photoUrl, className = "" }) {
  const initials = initialsFromName(name);
  const src = toPublicUrl(photoUrl);

  return (
    <div
      className={cn(
        "relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[22px] border border-white bg-[#fff1e8] shadow-[0_10px_26px_rgba(255,90,0,0.10)]",
        className,
      )}
    >
      {src ? (
        <img
          src={src}
          alt={name || "Клієнт"}
          className="h-full w-full object-cover"
        />
      ) : (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,90,0,0.18),transparent_35%),radial-gradient(circle_at_80%_90%,rgba(255,214,189,0.65),transparent_38%)]" />

          <div className="absolute -right-3 -top-3 h-10 w-10 rounded-full bg-white/55 blur-sm" />
          <div className="absolute -bottom-4 -left-4 h-12 w-12 rounded-full bg-[#f3eee7]/80 blur-sm" />

          <span className="relative z-10 text-[25px] font-black tracking-[-0.03em] text-[#ff5a00]">
            {initials}
          </span>
        </>
      )}
    </div>
  );
}

function Button({ variant = "secondary", className = "", children, ...props }) {
  const variants = {
    primary:
      "bg-[#ff5a00] text-white shadow-[0_16px_34px_rgba(255,90,0,0.24)] hover:bg-[#ef4f00]",
    secondary:
      "border border-[#eadbc9] bg-white text-[#202020] shadow-sm hover:border-[#ffd6bd] hover:bg-[#fff7f0]",
    ghost: "text-[#202020] hover:bg-[#fff7f0]",
  };

  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function MiniChart({ data = [], trend = "flat" }) {
  const trendColor = {
    up: "text-emerald-500",
    flat: "text-sky-500",
    down: "text-rose-500",
  };

  const points = useMemo(() => {
    const values = data.length ? data.map(Number) : [0, 0, 0, 0, 0, 0, 0];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    return values.map((v, i) => ({
      x: i * (108 / Math.max(values.length - 1, 1)),
      y: 54 - ((v - min) / range) * 40,
    }));
  }, [data]);

  const smoothPath = points
    .map((point, i, arr) => {
      if (i === 0) return `M ${point.x} ${point.y}`;

      const prev = arr[i - 1];
      const cx = (prev.x + point.x) / 2;

      return `C ${cx} ${prev.y}, ${cx} ${point.y}, ${point.x} ${point.y}`;
    })
    .join(" ");

  const areaPath = `${smoothPath} L ${points.at(-1).x} 60 L ${points[0].x} 60 Z`;
  const gradientId = `mini-chart-${trend}-${data.join("-")}`;

  return (
    <svg
      viewBox="0 0 108 60"
      className={cn("hidden h-14 w-28 shrink-0 sm:block", trendColor[trend])}
      fill="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={areaPath} fill={`url(#${gradientId})`} />

      <path
        d={smoothPath}
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle
        cx={points.at(-1).x}
        cy={points.at(-1).y}
        r="4"
        fill="currentColor"
      />
    </svg>
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

      {(title || subtitle || badge || actions) && (
        <div className="flex flex-col gap-3 border-b border-[#f1ece5] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {typeof title === "string" ? (
                <h2 className="text-lg font-black tracking-[-0.03em] text-[#202020]">
                  {title}
                </h2>
              ) : (
                title
              )}

              {badge && (
                <span className="inline-flex items-center rounded-full bg-[#fff4ec] px-2.5 py-1 text-xs font-black text-[#ff6200]">
                  {badge}
                </span>
              )}
            </div>

            {subtitle && (
              <p className="mt-1 text-sm font-medium leading-5 text-[#7b766f]">
                {subtitle}
              </p>
            )}
          </div>

          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}

      <div className="p-5">{children}</div>
    </section>
  );
}

function Modal({
  open,
  onClose,
  title,
  badge = "Редагування",
  icon: Icon = NotebookText,
  children,
  footer,
  size = "md",
}) {
  useEffect(() => {
    if (!open) return undefined;

    document.body.style.overflow = "hidden";

    const handleEscape = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-stretch justify-center bg-[#202020]/45 p-0 backdrop-blur-[6px] sm:items-center sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={cn(
          "flex h-dvh w-full flex-col overflow-hidden rounded-none border-0 bg-[#f7f5f1] shadow-[0_30px_90px_rgba(15,23,42,0.24)]",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          "sm:h-auto sm:max-h-[calc(100dvh-48px)] sm:rounded-[30px] sm:border sm:border-[#f0e2d3]",
          sizeClasses[size],
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="relative shrink-0 overflow-hidden bg-[#f3eee7] px-5 py-5 sm:px-6 sm:py-6">
            <div className="absolute right-[-55px] top-[-70px] h-[180px] w-[180px] rounded-full bg-[#ff6200]/10 blur-3xl" />

            <div className="relative z-10 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[11px] font-black uppercase tracking-[0.08em] text-[#ff6200] shadow-[0_8px_20px_rgba(255,98,0,0.08)]">
                  <Icon className="h-3.5 w-3.5" />
                  {badge}
                </span>

                <h3 className="mt-3 text-[26px] font-black leading-[0.95] tracking-[-0.05em] text-[#202020] sm:text-[32px]">
                  {title}
                </h3>
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
        )}

        <div className="min-h-0 flex-1 overflow-y-auto bg-white px-5 py-5 pb-[110px] sm:px-6 sm:pb-5">
          {children}
        </div>

        {footer && (
          <div className="sticky bottom-0 shrink-0 border-t border-[#f0e7da] bg-[#fbfaf8] px-5 py-4 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  chartData = [],
  hideChart = false,
}) {
  const first = chartData?.[0] ?? 0;
  const last = chartData?.[chartData.length - 1] ?? 0;

  const trend = last > first ? "up" : last < first ? "down" : "flat";

  const trendStyles = {
    up: {
      text: "text-[#ff5a00]",
      bg: "from-[#fff1e8] via-white to-[#fff7f0]",
      iconBg: "from-[#fff1e8] to-white",
    },
    flat: {
      text: "text-[#77716b]",
      bg: "from-[#f3eee7] via-white to-[#fff7f0]",
      iconBg: "from-[#f3eee7] to-white",
    },
    down: {
      text: "text-[#e5484d]",
      bg: "from-[#fff1f1] via-white to-[#fff7f7]",
      iconBg: "from-[#fff1f1] to-white",
    },
  };

  const style = trendStyles[trend];

  return (
    <div
      className={cn(
        "group relative min-h-[112px] overflow-hidden rounded-[26px] border border-[#eadbc9] bg-gradient-to-br p-3.5 shadow-[0_12px_32px_rgba(17,17,17,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(17,17,17,0.09)] sm:min-h-[128px] sm:p-4 lg:min-h-[138px] lg:rounded-[30px] lg:p-5",
        style.bg,
      )}
    >
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-black/20 to-transparent" />

      <div className="relative z-10 flex h-full items-center gap-3 sm:gap-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border border-white/80 bg-gradient-to-br shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition-all duration-300 group-hover:scale-105 sm:h-14 sm:w-14 sm:rounded-[20px] lg:h-16 lg:w-16 lg:rounded-[22px]",
            style.iconBg,
          )}
        >
          <Icon
            className={cn("h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7", style.text)}
            strokeWidth={2.6}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[9px] font-black uppercase tracking-[0.16em] text-[#77716b] sm:text-[10px] lg:text-[11px]">
            {label}
          </p>

          <p className="mt-2 truncate text-[20px] font-black leading-none tracking-tight text-[#202020] sm:text-2xl lg:text-[28px]">
            {value}
          </p>

          {hint && (
            <p className="mt-2 truncate text-[11px] font-semibold text-[#77716b] sm:text-xs lg:text-sm">
              {hint}
            </p>
          )}
        </div>

        {!hideChart && <MiniChart data={chartData} trend={trend} />}
      </div>
    </div>
  );
}

const statusMeta = {
  loyal: {
    label: "Постійний",
    icon: Repeat,
    className: "border-violet-100 bg-violet-50 text-violet-700",
  },

  new: {
    label: "Новий",
    icon: UserPlus,
    className: "border-sky-200 bg-sky-50 text-sky-700",
  },

  attention: {
    label: "Активний",
    icon: AlertTriangle,
    className: "border-emerald-100 bg-emerald-50 text-emerald-700",
  },

  risk: {
    label: "Неактивний",
    icon: TrendingDown,
    className: "border-slate-200 bg-slate-100 text-slate-600",
  },

  vip: {
    label: "VIP",
    icon: Crown,
    className: "border-yellow-200 bg-yellow-50 text-yellow-700",
  },

  favorite: {
    label: "Особливий",
    icon: UserStar,
    className: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
  },
};

const statusDescriptions = {
  new: {
    title: "Новий",
    description:
      "Клієнт має тільки один нескасований запис або ще не має сформованої історії відвідувань.",
  },

  loyal: {
    title: "Постійний",
    description:
      "Клієнт має 2 або більше нескасованих записів, а останній візит був протягом останніх 30 днів.",
  },

  attention: {
    title: "Активний",
    description:
      "Останній нескасований запис був більше 30 днів тому, але не більше 60 днів.",
  },

  risk: {
    title: "Неактивний",
    description: "Клієнт не відвідував студію більше 60 днів.",
  },

  favorite: {
    title: "Особливий клієнт",
    description:
      "Статус встановлюється вручну власником студії для важливих клієнтів.",
  },

  vip: {
    title: "VIP-клієнт",
    description:
      "Статус лояльного клієнта, який автоматично встановлюється платформою. Його не можна змінити або прибрати вручну.",
  },
};

function StatusBadge({ status }) {
  const meta = statusMeta[status] || statusMeta.new;
  const info = statusDescriptions[status];
  const Icon = meta.icon;

  return (
    <div className="relative inline-flex">
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold sm:gap-1.5 sm:px-3 sm:py-1 sm:text-xs",
          meta.className,
        )}
      >
        <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        {meta.label}
      </span>
    </div>
  );
}

function SalonFavoriteBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-fuchsia-200 bg-fuchsia-50 px-2 py-0.5 text-[10px] font-bold text-fuchsia-700 sm:gap-1.5 sm:px-3 sm:py-1 sm:text-xs">
      <UserStar className="h-3 w-3 text-fuchsia-600 sm:h-3.5 sm:w-3.5" />
      Особливий
    </span>
  );
}

function ClientStatusBadges({ client }) {
  const isVip = client.isVip || client.status === "vip";

  const mainStatus =
    client.status === "vip"
      ? client.originalStatus || client.baseStatus || "loyal"
      : client.status;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isVip ? (
        <StatusBadge status="vip" />
      ) : client.isFavorite ? (
        <SalonFavoriteBadge />
      ) : (
        <StatusBadge status={mainStatus} />
      )}
    </div>
  );
}

const filterItems = [
  { value: "all", label: "Усі" },
  { value: "new", label: "Нові" },
  { value: "loyal", label: "Постійні" },
  { value: "attention", label: "Активні" },
  { value: "risk", label: "Неактивні" },
  { value: "vip", label: "VIP" },
];

const sortItems = [
  { value: "nameAsc", label: "За алфавітом" },
  { value: "newest", label: "За датою додавання" },
  { value: "lastVisit", label: "За останнім візитом" },
  { value: "bookings", label: "За кількістю бронювань" },
  { value: "spent", label: "За витратами" },
];

const emptyFilterInfo = {
  all: {
    icon: Users,
    title: "Поки що немає клієнтів",
    description: (
      <span className="flex flex-col gap-1">
        <span>Клієнти зʼявляться тут автоматично після перших бронювань.</span>
      </span>
    ),
  },

  new: {
    icon: UserPlus,
    title: "Поки що немає нових клієнтів",
    description: (
      <span className="flex flex-col gap-1">
        <span>Тут зʼявляться клієнти з першими записами.</span>
      </span>
    ),
  },

  loyal: {
    icon: Repeat,
    title: "Поки що немає постійних клієнтів",
    description: (
      <span className="flex flex-col gap-1">
        <span>Постійні клієнти зʼявляться після повторних відвідувань.</span>
      </span>
    ),
  },

  attention: {
    icon: AlertTriangle,
    title: "Поки що немає активних клієнтів",
    description: (
      <span className="flex flex-col gap-1">
        <span>Тут будуть клієнти, які нещодавно записувались до студії.</span>
      </span>
    ),
  },

  risk: {
    icon: TrendingDown,
    title: "Поки що немає неактивних клієнтів",
    description: (
      <span className="flex flex-col gap-1">
        <span>Неактивні клієнти зʼявляться, якщо давно не було записів.</span>
      </span>
    ),
  },

  vip: {
    icon: Crown,
    title: "Поки що немає VIP клієнтів",
    description: (
      <span className="flex flex-col gap-1">
        <span>VIP-статус зʼявиться у найцінніших клієнтів студії.</span>
      </span>
    ),
  },
};

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toISODateKey(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function addMonthsSafe(date, amount) {
  const next = new Date(date);
  next.setDate(1);
  next.setMonth(next.getMonth() + amount);
  next.setHours(0, 0, 0, 0);
  return next;
}

function isSameMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export default function Clients() {
  const { studio } = useStudio();
  const studioId = studio?.id ?? null;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [clientTabs, setClientTabs] = useState({});
  const clientsListRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [exportOpen, setExportOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [exportFields, setExportFields] = useState({
    name: true,
    phone: true,
    email: true,
    status: true,
    birthDate: true,

    bookings: true,
    cancellations: true,
    spent: true,
    averageCheck: true,

    lastVisit: true,
    nextVisit: true,
    favoriteService: true,

    notes: false,
    registeredAt: false,
    vip: false,
    favorite: false,
  });
  useEffect(() => {
    function calculateItemsPerPage() {
      const width = window.innerWidth;

      if (width >= 1280) {
        setItemsPerPage(12); // 4 колонки × 3 рядки
      } else if (width >= 1024) {
        setItemsPerPage(9); // 3 колонки × 3 рядки
      } else if (width >= 640) {
        setItemsPerPage(8); // 2 колонки × 4 рядки
      } else {
        setItemsPerPage(6); // телефон
      }
    }

    calculateItemsPerPage();

    window.addEventListener("resize", calculateItemsPerPage);

    return () => {
      window.removeEventListener("resize", calculateItemsPerPage);
    };
  }, []);

  const [noteClient, setNoteClient] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [allClients, setAllClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedPhone, setCopiedPhone] = useState(false);

  const studioCreatedMonth = useMemo(() => {
    const source = studio?.ownerCreatedAt || studio?.createdAt || new Date();

    const d = new Date(source);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);

    return d;
  }, [studio?.ownerCreatedAt, studio?.createdAt]);

  const [statsTabIndex, setStatsTabIndex] = useState(() => {
    const saved = Number(localStorage.getItem("clientsStatsTabIndex"));
    return Number.isFinite(saved) ? saved : 0;
  });

  const emptyInfo = emptyFilterInfo[filter] || emptyFilterInfo.all;
  const EmptyIcon = emptyInfo.icon;
  async function handleCopyPhone(phone) {
    if (!phone) return;

    try {
      await navigator.clipboard.writeText(phone);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = phone;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }

    setCopiedPhone(true);

    setTimeout(() => {
      setCopiedPhone(false);
    }, 1600);
  }

  useEffect(() => {
    let alive = true;

    async function loadClients() {
      try {
        setLoading(true);
        setError("");

        if (!studioId) {
          setAllClients([]);
          return;
        }

        const data = await api(`/owner/studio/${studioId}/clients`);

        if (!alive) return;

        setAllClients(Array.isArray(data?.clients) ? data.clients : []);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "Не вдалося завантажити клієнтів");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadClients();

    return () => {
      alive = false;
    };
  }, [studioId]);

  async function handleAddNote() {
    if (!studioId) return;

    const text = noteDraft.trim();
    if (!text || !noteClient?.id) return;

    const data = await api(
      `/owner/studio/${studioId}/clients/${noteClient.id}/notes`,
      {
        method: "POST",
        body: { text },
      },
    );

    setAllClients((current) =>
      current.map((client) =>
        client.id === noteClient.id
          ? {
              ...client,
              notes: [data.note, ...(client.notes || [])],
            }
          : client,
      ),
    );

    setNoteClient(null);
    setNoteDraft("");
  }

  async function handleDeleteNote(clientId, noteId) {
    if (!studioId) return;

    await api(`/owner/studio/${studioId}/clients/${clientId}/notes/${noteId}`, {
      method: "DELETE",
    });

    setAllClients((current) =>
      current.map((client) =>
        client.id === clientId
          ? {
              ...client,
              notes: (client.notes || []).filter((note) => note.id !== noteId),
            }
          : client,
      ),
    );
  }

  async function handleToggleVip(client) {
    if (!studioId) return;

    const data = await api(
      `/owner/studio/${studioId}/clients/${client.id}/favorite`,
      {
        method: client.isFavorite ? "DELETE" : "PATCH",
      },
    );

    setAllClients((current) =>
      current.map((item) =>
        item.id === client.id
          ? {
              ...item,
              isFavorite: data.favorite.isFavorite,
              favoriteSince: data.favorite.favoriteSince,
            }
          : item,
      ),
    );
  }

  function handleExportClients() {
    const sortedClients = [...clients].sort((a, b) => {
      const firstNameCompare = (a.firstName || "").localeCompare(
        b.firstName || "",
        "uk",
        { sensitivity: "base" },
      );

      if (firstNameCompare !== 0) {
        return firstNameCompare;
      }

      return (a.lastName || "").localeCompare(b.lastName || "", "uk", {
        sensitivity: "base",
      });
    });

    const rows = sortedClients.map((client) => {
      const row = {};

      if (exportFields.name) {
        row["Ім'я"] = client.firstName || "-";
        row["Прізвище"] = client.lastName || "-";
      }

      // решта полів...
      if (exportFields.phone) row["Телефон"] = client.phone || "-";
      if (exportFields.email) row["Email"] = client.email || "-";
      if (exportFields.birthDate) {
        row["Дата народження"] = client.birthDate
          ? formatDateUA(client.birthDate)
          : "-";
      }
      if (exportFields.bookings) row["Всього записів"] = client.bookings || 0;
      if (exportFields.cancellations)
        row["Скасовано"] = client.cancellations || 0;
      if (exportFields.lastVisit) {
        row["Останній візит"] = client.lastVisit
          ? formatDateUA(client.lastVisit)
          : "-";
      }

      if (exportFields.nextVisit) {
        row["Наступний візит"] = client.nextBooking?.date
          ? formatDateUA(client.nextBooking.date)
          : "-";
      }
      if (exportFields.spent) row["Витрачено"] = client.spent || 0;
      if (exportFields.averageCheck)
        row["Середній чек"] = client.averageCheck || 0;
      if (exportFields.status) {
        row["Статус"] =
          statusMeta[client.status]?.label || client.status || "-";
      }

      if (exportFields.favoriteService)
        row["Улюблена послуга"] = client.favoriteService || "-";

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const columnWidths = Object.keys(rows[0] || {}).map((key) => {
      const maxLength = Math.max(
        key.length,
        ...rows.map((row) => String(row[key] ?? "").length),
      );

      return {
        wch: Math.max(maxLength + 8, 18),
      };
    });

    worksheet["!cols"] = columnWidths;

    const range = XLSX.utils.decode_range(worksheet["!ref"]);

    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({
          r: row,
          c: col,
        });

        if (!worksheet[cellAddress]) continue;

        worksheet[cellAddress].s = {
          font: {
            bold: row === 0,
          },
          alignment: {
            horizontal: "center",
            vertical: "center",
          },
        };
      }
    }

    // Дані
    for (let row = 1; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });

        if (worksheet[cellAddress] && worksheet[cellAddress].v === "-") {
          worksheet[cellAddress].s = {
            alignment: {
              horizontal: "center",
              vertical: "center",
            },
          };
        }
      }
    }
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Клієнти");
    XLSX.writeFile(
      workbook,
      `clients-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  }

  const clients = useMemo(() => {
    const q = query.trim().toLowerCase();

    return allClients
      .map((client) => ({
        ...client,
      }))
      .filter((client) => {
        const matchesFilter =
          filter === "all" ||
          client.status === filter ||
          (filter === "vip" && client.isVip);
        const haystack = `${
          [client.firstName, client.lastName].filter(Boolean).join(" ") || ""
        } ${client.phone || ""} ${client.email || ""}`.toLowerCase();

        return matchesFilter && (!q || haystack.includes(q));
      })
      .sort((a, b) => {
        if (sort === "bookings") {
          return (b.bookings || 0) - (a.bookings || 0);
        }

        if (sort === "spent") {
          return (b.spent || 0) - (a.spent || 0);
        }

        if (sort === "nameAsc") {
          return `${a.lastName || ""} ${a.firstName || ""}`.localeCompare(
            `${b.lastName || ""} ${b.firstName || ""}`,
            "uk",
          );
        }

        if (sort === "newest") {
          return dateScore(b.registeredAt) - dateScore(a.registeredAt);
        }

        return dateScore(b.lastVisit) - dateScore(a.lastVisit);
      });
  }, [allClients, filter, query, sort]);

  const totalPages = Math.max(1, Math.ceil(clients.length / itemsPerPage));

  const visibleClients = clients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  useEffect(() => {
    clientsListRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [currentPage]);

  const selectedClient = useMemo(() => {
    if (!selectedClientId) return null;

    return (
      allClients.find(
        (client) => String(client.id) === String(selectedClientId),
      ) || null
    );
  }, [allClients, selectedClientId]);

  const totalSpent = allClients.reduce((sum, client) => sum + client.spent, 0);
  const totalBookings = allClients.reduce(
    (sum, client) => sum + client.bookings,
    0,
  );
  const averageCheck = Math.round(totalSpent / Math.max(totalBookings, 1));
  const newClientsCount = allClients.filter(
    (client) => client.status === "new",
  ).length;
  const clientsWithStatuses = allClients.map((client) => ({
    ...client,
    status: client.status,
  }));
  const loyalPercent = clientsWithStatuses.length
    ? Math.round(
        (clientsWithStatuses.filter((client) =>
          ["loyal", "vip"].includes(client.status),
        ).length /
          clientsWithStatuses.length) *
          100,
      )
    : 0;

  const selectedFilterLabel =
    filterItems.find((item) => item.value === filter)?.label || "Усі статуси";
  const selectedSortLabel =
    sortItems.find((item) => item.value === sort)?.label ||
    "За датою додавання";

  const filterItemsWithCounts = filterItems.map((item) => {
    let count = 0;

    if (item.value === "all") {
      count = allClients.length;
    } else if (item.value === "vip") {
      count = allClients.filter((client) => client.isVip).length;
    } else {
      count = allClients.filter(
        (client) => client.status === item.value,
      ).length;
    }

    return {
      ...item,
      count,
    };
  });

  const mostActiveDay = useMemo(() => {
    const dayNames = [
      "Неділя",
      "Понеділок",
      "Вівторок",
      "Середа",
      "Четвер",
      "Пʼятниця",
      "Субота",
    ];

    const counts = Array(7).fill(0);

    allClients.forEach((client) => {
      (client.history || []).forEach((booking) => {
        if (!booking?.date) return;

        const date = new Date(booking.date);
        if (Number.isNaN(date.getTime())) return;

        counts[date.getDay()] += 1;
      });
    });

    const max = Math.max(...counts);

    if (max === 0) {
      return {
        label: "—",
        count: 0,
      };
    }

    const dayIndex = counts.indexOf(max);

    return {
      label: dayNames[dayIndex],
      count: max,
    };
  }, [allClients]);

  const currentMonth = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const statsTabs = useMemo(() => {
    const tabs = [];

    let cursor = new Date(studioCreatedMonth);

    for (let i = 0; i < 120; i++) {
      const date = new Date(cursor);

      if (isSameMonth(date, currentMonth)) {
        tabs.push({
          type: "today",
          date: null,
          label: "Сьогодні",
        });
      }

      tabs.push({
        type: "month",
        date,
        label: isSameMonth(date, currentMonth)
          ? "Поточний місяць"
          : date.toLocaleDateString("uk-UA", {
              month: "long",
              year: "numeric",
            }),
      });

      cursor = addMonthsSafe(cursor, 1);
    }

    return tabs;
  }, [studioCreatedMonth, currentMonth]);

  useEffect(() => {
    if (!statsTabs.length) return;

    if (statsTabIndex < 0 || statsTabIndex >= statsTabs.length) {
      setStatsTabIndex(0);
      localStorage.setItem("clientsStatsTabIndex", "0");
      return;
    }

    localStorage.setItem("clientsStatsTabIndex", String(statsTabIndex));
  }, [statsTabIndex, statsTabs.length]);

  const activeStatsTab = statsTabs[statsTabIndex] || statsTabs[0] || null;

  const filteredClientsForStats = useMemo(() => {
    if (!activeStatsTab) return [];

    if (activeStatsTab?.type === "today") {
      const todayKey = toISODateKey(new Date());

      return allClients
        .map((client) => {
          const history = (client.history || []).filter(
            (booking) => String(booking.date || "").slice(0, 10) === todayKey,
          );

          return { ...client, history };
        })
        .filter((client) => client.history.length > 0);
    }

    const year = activeStatsTab.date.getFullYear();
    const month = activeStatsTab.date.getMonth();

    return allClients
      .map((client) => {
        const history = (client.history || []).filter((booking) => {
          const d = new Date(booking.date);
          if (Number.isNaN(d.getTime())) return false;

          return d.getFullYear() === year && d.getMonth() === month;
        });

        return { ...client, history };
      })
      .filter((client) => client.history.length > 0);
  }, [allClients, activeStatsTab]);

  const statsBookings = useMemo(() => {
    return filteredClientsForStats.flatMap((client) => client.history || []);
  }, [filteredClientsForStats]);

  const filteredTotalBookings = statsBookings.length;

  const filteredTotalSpent = statsBookings.reduce(
    (sum, booking) => sum + Number(booking.price || 0),
    0,
  );

  const filteredAverageCheck = Math.round(
    filteredTotalSpent / Math.max(filteredTotalBookings, 1),
  );

  const filteredNewClientsCount = filteredClientsForStats.filter(
    (client) => client.status === "new",
  ).length;

  const filteredLoyalPercent = filteredClientsForStats.length
    ? Math.round(
        (filteredClientsForStats.filter((client) =>
          ["loyal", "vip"].includes(client.status),
        ).length /
          filteredClientsForStats.length) *
          100,
      )
    : 0;

  const filteredMostActiveDay = useMemo(() => {
    const dayNames = [
      "Неділя",
      "Понеділок",
      "Вівторок",
      "Середа",
      "Четвер",
      "Пʼятниця",
      "Субота",
    ];

    const counts = Array(7).fill(0);

    statsBookings.forEach((booking) => {
      if (!booking?.date) return;

      const date = new Date(booking.date);
      if (Number.isNaN(date.getTime())) return;

      counts[date.getDay()] += 1;
    });

    const max = Math.max(...counts);

    if (max === 0) {
      return { label: "—", count: 0 };
    }

    const dayIndex = counts.indexOf(max);

    return {
      label: dayNames[dayIndex],
      count: max,
    };
  }, [statsBookings]);

  const filteredMostActiveHour = useMemo(() => {
    const counts = Array.from({ length: 24 }, (_, hour) => ({
      label: `${String(hour).padStart(2, "0")}:00`,
      count: 0,
    }));

    statsBookings.forEach((booking) => {
      if (!booking?.date) return;
      if (booking.status === "CANCELED" || booking.status === "canceled")
        return;

      const date = new Date(booking.date);

      if (Number.isNaN(date.getTime())) return;

      const hour = date.getHours();

      counts[hour].count += 1;
    });

    const best = counts.reduce((max, item) =>
      item.count > max.count ? item : max,
    );

    if (best.count === 0) {
      return { label: "—", count: 0 };
    }

    return best;
  }, [statsBookings]);

  return (
    <div className="min-h-screen bg-[#fbfaf8] pb-8">
      <div className="mx-auto max-w-7xl space-y-6 ">
<SectionCard className="bg-white/95 backdrop-blur-xl">
  <div className="flex items-start justify-between gap-3">
    <div className="min-w-0 flex-1">
     <h1 className="text-5xl font-black leading-[0.95] tracking-tight text-[#202020] sm:text-6xl">
        Клі<span className="text-[#ff5a00]">єнти</span>
      </h1>
    </div>
<div className="flex shrink-0 items-center gap-1 sm:gap-2">
  <button
    type="button"
    onClick={() => setInfoOpen(true)}
    className="grid h-10 w-10 place-items-center rounded-full text-[#ff6200] transition-all duration-200 hover:scale-110 hover:bg-[#fff7f0] active:scale-95 sm:h-12 sm:w-12"
    title="Інформація"
  >
    <CircleAlert className="h-5 w-5" />
  </button>

<div className="hidden sm:block">
  <Button
    variant="ghost"
    className="h-12 hover:bg-[#fff7f0]"
    onClick={() => setExportOpen(true)}
  >
    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
    Експорт
  </Button>
</div>

<Button
  variant="primary"
  className="h-10 w-10 p-0 sm:h-12 sm:w-auto sm:px-5"
>
  <Plus className="h-4 w-4 shrink-0" />

  <span className="hidden sm:inline">
    Додати клієнта
  </span>
</Button>
      
    </div>
  </div>

  <p className="mt-3 w-full text-[13px] font-semibold leading-5 text-[#77716b] sm:text-[14px] sm:leading-6">
    Переглядай базу клієнтів, відстежуй історію візитів, статуси, фінанси та
    взаємодію зі студією.
  </p>

</SectionCard>

<SectionCard
  title="Список клієнтів"
  subtitle="Пошук, фільтрація, сортування та картки клієнтів."
  badge={`${clients.length} клієнт(ів)`}
>
        <section className="space-y-6">
<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
 <div className="relative w-full sm:max-w-[390px]">
    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8b95a5]" />

    <input
      value={query}
      onChange={(e) => {
        setQuery(e.target.value);
        setCurrentPage(1);
        setSelectedClientId(null);
        setClientTabs({});
      }}
      placeholder="Пошук клієнтів..."
      className="h-12 w-full rounded-[14px] border border-[#e5eaf0] bg-white pl-12 pr-4 text-sm font-semibold text-[#202020] outline-none transition placeholder:text-[#9aa3af] hover:border-[#d8dee8] focus:border-[#ff6200] focus:ring-4 focus:ring-[#ff6200]/10"
    />
  </div>

  <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:shrink-0">
    <div className="relative min-w-0">
      <button
        type="button"
        onClick={() => {
          setFilterOpen((current) => !current);
          setSortOpen(false);
        }}
        className="inline-flex h-12 w-full items-center justify-between gap-3 rounded-[14px] border border-[#e5eaf0] bg-white px-4 text-sm font-bold text-[#202020] shadow-sm transition hover:border-[#d8dee8] hover:bg-[#fff8f3] sm:min-w-[180px]"
      >
        <span className="truncate">
          {filter === "all" ? "Усі статуси" : selectedFilterLabel}
        </span>

        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[#6b7280] transition",
            filterOpen && "rotate-180 text-[#ff6200]",
          )}
        />
      </button>

      {filterOpen && (
      <div className="absolute left-0 right-0 z-30 mt-2 w-full overflow-hidden rounded-[16px] border border-[#e5eaf0] bg-white py-2 shadow-[0_18px_42px_rgba(15,23,42,0.14)] sm:right-0 sm:left-auto sm:min-w-[220px]">
          {filterItemsWithCounts.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                setFilter(item.value);
                setFilterOpen(false);
                setCurrentPage(1);
                setSelectedClientId(null);
                setClientTabs({});
              }}
              className={cn(
                "flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-bold transition",
                filter === item.value
                  ? "bg-[#fff1e8] text-[#ff6200]"
                  : "text-[#202020] hover:bg-[#fbfaf8]",
              )}
            >
              <span>{item.label}</span>
              <span className="text-xs text-[#8b95a5]">{item.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>

    <div className="relative min-w-0">
      <button
        type="button"
        onClick={() => {
          setSortOpen((current) => !current);
          setFilterOpen(false);
        }}
        className="inline-flex h-12 w-full items-center justify-between gap-3 rounded-[14px] border border-[#e5eaf0] bg-white px-4 text-sm font-bold text-[#202020] shadow-sm transition hover:border-[#d8dee8] hover:bg-[#fff8f3] sm:min-w-[210px]"
      >
        <span className="truncate">{selectedSortLabel}</span>

        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[#6b7280] transition",
            sortOpen && "rotate-180 text-[#ff6200]",
          )}
        />
      </button>

      {sortOpen && (
      <div className="absolute left-0 right-0 z-30 mt-2 w-full overflow-hidden rounded-[16px] border border-[#e5eaf0] bg-white py-2 shadow-[0_18px_42px_rgba(15,23,42,0.14)] sm:right-0 sm:left-auto sm:min-w-[240px]">
          {sortItems.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                setSort(item.value);
                setSortOpen(false);
                setCurrentPage(1);
                setSelectedClientId(null);
                setClientTabs({});
              }}
              className={cn(
                "block w-full px-4 py-3 text-left text-sm font-bold transition",
                sort === item.value
                  ? "bg-[#fff1e8] text-[#ff6200]"
                  : "text-[#202020] hover:bg-[#fbfaf8]",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  </div>
</div>

          {loading && (
            <div className="rounded-[20px] border border-[#e5eaf0] bg-white p-6 text-center text-sm font-bold text-[#77716b] shadow-sm">
              Завантажуємо клієнтів...
            </div>
          )}

          {error && !loading && (
            <div className="rounded-[20px] border border-[#ffd8d8] bg-[#fff7f7] p-6 text-center text-sm font-bold text-[#e5484d] shadow-sm">
              {error}
            </div>
          )}

          {!loading && !error && clients.length === 0 ? (
            <div className="rounded-[24px] border-2 border-dashed border-[#e5d7c7] bg-white p-8 text-center shadow-sm">
              <div className="mb-3 flex items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#fff1e8]">
                  <EmptyIcon className="h-6 w-6 text-[#ff6200]" />
                </div>
              </div>

              <p className="text-sm font-black text-[#202020]">
                {emptyInfo.title}
              </p>

              <p className="mt-1 text-xs font-medium text-[#77716b]">
                {emptyInfo.description}
              </p>
            </div>
          ) : !loading && !error ? (
            <>
              <div
                ref={clientsListRef}
                className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4"
              >
                {visibleClients.map((client) => (
                  <ClientAccordion
                    key={client.id}
                    client={{
                      ...client,
                      notes: client.notes || [],
                    }}
                    onOpenDetails={() => {
                      setSelectedClientId(client.id);
                      setClientTabs((current) => ({
                        ...current,
                        [client.id]: current[client.id] || "history",
                      }));
                    }}
                    onAddNote={() => {
                      setNoteClient(client);
                      setNoteDraft("");
                    }}
                    onDeleteNote={(noteId) =>
                      handleDeleteNote(client.id, noteId)
                    }
                    onToggleVip={() => handleToggleVip(client)}
                    onCopyPhone={handleCopyPhone}
                    copiedPhone={copiedPhone}
                  />
                ))}
              </div>

              <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-center text-sm font-medium text-[#6b7280]">
                  Показано{" "}
                  {clients.length === 0
                    ? 0
                    : (currentPage - 1) * itemsPerPage + 1}
                  -{Math.min(currentPage * itemsPerPage, clients.length)} з{" "}
                  {clients.length}
                </p>

                <div className="flex items-center justify-center gap-2 self-center sm:self-auto">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                    className="grid h-10 w-10 place-items-center rounded-[12px] border border-[#e5eaf0] bg-white text-[#6b7280] transition hover:bg-[#fff8f3] active:scale-[0.98] disabled:opacity-40"
                    aria-label="Попередня сторінка"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {Array.from({ length: Math.min(totalPages, 3) }).map(
                    (_, index) => {
                      const page = index + 1;

                      return (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={cn(
                            "grid h-10 w-10 place-items-center rounded-[12px] border text-sm font-black transition active:scale-[0.98]",
                            currentPage === page
                              ? "border-[#ff6200] bg-[#fff7f0] text-[#ff6200]"
                              : "border-[#e5eaf0] bg-white text-[#202020] hover:bg-[#fff8f3]",
                          )}
                        >
                          {page}
                        </button>
                      );
                    },
                  )}

                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() =>
                      setCurrentPage((page) => Math.min(totalPages, page + 1))
                    }
                    className="grid h-10 w-10 place-items-center rounded-[12px] border border-[#e5eaf0] bg-white text-[#6b7280] transition hover:bg-[#fff8f3] active:scale-[0.98] disabled:opacity-40"
                    aria-label="Наступна сторінка"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </section>
</SectionCard>

      </div>

      <Modal
        open={selectedClient != null}
        onClose={() => setSelectedClientId(null)}
        title={"Профіль клієнта"}
        badge="Клієнт"
        icon={ContactRound}
        size="lg"
      >
        {selectedClient && (
          <ClientDetails
            client={{
              ...selectedClient,
              notes: selectedClient.notes || [],
            }}
            activeTab={clientTabs[selectedClient.id] || "history"}
            onTabChange={(tab) =>
              setClientTabs((current) => ({
                ...current,
                [selectedClient.id]: tab,
              }))
            }
            onAddNote={() => {
              setNoteClient(selectedClient);
              setNoteDraft("");
            }}
            onDeleteNote={(noteId) =>
              handleDeleteNote(selectedClient.id, noteId)
            }
            onToggleVip={() => handleToggleVip(selectedClient)}
          />
        )}
      </Modal>

      <Modal
        open={noteClient != null}
        onClose={() => {
          setNoteClient(null);
          setNoteDraft("");
        }}
        title="Додати нотатку"
        badge="Нотатка"
        icon={NotebookText}
        size="sm"
        footer={
          <div className="flex w-full flex-row gap-2 sm:justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setNoteClient(null);
                setNoteDraft("");
              }}
              className="flex-1 sm:flex-none"
            >
              Скасувати
            </Button>

            <Button
              variant="primary"
              disabled={!noteDraft.trim()}
              onClick={handleAddNote}
              className="flex-1 sm:flex-none"
            >
              <Check className="h-4 w-4" />
              Додати
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="rounded-[22px] border border-[#ffd6bd] bg-[#fff7f0] p-3.5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#ff5a00] shadow-sm">
                <AlertTriangle className="h-4.5 w-4.5" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-bold text-[#202020]">
                  Внутрішня інформація
                </p>
                <p className="mt-1 text-xs font-medium leading-5 text-[#77716b]">
                  Додавайте побажання, алергії, звички або важливі деталі перед
                  наступним візитом.
                </p>
              </div>
            </div>
          </div>

          <textarea
            value={noteDraft}
            maxLength={100}
            onChange={(e) => setNoteDraft(e.target.value.slice(0, 100))}
            rows={5}
            placeholder="Напр. Любить коротку стрижку, алергія на фарбу, просить каву..."
            className="w-full resize-none rounded-2xl border border-[#eadbc9] bg-white px-4 py-3 text-sm font-medium text-[#202020] outline-none transition-all placeholder:text-[#77716b] hover:bg-[#fff7f0] focus:border-[#ff5a00] focus:ring-4 focus:ring-[#ff5a00]/10"
          />
          <div className="text-right text-[11px] font-medium text-[#77716b]">
            {noteDraft.length}/100
          </div>
        </div>
      </Modal>
      <Modal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Експорт клієнтів"
        badge="Excel"
        icon={Download}
        size="sm"
        footer={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setExportOpen(false)}
            >
              Скасувати
            </Button>

            <Button
              variant="primary"
              className="flex-1"
              onClick={() => {
                handleExportClients();
                setExportOpen(false);
              }}
            >
              <Download className="h-4 w-4" />
              Експортувати
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            ["name", "Ім'я та прізвище"],
            ["phone", "Телефон"],
            ["email", "Email"],
            ["birthDate", "Дата народження"],
            ["nextVisit", "Наступний візит"],
            ["lastVisit", "Останній візит"],
            ["bookings", "Всього записів"],
            ["cancellations", "Скасовано"],
            ["spent", "Витрачено"],
            ["averageCheck", "Середній чек"],
            ["status", "Статус"],
            ["favoriteService", "Улюблена послуга"],
          ].map(([key, label]) => (
            <label
              key={key}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-[#eadbc9] p-3"
            >
              <span className="text-sm font-semibold">{label}</span>

              <input
                type="checkbox"
                checked={exportFields[key]}
                onChange={(e) =>
                  setExportFields((prev) => ({
                    ...prev,
                    [key]: e.target.checked,
                  }))
                }
                className="cursor-pointer"
              />
            </label>
          ))}
        </div>
      </Modal>
      <Modal
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        title="Інструкція сторінки"
        badge="Клієнти"
        icon={CircleAlert}
        size="lg"
      >
        <div className="space-y-5 text-sm font-medium leading-6 text-[#77716b]">
          <div>
            <h4 className="text-base font-black text-[#202020]">
              Що показує ця сторінка
            </h4>
            <p className="mt-1">
              Тут зібрані всі клієнти студії, які мали записи. Клієнти додаються
              автоматично після бронювання.
            </p>
          </div>

          <div>
            <h4 className="text-base font-black text-[#202020]">
              Статуси клієнтів
            </h4>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {statusInfoItems.map((item) => (
                <div
                  key={item.value}
                  className="rounded-[18px] border border-[#eadbc9] bg-[#fbfaf8] p-4"
                >
                  <div className="mb-2">
                    <StatusBadge status={item.value} />
                  </div>

                  <p className="text-[13px] font-semibold leading-5 text-[#77716b]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-base font-black text-[#202020]">
              Можливості сторінки
            </h4>

            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Пошук клієнтів за іменем, прізвищем, телефоном або email.</li>
              <li>
                Фільтрація за статусами: нові, постійні, активні, неактивні,
                VIP.
              </li>
              <li>
                Сортування за алфавітом, датою додавання, останнім візитом,
                бронюваннями та витратами.
              </li>
              <li>
                Перегляд історії записів, фінансів, статусів і нотаток клієнта.
              </li>
              <li>Експорт клієнтів у Excel з вибором потрібних колонок.</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function MiniMetric({ label, value, icon: Icon, danger = false }) {
  return (
    <div className="min-w-0 rounded-[18px] border border-[#ececec] bg-white px-3 py-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div
            className={cn(
              "ml-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              danger ? "text-[#e5484d]" : "text-[#ff5a00]",
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium leading-tight text-[#7b7b7b]">
            {label}
          </p>

          <p className={cn("mt-1 truncate !text-[13px] font-black sm:text-sm")}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function getClientBookings(client) {
  return Array.isArray(client.history) ? client.history : [];
}
function daysAgo(date) {
  if (!date) return null;

  const diff =
    new Date().setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0);

  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function ClientAccordion({ client, onOpenDetails, onCopyPhone, copiedPhone }) {
  return (
    <article
      onClick={onOpenDetails}
      className="
    relative z-0
    cursor-pointer
    overflow-visible
    rounded-[18px]
    border border-[#e5eaf0]
    bg-white
    shadow-[0_10px_30px_rgba(15,23,42,0.045)]
    transition
    hover:z-20
    hover:-translate-y-0.5
    hover:shadow-[0_18px_44px_rgba(15,23,42,0.08)]
    active:scale-[0.99]
  "
    >
      <div className="p-4">
        <div className="relative flex justify-center">
          <ClientStatusBadges client={client} />

          {/* <button
    type="button"
    onClick={onOpenDetails}
    className="absolute right-0 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-[#657084] transition hover:bg-[#f4f6f8] hover:text-[#202020]"
    title="Деталі клієнта"
    aria-label="Деталі клієнта"
  >
            <ChevronRight className="h-5 w-5" />
          </button> */}
        </div>

        <button
          type="button"
          onClick={onOpenDetails}
          className="mt-4 flex w-full flex-col items-center text-center"
        >
          <Avatar
            name={[client.firstName, client.lastName].filter(Boolean).join(" ")}
            photoUrl={client.photoUrl}
            className="h-12 w-12 rounded-full border-[#eef1f5] shadow-[0_10px_26px_rgba(15,23,42,0.10)]"
          />

          <h3 className="mt-2 line-clamp-2 text-[13px] font-black leading-4">
            {[client.firstName, client.lastName].filter(Boolean).join(" ") ||
              "Клієнт"}
          </h3>
        </button>

        <div className="mt-4 space-y-3 text-center">
          <button
            type="button"
            onClick={() => onCopyPhone?.(client.phone)}
            className="flex w-full justify-center gap-1.5 text-[12px] font-medium text-[#586174] transition hover:text-[#ff6200] sm:text-sm"
          >
            <Phone className="relative top-[1px] h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            <span>{client.phone || "Номер відсутній"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

const statusInfoItems = [
  {
    value: "new",
    title: "Новий",
    description:
      "Клієнт має тільки один нескасований запис або ще не має сформованої історії відвідувань.",
  },
  {
    value: "loyal",
    title: "Постійний",
    description:
      "Клієнт має 2 або більше нескасованих записів, а останній візит був протягом останніх 30 днів.",
  },
  {
    value: "attention",
    title: "Потребує уваги",
    description:
      "Останній нескасований запис був більше 30 днів тому, але не більше 60 днів.",
  },
  {
    value: "risk",
    title: "Ризик втрати",
    description:
      "Клієнт не був у студії більше 60 днів. Варто нагадати про себе або запропонувати повернутись.",
  },
  {
    value: "favorite",
    title: "Особливий клієнт",
    description:
      "Статус встановлюється вручну власником студії для важливих або пріоритетних клієнтів.",
  },
  {
    value: "vip",
    title: "VIP",
    description:
      "Статус лояльного клієнта, який автоматично встановлюється платформою. Цей статус не можна змінити або прибрати вручну власником студії.",
  },
];

function FinanceItem({ icon: Icon, label, value, color }) {
  return (
    <div className="min-w-0 rounded-[18px] bg-[#fbfaf8] px-3 py-3">
      <div
        className={cn(
          "mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm",
          color,
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <p className="text-[11px] font-bold leading-tight text-[#8a837c]">
        {label}
      </p>

      <p className="mt-1 line-clamp-2 text-[14px] font-black leading-5 text-[#202020]">
        {value}
      </p>
    </div>
  );
}

function ClientDetails({
  client,
  activeTab,
  onTabChange,
  onAddNote,
  onDeleteNote,
  onToggleVip,
  compactHeader = false,
}) {
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(3);
  const [copiedPhone, setCopiedPhone] = useState(false);

  if (!client) return null;

  const bookings = getClientBookings(client);
  const visibleBookings = bookings.slice(0, visibleHistoryCount);
  const hasMoreBookings = visibleHistoryCount < bookings.length;
  const tabs = [
    { value: "history", label: "Історія", icon: CalendarDays },
    { value: "finance", label: "Фінанси", icon: Wallet },
    { value: "statuses", label: "Статус", icon: BadgeCheck },
    { value: "notes", label: "Нотатки", icon: NotebookText },
  ];

  return (
    <aside
      className={cn(
        "h-fit overflow-hidden bg-white",
        compactHeader ? "border-t border-[#eadbc9]" : "",
      )}
    >
      <div className="">
        {!compactHeader && (
          <div className="flex items-start gap-3">
            <Avatar
              name={[client.firstName, client.lastName]
                .filter(Boolean)
                .join(" ")}
              photoUrl={client.photoUrl}
              className="h-20 w-20 rounded-full border-[#eef1f5] shadow-[0_10px_26px_rgba(15,23,42,0.10)]"
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="mt-3 line-clamp-1 text-[16px] font-black text-[#202020]">
                  {[client.firstName, client.lastName]
                    .filter(Boolean)
                    .join(" ")}
                </h3>

                <ClientStatusBadges client={client} />
              </div>

              <div className="mt-1 flex items-center gap-2">
                <p className="text-sm font-medium text-[#77716b]">
                  {client.phone || "Номер відсутній"}
                </p>

                {client.phone && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(client.phone);

                        setCopiedPhone(true);

                        setTimeout(() => {
                          setCopiedPhone(false);
                        }, 1500);
                      } catch {
                        // fallback
                      }
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[#77716b] transition hover:bg-[#fff1e8] hover:text-[#ff6200]"
                    title="Скопіювати номер"
                  >
                    {copiedPhone ? (
                      <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>

              <p className="truncate text-sm text-[#77716b]">{client.email}</p>
            </div>
          </div>
        )}

        <div className={cn(!compactHeader && "mt-4")}>
          {/* Телефон + планшет */}
          <div className="grid gap-2 lg:hidden">
            <div className="grid grid-cols-2 gap-2">
              <InfoRow
                icon={BadgeCheck}
                label="Усього записів"
                value={client.bookings}
                color="text-[#ff6200]"
              />
              <InfoRow
                icon={XCircle}
                label="Скасовано клієнтом"
                value={client.cancellations}
                color="text-[#e5484d]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <InfoRow
                icon={CalendarDays}
                label="Наступний візит"
                value={
                  client.nextBooking?.date
                    ? formatDateUA(client.nextBooking.date)
                    : "Не заплановано"
                }
                color="text-[#3b82f6]"
              />

              <InfoRow
                icon={CalendarDays}
                label="Останній візит"
                value={
                  client.lastVisit
                    ? formatDateUA(client.lastVisit)
                    : "Ще не було"
                }
                color="text-[#3b82f6]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <InfoRow
                icon={Star}
                label="Улюблена послуга"
                value={client.favoriteService || "Ще не сформовано"}
                color="text-[#ff6200]"
              />

              <InfoRow
                icon={Cake}
                label="Дата народження"
                value={
                  client.birthDate
                    ? formatDateUA(client.birthDate)
                    : "Не вказана"
                }
                color="text-[#f59e0b]"
              />
            </div>
          </div>

          {/* Комп'ютер */}
          <div className="hidden lg:grid lg:grid-cols-3 lg:gap-3">
            <InfoRow
              icon={BadgeCheck}
              label="Усього записів"
              value={client.bookings}
              color="text-[#ff6200]"
            />

            <InfoRow
              icon={CalendarDays}
              label="Наступний візит"
              value={
                client.nextBooking?.date
                  ? formatDateUA(client.nextBooking.date)
                  : "Не заплановано"
              }
              color="text-[#3b82f6]"
            />

            <InfoRow
              icon={Star}
              label="Улюблена послуга"
              value={client.favoriteService || "Ще не сформовано"}
              color="text-[#ff6200]"
            />

            <InfoRow
              icon={XCircle}
              label="Скасовано клієнтом"
              value={client.cancellations}
              color="text-[#e5484d]"
            />

            <InfoRow
              icon={CalendarDays}
              label="Останній візит"
              value={formatDateUA(client.lastBooking?.date)}
              color="text-[#3b82f6]"
            />

            <InfoRow
              icon={Cake}
              label="Дата народження"
              value={
                client.birthDate ? formatDateUA(client.birthDate) : "Не вказана"
              }
              color="text-[#f59e0b]"
            />
          </div>
        </div>
      </div>

      <div className="mt-3 flex overflow-x-auto border-b border-[#edf0f4] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.value;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onTabChange(tab.value)}
              className={cn(
                "relative flex h-8 flex-1 items-center justify-center gap-0.5 px-1 text-[10px] font-bold transition",
                "sm:h-10 sm:gap-1 sm:px-2 sm:text-[11px]",
                active ? "text-[#ff5a00]" : "text-[#77716b]",
              )}
            >
              <Icon className="h-3 w-3 mr-1 shrink-0 sm:h-3.5 sm:w-3.5 " />

              <span className="truncate">{tab.label}</span>

              {active && (
                <span className="absolute bottom-0 left-1 right-1 h-[2px] rounded-full bg-[#ff5a00] sm:left-2 sm:right-2" />
              )}
            </button>
          );
        })}
      </div>

      <div className="py-4">
        {activeTab === "history" && (
          <div className="space-y-3">
            {visibleBookings.map((booking) => {
              const statusUi = getBookingStatusUi(
                booking.status,
                booking.canceledBy,
              );

              const StatusIcon = statusUi.icon;

              return (
                <div
                  key={`${client.id}-${booking.date}-${booking.service}`}
                  className="rounded-[18px] bg-[#fbfaf8] px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="line-clamp-1 text-[14px] font-black text-[#202020]">
                        {booking.service}
                      </h4>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-medium text-[#77716b]">
                        <span>{formatDateUA(booking.date)}</span>
                        <span>•</span>
                        <span>{booking.master}</span>
                      </div>
                    </div>

                    <p className="shrink-0 text-[14px] font-black text-[#202020]">
                      {formatMoney(booking.price)}
                    </p>
                  </div>

                  <div
                    className={cn(
                      "mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold",
                      booking.status === "CONFIRMED" &&
                        "bg-emerald-50 text-emerald-700",
                      booking.status === "COMPLETED" &&
                        "bg-[#f3f4f6] text-[#6b7280]",
                      booking.status === "CANCELED" &&
                        "bg-rose-50 text-rose-700",
                      (!booking.status || booking.status === "PENDING") &&
                        "bg-amber-50 text-amber-700",
                    )}
                  >
                    <StatusIcon className="h-3 w-3" />
                    <span>{statusUi.text}</span>
                  </div>
                </div>
              );
            })}

            {bookings.length > 3 && (
              <div className="flex justify-center pt-1">
                <Button
                  onClick={() => {
                    if (hasMoreBookings) {
                      setVisibleHistoryCount((current) => current + 5);
                      return;
                    }

                    setVisibleHistoryCount(3);
                  }}
                  className="w-full sm:w-auto"
                >
                  {hasMoreBookings ? "Показати ще" : "Сховати все"}
                  {hasMoreBookings ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === "notes" && (
          <div className="space-y-3">
            {client.notes.length === 0 ? (
              <div className="x-4 py-4 text-center">
                <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#ff6200] shadow-sm">
                  <NotebookText className="h-4 w-4" />
                </div>

                <p className="text-[13px] font-black text-[#202020]">
                  Нотаток немає
                </p>

                <p className="mt-1 text-[11px] leading-4 text-[#77716b]">
                  Тут можна додати внутрішню примітку про клієнта. Клієнт її не
                  бачитиме.
                </p>
              </div>
            ) : (
              client.notes.map((note) => (
                <div
                  key={note.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[#eadbc9] bg-[#fff7f0] p-3 text-sm font-medium text-[#202020]"
                >
                  <span className="min-w-0 flex-1 break-words">
                    {note.text}
                  </span>

                  <button
                    type="button"
                    onClick={() => onDeleteNote?.(note.id)}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#e5484d] transition-all hover:bg-[#fff1f1] active:scale-[0.98]"
                    title="Видалити нотатку"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
            <Button className="w-full" onClick={onAddNote}>
              <NotebookText className="h-4 w-4" />
              Додати нотатку
            </Button>
          </div>
        )}

        {activeTab === "finance" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-[20px] bg-[#fff7f0] px-4 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#ff6200]">
                  Всього витрачено
                </p>

                <p className="mt-1 text-[28px] font-black leading-none tracking-[-0.04em] text-[#202020]">
                  {formatMoney(client.spent)}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80">
                <Wallet className="h-6 w-6 text-[#ff6200]" />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-[20px] bg-[#fbfaf8] px-4 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#10b981]">
                  Середній чек
                </p>

                <p className="mt-1 text-[22px] font-black leading-none tracking-[-0.04em] text-[#202020]">
                  {formatMoney(client.averageCheck)}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white">
                <Receipt className="h-5 w-5 text-[#10b981]" />
              </div>
            </div>
          </div>
        )}

        {activeTab === "statuses" &&
          (() => {
            const isVip = client.isVip || client.status === "vip";

            const currentStatus = isVip
              ? "vip"
              : client.isFavorite
                ? "favorite"
                : client.status;

            const item = statusInfoItems.find(
              (status) => status.value === currentStatus,
            );

            if (!item) return null;

            const meta = statusMeta[item.value] || statusMeta.new;
            const Icon = meta.icon;

            return (
              <div className={cn("rounded-[18px] px-4 py-3", meta.className)}>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80">
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-black">{item.title}</p>

                    <p className="mt-0.5 text-[12px] leading-4 opacity-80">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}
      </div>
    </aside>
  );
}
function InfoRow({ icon: Icon, label, value, color }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-[16px] bg-[#fbfaf8] px-2.5 py-2">
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm",
          color,
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold leading-tight text-[#8a837c]">
          {label}
        </p>

        <p
          className={cn(
            "font-black text-[#202020]",
            label === "Улюблена послуга"
              ? "line-clamp-3 text-[11px] leading-4 sm:text-[12px]"
              : "truncate text-[13px]",
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
function Insight({ icon: Icon, text, danger = false }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-3",
        danger
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-[#eadbc9] bg-white text-[#202020]",
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="text-sm font-semibold">{text}</p>
    </div>
  );
}
