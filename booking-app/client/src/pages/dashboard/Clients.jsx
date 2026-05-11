// Clients.jsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/http";
import { useStudio } from "../../context/studio/useStudio";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  XCircle,
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
  Copy,
  ContactRound,
} from "lucide-react";

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
    "bg-[var(--color-white)] border border-[var(--border-soft)] shadow-[var(--shadow-card)]";

  if (status === "CONFIRMED") {
    return {
      text: "Підтверджено",
      icon: Check,
      badge: `${base} text-[var(--color-confirmed-dark)]`,
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
      badge: `${base} text-[var(--color-canceled-dark)]`,
    };
  }

  if (status === "COMPLETED") {
    return {
      text: "Завершено",
      icon: CheckCheck,
      badge: `${base} text-[var(--color-archived-dark)]`,
    };
  }

  return {
    text: "Очікує підтвердження",
    icon: Clock,
    badge: `${base} text-[var(--color-pending-dark)]`,
  };
}

function Avatar({ name, photoUrl, className = "" }) {
  const initials = initialsFromName(name);

  return (
    <div
      className={cn(
        "flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-[var(--color-cream)] bg-gradient-to-br from-[var(--color-cream)] to-[var(--color-sand)] shadow-sm",
        className,
      )}
    >
      {photoUrl ? (
        <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className="text-sm font-black text-[var(--color-forest)]">
          {initials}
        </span>
      )}
    </div>
  );
}

