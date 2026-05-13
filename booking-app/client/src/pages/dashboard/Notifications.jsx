// Notifications.jsx
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { socket } from "../../lib/socket";
import { Bell, Sparkles, Check, CalendarDays, ChevronUp, ChevronDown } from "lucide-react";
import { api } from "../../api/http";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function formatDateTimeUA(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");

  return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
}

async function fetchNotifications(studioId) {
  if (!studioId) return [];

  const token = localStorage.getItem("token");
  const data = await api(`/owner/studio/${studioId}/notifications`, {
    token,
  });

  return Array.isArray(data?.notifications) ? data.notifications : [];
}

function SectionCard({ title, subtitle, actions, children, className = "" }) {
  return (
    <section
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-[var(--color-cream)] bg-white shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-soft-hover)] transition-all duration-300",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[var(--color-forest)] via-[var(--color-caramel)] to-[var(--color-ink)] opacity-70" />

      <div className="border-b border-[var(--color-cream)] px-5 py-4">
<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
  
  {/* ЛІВИЙ БЛОК */}
  <div className="min-w-0">
    {/* 1 РЯДОК (тільки заголовок на мобілці) */}
    <h2 className="text-[22px] sm:text-[26px] font-bold tracking-tight text-[var(--color-ink)]">
      {title}
    </h2>

    {/* 2 РЯДОК (subtitle + кнопка на мобілці) */}
    <div className="mt-1 flex items-center justify-between sm:justify-start sm:gap-3">
      {subtitle && (
        <p className="text-sm text-[var(--color-caramel)]">
          {subtitle}
        </p>
      )}

{actions && (
  <div className="ml-auto sm:hidden">
    {actions}
  </div>
)}
    </div>
  </div>

  {/* ДЕСКТОП (кнопка справа як було) */}
  {actions && (
    <div className="hidden sm:flex shrink-0 items-center">
      {actions}
    </div>
  )}
</div>
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}

function SkeletonBlock({ className = "" }) {
  return (
    <div className={cn("animate-pulse rounded-2xl bg-[var(--color-cream)]", className)} />
  );
}

function NotificationCardSkeleton() {
  return (
    <div className="rounded-[28px] border border-[var(--color-cream)] bg-white p-4 shadow-[0_10px_30px_rgba(27,27,27,0.06)]">
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <SkeletonBlock className="h-5 w-44 max-w-full" />
            <SkeletonBlock className="h-6 w-14 rounded-full" />
          </div>

          <SkeletonBlock className="h-9 w-28 rounded-xl" />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <SkeletonBlock className="h-6 w-20 rounded-xl" />
          <SkeletonBlock className="h-6 w-24 rounded-xl" />
          <SkeletonBlock className="h-6 w-16 rounded-xl" />
          <SkeletonBlock className="h-6 w-24 rounded-xl" />
          <SkeletonBlock className="h-6 w-16 rounded-xl" />
          <SkeletonBlock className="h-6 w-24 rounded-xl" />
        </div>

        <SkeletonBlock className="mt-4 h-4 w-40" />
      </div>
    </div>
  );
}

