// Notifications.jsx
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { socket } from "../../lib/socket";
import { Bell, Sparkles, Check } from "lucide-react";
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

  return (
    <div
      className={cn(
        "rounded-[28px] border p-4 transition-all duration-200",
        "hover:border-[var(--color-sand)]",
        item.isRead
          ? "border-[var(--color-mist)] bg-[var(--color-cream)]/30"
          : "border-[var(--color-sand)] bg-gradient-to-br from-[var(--color-pending-bg)] via-white to-[var(--color-cream)]",
      )}
    >
      <div className="min-w-0">
{/* HEADER */}
<div className="flex justify-center border-b border-[var(--color-cream)] pb-3">
  <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--color-cream)] px-5 py-2 text-[13px] sm:text-sm font-bold uppercase tracking-[0.12em] text-[var(--color-primary-buttom)] shadow-sm">
    {isReschedule ? "Перенесення запису" : item.title || "Повідомлення"}
  </div>
</div>

        {/* CONTENT */}
{isReschedule && (
  <div className="mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2 text-sm leading-5 sm:leading-6 text-[var(--color-ink)]">
    <span>Клієнт</span>

    {item.clientName && (
      <span className="font-bold text-[var(--color-primary-buttom)]">
        {item.clientName}
      </span>
    )}

    <span>переніс послугу</span>

    {item.serviceName && (
      <span className="font-bold text-[var(--color-primary-buttom)]">
        {item.serviceName}
      </span>
    )}

    <span>з</span>

    {item.oldDate && (
      <span className="font-bold text-[var(--color-primary-buttom)]">
        {item.oldDate}
      </span>
    )}

    <span>на</span>

    {item.newDate && (
      <span className="font-bold text-[var(--color-primary-buttom)]">
        {item.newDate}
      </span>
    )}
  </div>
)}

        {/* FOOTER */}
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--color-cream)] pt-3">
          <p className="text-xs font-medium text-[var(--color-caramel)]">
            Створено: {formatDateTimeUA(item.createdAt)}
          </p>

          {item.isRead ? (
            <span className="inline-flex h-9 items-center justify-center gap-2 rounded-2xl  px-2.5 text-sm font-bold text-[var(--border-hover-primary)] ">
              Прочитано
            </span>
          ) : (
<button
  type="button"
  onClick={() => onRead(item.id)}
  className={cn(
    "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold text-white active:scale-[0.98]",

    // 👉 gradient через nude-green
    "bg-gradient-to-r from-[rgba(var(--color-nude-green-500),var(--color-nude-green-opacity))] to-[rgba(var(--color-nude-green-600),var(--color-nude-green-opacity))]",

    // 👉 hover
    "hover:from-[rgba(var(--color-nude-green-500-hover),1)] hover:to-[rgba(var(--color-nude-green-600-hover),1)]"
  )}
>
  <Check className="h-3.5 w-3.5" />
  Прочитати
</button>
          )}
        </div>
      </div>
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
      "h-2 w-2 rounded-full bg-[var(--color-confirmed)] shadow-[0_0_0_3px_var(--color-confirmed-light)] animate-[pulse-soft_1.8s_ease-in-out_infinite]",
    wrapClass: `${base} text-[var(--color-confirmed-dark)]`,
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
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--color-cream)] px-3 py-1.5">
              <Sparkles className="h-4 w-4 text-[var(--color-forest)]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-ink)]">
                Центр сповіщень
              </span>
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

<SectionCard
  actions={
    
    <div className="flex w-full justify-end">
      {notifications.some((n) => !n.isRead) ? (
        <button
          type="button"
          onClick={markAllAsRead}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-white px-4 text-sm font-bold text-[var(--color-ink)] shadow-sm transition-all duration-200 hover:bg-[var(--color-cream)] active:scale-[0.98]"
        >
          Прочитати всі
        </button>
      ) : (
        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded-2xl border border-[var(--color-cream)] bg-[var(--color-cream)] px-4 py-2 text-sm font-semibold text-[var(--color-caramel)]"
        >
          Прочитано все
        </button>
      )}
    </div>
  }
>
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