function Button({ variant = "secondary", className = "", children, ...props }) {
  const variants = {
    primary:
      "bg-gradient-to-r from-[rgba(var(--color-nude-green-500),var(--color-nude-green-opacity))] to-[rgba(var(--color-nude-green-600),var(--color-nude-green-opacity))] text-white hover:from-[rgba(var(--color-nude-green-500-hover),1)] hover:to-[rgba(var(--color-nude-green-600-hover),1)]",
    secondary:
      "border border-[var(--border-soft)] bg-white text-[var(--color-ink)] shadow-sm hover:bg-[var(--color-cream)]",
    ghost: "text-[var(--color-ink)] hover:bg-[var(--color-cream)]",
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

function SectionCard({ title, subtitle, actions, children, className = "" }) {
  return (
    <section
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-[var(--color-cream)] bg-white shadow-[0_4px_24px_-4px_rgba(27,27,27,0.10)] transition-all duration-300 hover:shadow-[0_8px_32px_-4px_rgba(27,27,27,0.14)]",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[var(--color-forest)] via-[var(--color-forest)] to-[var(--color-ink)] opacity-70" />

      <div className="p-5">{children}</div>
    </section>
  );
}

function Modal({ open, onClose, children, footer, size = "md" }) {
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
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--color-bg)]/45 p-4 backdrop-blur-sm sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-3xl bg-white shadow-2xl",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          sizeClasses[size],
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-h-[calc(100vh-180px)] overflow-y-auto px-6 py-6">
          {children}
        </div>

        {footer && (
          <div className="border-t border-[var(--color-cream)] px-6 py-4">
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
      text: "text-emerald-600",
      bg: "from-emerald-50 via-white to-emerald-50/40",
      iconBg: "from-emerald-100 to-white",
    },
    flat: {
      text: "text-sky-600",
      bg: "from-sky-50 via-white to-sky-50/40",
      iconBg: "from-sky-100 to-white",
    },
    down: {
      text: "text-rose-600",
      bg: "from-rose-50 via-white to-rose-50/40",
      iconBg: "from-rose-100 to-white",
    },
  };

  const style = trendStyles[trend];

  return (
    <div
      className={cn(
        "group relative min-h-[112px] overflow-hidden rounded-[26px] border border-white/80 bg-gradient-to-br p-3.5 shadow-[0_10px_30px_rgba(15,23,42,0.07)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(15,23,42,0.11)] sm:min-h-[128px] sm:p-4 lg:min-h-[138px] lg:rounded-[30px] lg:p-5",
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
          <p className="truncate text-[9px] font-black uppercase tracking-[0.16em] text-slate-500 sm:text-[10px] lg:text-[11px]">
            {label}
          </p>

          <p className="mt-2 truncate text-[20px] font-black leading-none tracking-tight text-slate-900 sm:text-2xl lg:text-[28px]">
            {value}
          </p>

          {hint && (
            <p className="mt-2 truncate text-[11px] font-semibold text-slate-500 sm:text-xs lg:text-sm">
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
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },

  new: {
    label: "Новий",
    icon: UserPlus,
    className: "border-sky-200 bg-sky-50 text-sky-700",
  },

  attention: {
    label: "Потрібна увага",
    icon: AlertTriangle,
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },

  risk: {
    label: "Ризик втрати",
    icon: TrendingDown,
    className: "border-rose-200 bg-rose-50 text-rose-700",
  },

  vip: {
    label: "VIP",
    icon: Crown,
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },

  favorite: {
    label: "Особливий клієнт",
    icon: UserStar,
    className: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
  },
};

function StatusBadge({ status }) {
  const meta = statusMeta[status] || statusMeta.new;
  const Icon = meta.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold",
        meta.className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}

function SalonFavoriteBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1 text-xs font-bold text-fuchsia-700">
      <UserStar className="h-3.5 w-3.5 text-fuchsia-600" />
      Особливий клієнт
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
      {client.isFavorite ? (
        <SalonFavoriteBadge />
      ) : (
        <StatusBadge status={mainStatus} />
      )}

      {isVip && <StatusBadge status="vip" />}
    </div>
  );
}

const filterItems = [
  { value: "all", label: "Усі" },
  { value: "new", label: "Нові" },
  { value: "loyal", label: "Постійні" },
  { value: "attention", label: "Потрібна увага" },
  { value: "risk", label: "Давно без записів" },
  { value: "vip", label: "VIP" },
];

const sortItems = [
  { value: "lastVisit", label: "За останнім візитом" },
  { value: "bookings", label: "За кількістю бронювань" },
  { value: "spent", label: "За витратами" },
  { value: "newest", label: "Нові зверху" },
];

const emptyFilterInfo = {
  all: {
    icon: Users,
    title: "Поки що немає клієнтів",
    description: (
      <span className="flex flex-col gap-1">
        <span>
          Клієнти зʼявляться тут автоматично після перших бронювань.
        </span>
      </span>
    ),
  },

  new: {
    icon: UserPlus,
    title: "Поки що немає нових клієнтів",
    description: (
      <span className="flex flex-col gap-1">
        <span>
          Тут зʼявляться клієнти, які мають тільки один нескасований запис.
        </span>

        <span>
          Або ще не мають сформованої історії відвідувань.
        </span>
      </span>
    ),
  },

  loyal: {
    icon: Repeat,
    title: "Поки що немає постійних клієнтів",
    description: (
      <span className="flex flex-col gap-1">
        <span>
          Тут зʼявляться клієнти, які мають 2 або більше нескасованих записів.
        </span>

        <span>
          Останній візит був протягом останніх 30 днів.
        </span>
      </span>
    ),
  },

  attention: {
    icon: AlertTriangle,
    title: "Поки що немає клієнтів, яким потрібна увага",
    description: (
      <span className="flex flex-col gap-1">
        <span>
          Тут зʼявляться клієнти, чий останній запис був більше 30 днів тому.
        </span>

        <span>Але не більше 60 днів.</span>
      </span>
    ),
  },

  risk: {
    icon: TrendingDown,
    title: "Поки що немає клієнтів у ризику втрати",
    description: (
      <span className="flex flex-col gap-1">
        <span>
          Тут зʼявляться клієнти, які не були у студії більше 60 днів.
        </span>

        <span>
          Їм варто нагадати про себе або запропонувати повернутись.
        </span>
      </span>
    ),
  },

  vip: {
    icon: Crown,
    title: "Поки що немає VIP клієнтів",
    description: (
      <span className="flex flex-col gap-1">
        <span>
          Тут зʼявляться лояльні клієнти, яким платформа автоматично надала
          VIP-статус.
        </span>
      </span>
    ),
  },
};

export default function Clients() {
  const { studio } = useStudio();
  const studioId = studio?.id ?? null;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("lastVisit");
  const [sortOpen, setSortOpen] = useState(false);
  const [expandedClientId, setExpandedClientId] = useState(null);
  const [clientTabs, setClientTabs] = useState({});
  const [visibleCount, setVisibleCount] = useState(10);
  const [noteClient, setNoteClient] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [allClients, setAllClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedPhone, setCopiedPhone] = useState(false);
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
        const haystack =
          `${client.name || ""} ${client.phone || ""} ${client.email || ""}`.toLowerCase();

        return matchesFilter && (!q || haystack.includes(q));
      })
      .sort((a, b) => {
        if (sort === "bookings") return (b.bookings || 0) - (a.bookings || 0);
        if (sort === "spent") return (b.spent || 0) - (a.spent || 0);
        if (sort === "newest")
          return dateScore(b.registeredAt) - dateScore(a.registeredAt);

        return dateScore(b.lastVisit) - dateScore(a.lastVisit);
      });
  }, [allClients, filter, query, sort]);

  const visibleClients = clients.slice(0, visibleCount);
  const hasMoreClients = visibleCount < clients.length;

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

  return (
    <div className="h-full">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--color-cream)] bg-white p-5 shadow-[0_4px_24px_-4px_rgba(27,27,27,0.10)] sm:p-6">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[var(--color-forest)] via-[var(--color-forest)] to-[var(--color-ink)] opacity-70" />

          <div className="relative">
            <div>
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-700 shadow-[0_4px_14px_rgba(15,23,42,0.05)]">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white">
                  <ContactRound className="h-3 w-3" />
                </div>

                <span>База клієнтів</span>

                <div className="h-1 w-1 rounded-full bg-slate-400" />
              </div>

              <h1 className="text-3xl font-black tracking-tight text-[var(--color-ink)] sm:text-4xl">
                Клієнти
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-[var(--color-caramel)] sm:text-base">
                Вся інформація про клієнтів, їхні записи, витрати, нотатки та
                ризик втрати в одному місці.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-2">
          <StatCard
            tone="green"
            icon={Users}
            label="Всього"
            value={allClients.length}
            hint="активних клієнтів"
            chartData={[1, 2, 2, 3, 3, 4, 4]}
          />

          <StatCard
            tone="blue"
            icon={UserPlus}
            label="Нових"
            value={`+${newClientsCount}`}
            hint="за місяць"
            chartData={
              newClientsCount <= 0
                ? [0, 0, 0, 0, 0, 0, 0]
                : [0, 1, 1, 2, 2, 3, newClientsCount]
            }
          />

          <StatCard
            tone="violet"
            icon={Repeat}
            label="Постійні"
            value={`${loyalPercent}%`}
            hint="повертаються"
            chartData={[40, 52, 58, 70, 82, 91, loyalPercent]}
          />

          <StatCard
            tone="amber"
            icon={Wallet}
            label="Середній чек"
            value={formatMoney(averageCheck)}
            hint="по всіх записах"
            chartData={[578, 560, 535, 510, 478]}
          />

          <StatCard
            tone="rose"
            icon={BadgeCheck}
            label="Бронювань"
            value={totalBookings}
            hint="за весь час"
            chartData={[1, 3, 5, 8, 10, 13, totalBookings]}
          />

          <StatCard
            tone="blue"
            icon={CalendarDays}
            label="Найактивніший день"
            value="Пʼятниця"
            hint="найбільше записів"
            hideChart
          />
        </div>

        <SectionCard>
          <div className="sticky top-0 z-10 -mx-5 -mt-5 border-b border-[var(--color-cream)] bg-white/95 px-5 py-4 backdrop-blur md:static md:m-0 md:border-0 md:bg-transparent md:p-0">
            <div className="grid items-end gap-3 md:grid-cols-[minmax(0,1fr)_minmax(220px,280px)]">
              <div className="relative w-full">
                <label className="mb-2 ml-2 block text-xs font-bold text-[var(--color-ink)]">
                  Сортування
                </label>
                <button
                  type="button"
                  onClick={() => setSortOpen((current) => !current)}
                  className={cn(
                    "flex h-12 w-full items-center justify-between gap-3 rounded-2xl border bg-white px-4 text-left text-sm font-bold text-[var(--color-ink)] shadow-sm outline-none transition-all",
                    sortOpen
                      ? "border-[var(--color-caramel)] ring-4 ring-[var(--color-forest)]/10"
                      : "border-[var(--color-cream)] hover:bg-[var(--color-cream)]",
                  )}
                >
                  <span className="truncate">
                    {sortItems.find((item) => item.value === sort)?.label}
                  </span>
                  {sortOpen ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-[var(--color-ink)]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-[var(--color-caramel)]" />
                  )}
                </button>

                {sortOpen && (
                  <div className="absolute right-0 z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-[var(--color-cream)] bg-white py-2 shadow-[0_18px_42px_rgba(27,27,27,0.16)]">
                    {sortItems.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => {
                          setSort(item.value);
                          setSortOpen(false);
                          setVisibleCount(10);
                          setExpandedClientId(null);
                          setClientTabs({});
                        }}
                        className={cn(
                          "block w-full px-4 py-3 text-left text-sm font-medium transition-colors",
                          sort === item.value
                            ? "bg-[var(--color-cream)] text-[var(--color-ink)]"
                            : "text-[var(--color-ink)] hover:bg-[var(--color-cream)]/70",
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <label className="mb-2 block text-xs font-bold text-transparent">
                  Пошук
                </label>
                <Search className="pointer-events-none absolute left-4 top-[calc(50%+0.625rem)] h-4 w-4 -translate-y-1/2 text-[var(--color-caramel)]" />
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setVisibleCount(10);
                    setExpandedClientId(null);
                    setClientTabs({});
                  }}
                  placeholder="Пошук за іменем, телефоном або email"
                  className="h-12 w-full rounded-2xl border border-[var(--color-cream)] bg-white pl-11 pr-4 text-sm font-medium text-[var(--color-ink)] outline-none transition-all placeholder:text-[var(--color-caramel)] hover:bg-[var(--color-cream)] focus:border-[var(--color-forest)] focus:ring-4 focus:ring-[var(--color-forest)]/10"
                />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {filterItems.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setFilter(item.value);
                    setVisibleCount(10);
                    setExpandedClientId(null);
                    setClientTabs({});
                  }}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold",
                    filter === item.value
                      ? "inline-flex h-9 items-center justify-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-[var(--color-primary-buttom)] px-2 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-[var(--color-primary-buttom)] active:scale-[0.98]"
                      : "inline-flex h-9 items-center justify-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-white px-2 text-sm font-bold text-[var(--color-ink)] shadow-sm transition-all duration-200 hover:bg-[var(--color-cream)] active:scale-[0.98]",
                  )}
                >
                  <span>{item.label}</span>

                  {typeof item.count === "number" && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold",
                        filter === item.value
                          ? "bg-white/20 text-white"
                          : "bg-[var(--color-cream)] text-[var(--color-caramel)]",
                      )}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          {loading && (
            <div className="mt-5 rounded-2xl border border-[var(--color-cream)] bg-white p-6 text-center text-sm font-bold text-[var(--color-caramel)]">
              Завантажуємо клієнтів...
            </div>
          )}

          {error && !loading && (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm font-bold text-rose-700">
              {error}
            </div>
          )}
          {!loading && !error && clients.length === 0 ? (
            <div className="mt-5 rounded-2xl border-2 border-dashed border-[var(--color-caramel)]/40 bg-[var(--color-cream)] p-6 text-center sm:p-8">
              <div className="mb-3 flex items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/70">
                 <EmptyIcon className="h-6 w-6 text-[var(--color-caramel)]" />
                </div>
              </div>

              <p className="text-sm font-medium text-[var(--color-caramel)]">
                {emptyInfo.title}
              </p>

              <p className="mt-1 text-xs text-[var(--color-caramel)]/80">
                {emptyInfo.description}
              </p>
            </div>
          ) : !loading && !error ? (
            <div className="mt-5 space-y-3">
              {visibleClients.map((client) => (
                <ClientAccordion
                  key={client.id}
                  client={{
                    ...client,
                    notes: client.notes || [],
                  }}
                  isExpanded={expandedClientId === client.id}
                  onToggle={() =>
                    setExpandedClientId((current) =>
                      current === client.id ? null : client.id,
                    )
                  }
                  activeTab={clientTabs[client.id] || "history"}
                  onTabChange={(tab) =>
                    setClientTabs((current) => ({
                      ...current,
                      [client.id]: tab,
                    }))
                  }
                  onAddNote={() => {
                    setNoteClient(client);
                    setNoteDraft("");
                  }}
                  onDeleteNote={(noteId) => handleDeleteNote(client.id, noteId)}
                  onToggleVip={() => handleToggleVip(client)}
                  onCopyPhone={handleCopyPhone}
                  copiedPhone={copiedPhone}
                />
              ))}

              {hasMoreClients && (
                <div className="flex justify-center pt-3">
                  <Button
                    onClick={() => setVisibleCount((current) => current + 10)}
                    className="w-full sm:w-auto"
                  >
                    Показати ще
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </SectionCard>
      </div>

      <Modal
        open={noteClient != null}
        onClose={() => {
          setNoteClient(null);
          setNoteDraft("");
        }}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setNoteClient(null);
                setNoteDraft("");
              }}
              className="w-full sm:w-auto"
            >
              Назад
            </Button>

            <button
              type="button"
              disabled={!noteDraft.trim()}
              onClick={handleAddNote}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary-buttom)] px-4 py-2.5 text-sm font-bold text-white hover:bg-[var(--color-primary-buttom)]/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
            >
              <Check className="h-4 w-4" />
              Додати
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[var(--color-forest)]/70 blur-2xl" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-forest)] text-white">
                <NotebookText className="h-7 w-7" />
              </div>
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-xl font-black tracking-tight text-[var(--color-ink)]">
              Додати нотатку
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--color-caramel)]">
              Нотатка буде додана до профілю клієнта {noteClient?.name || ""}.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--color-cream)] bg-[var(--color-cream)] p-3.5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--color-forest)] shadow-sm">
                <AlertTriangle className="h-4.5 w-4.5" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-bold text-[var(--color-ink)]">
                  Внутрішня інформація
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--color-ink)]">
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
            className="w-full resize-none rounded-2xl border border-[var(--color-cream)] bg-white px-4 py-3 text-sm font-medium text-[var(--color-ink)] outline-none transition-all placeholder:text-[var(--color-caramel)] hover:bg-[var(--color-cream)] focus:border-[var(--color-forest)] focus:ring-4 focus:ring-[var(--color-forest)]/10"
          />
          <div className="text-right text-[11px] font-medium text-[var(--color-caramel)]">
            {noteDraft.length}/100
          </div>
        </div>
      </Modal>
    </div>
  );
}