function NotificationCard({ item, onRead }) {
    const isReschedule = item.oldDate || item.newDate;
  const [expanded, setExpanded] = useState(!item.isRead);

  return (
<div
  onClick={() => {
    if (isReschedule) {
      setExpanded((prev) => !prev);
    }
  }}
  className={cn(
    "group relative overflow-hidden rounded-[30px] border bg-white p-4 transition-all duration-200 sm:p-5",
    isReschedule && "cursor-pointer",
        item.isRead
          ? "border-[var(--color-cream)] shadow-sm"
          : "border-[var(--color-sand)] shadow-[0_16px_44px_rgba(27,27,27,0.09)]",
      )}
    >
      {!item.isRead && (
        <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[rgba(var(--color-nude-green-500),var(--color-nude-green-opacity))] to-[var(--color-caramel)]" />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-cream)] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-[var(--color-primary-buttom)]">
            <Bell className="h-3.5 w-3.5" />
            {isReschedule ? "Перенесення" : item.title || "Повідомлення"}
          </div>

          <h3 className="mt-3 text-lg font-black leading-tight text-[var(--color-ink)]">
            {isReschedule
              ? `${item.clientName || "Клієнт"} змінив дату запису`
              : item.message || "Нове повідомлення"}
          </h3>

          <p className="mt-1 text-xs font-medium text-[var(--color-caramel)]">
            {formatDateTimeUA(item.createdAt)}
          </p>
        </div>

        {item.isRead ? (
          <span className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold text-[var(--border-hover-primary)]">
            Прочитано
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onRead(item.id)}
            className={cn(
              "shrink-0 rounded-2xl px-3 py-2 text-xs font-bold text-white active:scale-[0.98]",
              "bg-gradient-to-r from-[rgba(var(--color-nude-green-500),var(--color-nude-green-opacity))] to-[rgba(var(--color-nude-green-600),var(--color-nude-green-opacity))]",
            )}
          >
            Прочитати
          </button>
        )}
      </div>

{isReschedule && (
  <>
    <div className="mt-4 flex justify-center">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
className={cn(
  "pointer-events-none inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold transition-all duration-200 active:scale-[0.98]",
  expanded
    ? "text-[var(--color-sidebar-accent-hover)]"
    : `
      text-[var(--border-hover-primary)]
      group-hover:text-slate-700
    `,
)} >
        {expanded ? (
          <>
            <ChevronUp className="h-4 w-4" />
            Сховати
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4" />
            Розгорнути
          </>
        )}
      </button>
    </div>

    <div
      className={cn(
        "grid transition-all duration-300 ease-out",
        expanded ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      )}
    >
      <div className="overflow-hidden">
        <div className="rounded-[26px] bg-[var(--color-cream)]/55 p-4">
          <div className="mb-4 space-y-3">
            <div className="flex items-center gap-3 rounded-[22px] bg-white p-3 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-cream)] text-[var(--color-primary-buttom)]">
                <Bell className="h-4.5 w-4.5" />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--color-caramel)]">
                  Клієнт
                </p>

                <p className="line-clamp-2 text-sm font-black leading-5 text-[var(--color-ink)]">
                  {item.clientName || "—"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-[22px] bg-white p-3 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-cream)] text-[var(--color-primary-buttom)]">
                <CalendarDays className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--color-caramel)]">
                  Послуга
                </p>

                <p className="line-clamp-2 text-sm font-black leading-5 text-[var(--color-ink)]">
                  {item.serviceName || "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="relative pl-5">
            <div className="absolute bottom-4 left-[7px] top-4 w-px bg-[var(--color-mist)]" />

            <div className="relative">
              <span className="absolute -left-5 top-1 h-3.5 w-3.5 rounded-full bg-[var(--color-canceled)] ring-4 ring-white" />
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--color-canceled-dark)]">
                Було
              </p>
              <p className="mt-1 rounded-2xl bg-white px-3 py-2 text-sm font-bold text-[var(--color-ink)] shadow-sm">
                {item.oldDate || "—"}
              </p>
            </div>

            <div className="relative mt-4">
              <span className="absolute -left-5 top-1 h-3.5 w-3.5 rounded-full bg-[var(--color-confirmed)] ring-4 ring-white" />
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--color-confirmed-dark)]">
                Стало
              </p>
              <p className="mt-1 rounded-2xl bg-white px-3 py-2 text-sm font-bold text-[var(--color-ink)] shadow-sm">
                {item.newDate || "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </>
)}
    </div>
  );
}