function MiniMetric({ label, value, icon: Icon, danger = false }) {
  return (
    <div className="min-w-0 rounded-2xl border border-[var(--color-cream)] bg-white px-2.5 py-3">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div
            className={cn(
              "ml-0.5 flex h-10 w-10 shrink-0 items-center justify-center",
              danger
                ? "text-[rgb(201,122,114)]"
                : "text-[var(--color-caramel)]",
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate !text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--color-caramel)] sm:text-[11px]">
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

function ClientAccordion({
  client,
  isExpanded,
  onToggle,
  activeTab,
  onTabChange,
  onAddNote,
  onDeleteNote,
  onToggleVip,
  onCopyPhone,
  copiedPhone,
}) {
  return (
    <article className="overflow-hidden rounded-3xl border border-[var(--color-cream)] bg-white shadow-[0_4px_24px_-4px_rgba(27,27,27,0.08)] transition-all hover:shadow-[0_8px_28px_-4px_rgba(27,27,27,0.12)]">
      <div className="flex w-full items-start justify-between gap-3 p-4 text-left sm:p-5">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <Avatar name={client.name} className="h-16 w-16 rounded-[22px]" />

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
              <div className="sm:hidden">
                <ClientStatusBadges client={client} />
              </div>

              <h3 className="truncate text-lg font-black text-[var(--color-ink)]">
                {client.name}
              </h3>

              <div className="hidden sm:block">
                <ClientStatusBadges client={client} />
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCopyPhone?.(client.phone);
              }}
              className="mt-1 flex max-w-full items-center gap-1.5 truncate text-sm font-medium text-[var(--color-caramel)] transition hover:text-[var(--color-ink)] active:scale-[0.98]"
              title="Скопіювати телефон"
            >
              <span className="truncate">{client.phone}</span>

              {copiedPhone ? (
                <CheckCheck className="ml-2 h-3.5 w-3.5 shrink-0" />
              ) : (
                <Copy className="ml-2 h-3.5 w-3.5 shrink-0" />
              )}
            </button>
            <p className="truncate text-sm text-[var(--color-caramel)]">
              {client.email}
            </p>
          </div>
        </button>

        <div className="ml-2 flex shrink-0 flex-col items-end gap-7">
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center gap-2 pt-1 text-xs font-bold text-[var(--color-caramel)]"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}

            <span className="hidden sm:inline">
              {isExpanded ? "Сховати" : "Розгорнути"}
            </span>
          </button>
          {isExpanded && (
            <div className="hidden shrink-0 items-center sm:flex">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVip?.();
                }}
                className={cn(
                  client.isFavorite &&
                    " bg-[var(--color-cream)] text-[var(--color-ink)] hover:bg-[var(--color-sand)]/40",
                )}
              >
                <UserStar className="h-4 w-4" />
                {client.isFavorite ? (
                  <span className="leading-tight text-center">
                    Прибрати статус
                    <br />
                    Особливого клієнта
                  </span>
                ) : (
                  <span className="leading-tight text-center">
                    Додати статус
                    <br />
                    Особливого клієнта
                  </span>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div
        className={cn(
          "grid transition-all duration-300 ease-out",
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <ClientDetails
            client={client}
            activeTab={activeTab}
            onTabChange={onTabChange}
            onAddNote={onAddNote}
            onDeleteNote={onDeleteNote}
            onToggleVip={onToggleVip}
            compactHeader
          />
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

  if (!client) return null;

  const bookings = getClientBookings(client);
  const visibleBookings = bookings.slice(0, visibleHistoryCount);
  const hasMoreBookings = visibleHistoryCount < bookings.length;
  const tabs = [
    { value: "history", label: "Історія", icon: CalendarDays },
    { value: "notes", label: "Нотатки", icon: NotebookText },
    { value: "finance", label: "Фінанси", icon: Wallet },
    { value: "statuses", label: "Статуси", icon: BadgeCheck },
  ];

  return (
    <aside
      className={cn(
        "h-fit overflow-hidden bg-white",
        compactHeader
          ? "border-t border-[var(--color-cream)]"
          : "rounded-3xl border border-[var(--color-cream)] shadow-[0_4px_24px_-4px_rgba(27,27,27,0.10)]",
      )}
    >
      <div className="border-b border-[var(--color-cream)] p-5">
        {!compactHeader && (
          <div className="flex items-start gap-3">
            <Avatar name={client.name} className="h-16 w-16 rounded-[22px]" />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-lg font-black text-[var(--color-ink)]">
                  {client.name}
                </h3>

                <ClientStatusBadges client={client} />
              </div>

              <p className="mt-1 text-sm font-medium text-[var(--color-caramel)]">
                {client.phone}
              </p>

              <p className="truncate text-sm text-[var(--color-caramel)]">
                {client.email}
              </p>
            </div>
          </div>
        )}

        <div className="mb-4 flex justify-end sm:hidden">
          <Button
            onClick={onToggleVip}
            className={cn(
              "w-full",
              client.isFavorite &&
                "bg-[var(--color-cream)] text-[var(--color-ink)] hover:bg-[var(--color-sand)]/40",
            )}
          >
            <UserStar className="h-4 w-4" />
            {client.isFavorite
              ? "Прибрати статус Особливого клієнта"
              : "Додати статус Особливого клієнта"}
          </Button>
        </div>

        <div
          className={cn(
            "grid grid-cols-2 gap-2 md:grid-cols-3",
            !compactHeader && "mt-4",
          )}
        >
          <MiniMetric
            icon={BadgeCheck}
            label="Усього записів"
            value={client.bookings}
          />
          <MiniMetric
            icon={XCircle}
            danger
            label="Скасовано клієнтом"
            value={client.cancellations}
          />
          <MiniMetric
            icon={CalendarDays}
            label="Останній запис"
            value={formatDateUA(client.lastBooking.date)}
          />
          <MiniMetric
            icon={User}
            label="Майстер"
            value={client.lastBooking.master}
          />

          <MiniMetric
            icon={Repeat}
            label="Візит"
            value={
              !client.lastVisit || new Date(client.lastVisit) > new Date()
                ? "Ще не було візитів"
                : daysAgo(client.lastVisit) === 0
                  ? "Сьогодні"
                  : `${daysAgo(client.lastVisit)} дн. тому`
            }
          />

          <MiniMetric
            icon={Cake}
            label="Дата народження"
            value={
              client.birthDate ? formatDateUA(client.birthDate) : "Не вказана"
            }
          />
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto border-b border-[var(--color-cream)] px-3 py-3 md:justify-center md:gap-2 md:px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onTabChange(tab.value)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold transition-all md:gap-1.5 md:px-3 md:py-2 md:text-xs",
                activeTab === tab.value
                  ? "bg-[var(--color-primary-buttom)] text-white hover:bg-[var(--color-primary-buttom)]/90"
                  : "text-[var(--color-caramel)] hover:bg-[var(--color-cream)]",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="p-5">
        {activeTab === "history" && (
          <div className="space-y-3">
            {visibleBookings.map((booking) => (
              <div
                key={`${client.id}-${booking.date}-${booking.service}`}
                className="rounded-2xl border border-[var(--color-cream)] p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[var(--color-ink)]">
                      {booking.service}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-caramel)]">
                      {formatDateUA(booking.date)} • {booking.master}
                    </p>
                  </div>
                  <p className="shrink-0 font-black text-[var(--color-ink)]">
                    {formatMoney(booking.price)}
                  </p>
                </div>
                {(() => {
                  const statusUi = getBookingStatusUi(
                    booking.status,
                    booking.canceledBy,
                  );
                  const StatusIcon = statusUi.icon;

                  return (
                    <div
                      className={cn(
                        "mt-2 inline-flex items-center justify-center gap-2 rounded-2xl px-2.5 py-1 text-xs font-semibold",
                        statusUi.badge,
                      )}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                      {statusUi.text}
                    </div>
                  );
                })()}
              </div>
            ))}

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
              <div className="rounded-2xl border-2 border-dashed border-[var(--color-caramel)]/40 bg-[var(--color-cream)] p-6 text-center sm:p-8">
                <div className="mb-3 flex items-center justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/70">
                    <NotebookText className="h-7 w-7 text-[var(--color-caramel)]" />
                  </div>
                </div>

                <p className="text-sm font-medium text-[var(--color-caramel)]">
                  Нотаток ще немає
                </p>

                <p className="mt-1 text-xs text-[var(--color-caramel)]/80">
                  Тут можна додати внутрішню примітку про клієнта. Клієнт її не
                  бачитиме.
                </p>
              </div>
            ) : (
              client.notes.map((note) => (
                <div
                  key={note.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-cream)] bg-[var(--color-cream)]/45 p-3 text-sm font-medium text-[var(--color-ink)]"
                >
                  <span className="min-w-0 flex-1 break-words">
                    {note.text}
                  </span>

                  <button
                    type="button"
                    onClick={() => onDeleteNote?.(note.id)}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--color-danger)] transition-all hover:bg-[rgba(201,122,114,0.10)] active:scale-[0.98]"
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
            <MiniMetric
              label="Всього витрачено"
              value={formatMoney(client.spent)}
            />
            <MiniMetric
              label="Середній чек"
              value={formatMoney(client.averageCheck)}
            />

            <MiniMetric
              label="Найдорожча послуга"
              value={client.favoriteService}
            />
          </div>
        )}

        {activeTab === "statuses" && (
          <div className="space-y-3">
            {statusInfoItems.map((item) => {
              const isVip = client.isVip || client.status === "vip";

              const isActive =
                item.value === "vip"
                  ? isVip
                  : item.value === "favorite"
                    ? client.isFavorite
                    : client.status === item.value;

              const meta = statusMeta[item.value] || statusMeta.new;
              const Icon = meta.icon;

              return (
                <div
                  key={item.value}
                  className={cn(
                    "rounded-2xl border p-3 transition-all",
                    isActive
                      ? `${meta.className} shadow-sm ring-2 ring-current/10`
                      : "border-[var(--color-cream)] bg-white text-[var(--color-ink)]",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
                        isActive
                          ? "border-current/20 bg-white/70"
                          : "border-[var(--color-cream)] bg-[var(--color-cream)] text-[var(--color-caramel)]",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-black">{item.title}</p>

                        {isActive && (
                          <span className="rounded-full border  bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em]">
                            Поточний
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs font-medium leading-5">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}

function Insight({ icon: Icon, text, danger = false }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-3",
        danger
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-[var(--color-cream)] bg-white text-[var(--color-ink)]",
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="text-sm font-semibold">{text}</p>
    </div>
  );
}