export default function Notifications() {
  const queryClient = useQueryClient();
  const studioId = localStorage.getItem("studioId");

  const [visibleCount, setVisibleCount] = useState(5);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [socketState, setSocketState] = useState(
    socket.connected ? "ok" : "offline",
  );

  const notificationsQuery = useQuery({
    queryKey: ["notifications", studioId],
    queryFn: () => fetchNotifications(studioId),
    enabled: Boolean(studioId),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const notifications = notificationsQuery.data || [];
  const isInitialLoading = notificationsQuery.isLoading;

const liveStatusUi = useMemo(() => {
  const base =
    "inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-white px-3 py-1.5 text-[13px] font-semibold shadow-[var(--shadow-card)]";

  if (!isOnline || socketState === "offline") {
    return {
      text: "Немає інтернету",
      dotClass:
        "h-2 w-2 rounded-full bg-[var(--color-canceled)] shadow-[0_0_0_3px_var(--color-canceled-light)] animate-[pulse-soft_1.8s_ease-in-out_infinite]",
      wrapClass: `${base} text-[var(--color-canceled-dark)]`,
    };
  }

  if (socketState === "pending") {
    return {
      text: "Оновлення...",
      dotClass:
        "h-2 w-2 rounded-full bg-[var(--color-pending)] shadow-[0_0_0_3px_var(--color-pending-light)] animate-[pulse-soft_1.8s_ease-in-out_infinite]",
      wrapClass: `${base} text-[var(--color-pending-dark)]`,
    };
  }

  return {
    text: "Оновлюється автоматично",
    dotClass:
      "h-2 w-2 rounded-full bg-emerald-600 shadow-[0_0_0_3px_var(--color-confirmed-light)] animate-[pulse-soft_1s_ease-in-out_infinite]",
    wrapClass: `${base} text-emerald-600`,
  };
}, [isOnline, socketState]);

  const showNotificationsSkeleton =
    isInitialLoading && notifications.length === 0;

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem("userId");

    const joinRooms = () => {
      if (userId) {
        socket.emit("auth:join", { userId, studioId, role: "owner" });
      }
      if (studioId) {
        socket.emit("join:studio", { studioId });
      }
      setSocketState("ok");
    };

    const handleConnect = () => joinRooms();
    const handleDisconnect = () => setSocketState("offline");

    const handleNewNotification = (payload) => {
      if (!payload || String(payload.studioId) !== String(studioId)) return;

      queryClient.setQueryData(["notifications", studioId], (old = []) => {
        const exists = old.some((item) => String(item.id) === String(payload.id));
        if (exists) return old;
        return [payload, ...old];
      });
    };

    const handleNotificationsUpdated = async () => {
      await queryClient.invalidateQueries({
        queryKey: ["notifications", studioId],
        exact: true,
      });
    };

    if (socket.connected) {
      joinRooms();
    } else {
      setTimeout(() => setSocketState("offline"), 0);
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("notification:new", handleNewNotification);
    socket.on("notifications:updated", handleNotificationsUpdated);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("notification:new", handleNewNotification);
      socket.off("notifications:updated", handleNotificationsUpdated);
    };
  }, [studioId, queryClient]);

  const markAsRead = async (id) => {
    const token = localStorage.getItem("token");
    const previous = queryClient.getQueryData(["notifications", studioId]) || [];

    queryClient.setQueryData(["notifications", studioId], (old = []) =>
      old.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );

    try {
      await api(`/owner/studio/${studioId}/notifications/${id}/read`, {
        method: "PATCH",
        token,
      });
    } catch (err) {
      console.error("Failed to mark as read:", err);
      queryClient.setQueryData(["notifications", studioId], previous);
    }
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem("token");
    const previous = queryClient.getQueryData(["notifications", studioId]) || [];

    queryClient.setQueryData(["notifications", studioId], (old = []) =>
      old.map((n) => ({ ...n, isRead: true })),
    );

    try {
      await api(`/owner/studio/${studioId}/notifications/read-all`, {
        method: "PATCH",
        token,
      });
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      queryClient.setQueryData(["notifications", studioId], previous);
    }
  };

  return (
    <div className="h-full space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-[var(--color-cream)] bg-white p-4 shadow-[var(--shadow-soft)] sm:p-6">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[var(--color-forest)] via-[var(--color-caramel)] to-[var(--color-ink)] opacity-70" />

        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
<div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-700 shadow-[0_4px_14px_rgba(15,23,42,0.05)]">
  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white">
    <Bell className="h-3 w-3" />
  </div>

  <span>Повідомлення</span>

  <div className="h-1 w-1 rounded-full bg-slate-400" />
</div>
                         

            <h1 className="text-3xl font-black tracking-tight text-[var(--color-ink)] sm:text-4xl">
              Повідомлення
            </h1>

            <p className="mt-2 max-w-xl text-sm text-[var(--color-caramel)] sm:text-base">
              Усі оновлення студії, перенесення записів та важливі події в одному
              місці.
            </p>
          </div>
<div
  className={cn(
    "inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold shadow-sm sm:text-xs",
    liveStatusUi.wrapClass,
  )}
>
  <span
    className={cn(
      "h-2 w-2 rounded-full shadow-[0_0_0_3px_rgba(255,255,255,0.9)]",
      liveStatusUi.dotClass,
    )}
  />
  <span className="whitespace-nowrap">{liveStatusUi.text}</span>
</div>
        </div>
      </div>

<SectionCard>
        {showNotificationsSkeleton ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <NotificationCardSkeleton key={i} />
            ))}
          </div>
        ) : notifications.length === 0 ? (
<div className="rounded-2xl border-2 border-dashed border-[var(--color-caramel)]/40 bg-[var(--color-cream)] p-6 text-center sm:p-8">
  <div className="mb-3 flex items-center justify-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/70">
      <Bell className="h-6 w-6 text-[var(--color-caramel)]" />
    </div>
  </div>

  <p className="text-sm font-medium text-[var(--color-caramel)]">
    Нових повідомлень немає
  </p>

<p className="mt-1 text-xs text-[var(--color-caramel)]/80">
  Щойно з’являться нові події, вони будуть доступні тут.
</p>
</div>
        ) : (
          <>
            <div className="space-y-3">
              {notifications.slice(0, visibleCount).map((n) => (
                <NotificationCard key={n.id} item={n} onRead={markAsRead} />
              ))}
            </div>

            {visibleCount < notifications.length && (
              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 5)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-white px-4 text-sm font-bold text-[var(--color-primary-buttom)] shadow-sm transition-all duration-200 hover:bg-[var(--color-cream)] active:scale-[0.98]"
                >
                  Показати ще
                </button>
              </div>
            )}
          </>
        )}
      </SectionCard>
    </div>
  );
}
