// Notifications.jsx
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { socket } from "../../lib/socket";
import { Bell, Sparkles, Check } from "lucide-react";
import { api } from "../../api/http";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function formatDateTimeUA(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";

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
        "group relative overflow-hidden rounded-3xl border border-stone-200/60 bg-white",
        "shadow-[0_4px_24px_-4px_rgba(120,90,60,0.08)] hover:shadow-[0_8px_32px_-4px_rgba(120,90,60,0.12)]",
        "transition-all duration-300",
        className
      )}
    >
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-60" />

      <div className="border-b border-stone-100 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[26px] font-bold tracking-tight text-stone-800">
              {title}
            </h2>

            {subtitle && (
              <p className="text-sm text-stone-500">{subtitle}</p>
            )}
          </div>

          {actions && <div className="flex shrink-0 items-center">{actions}</div>}
        </div>
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}

function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-stone-200",
        className
      )}
    />
  );
}

function NotificationCardSkeleton() {
  return (
    <div className="rounded-[28px] border border-stone-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
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
        "rounded-[28px] border p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-all duration-200",
        "hover:border-amber-200 hover:shadow-[0_14px_34px_rgba(245,158,11,0.08)]",
        item.isRead
          ? "border-stone-200 bg-stone-50/80"
          : "border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-white"
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="text-[16px] font-black text-stone-900">
              {isReschedule ? "Перенесення запису" : item.title || "Повідомлення"}
            </p>

            {!item.isRead && (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-semibold text-emerald-700">
                Нове
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center">
            {item.isRead ? (
              <span className="inline-flex items-center justify-center rounded-xl border border-stone-200 bg-stone-100 px-3 py-2 text-xs font-semibold text-stone-500">
                Прочитано
              </span>
            ) : (
              <button
                onClick={() => onRead(item.id)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-3 py-2 text-xs font-bold text-white shadow-[0_10px_24px_rgba(5,150,105,0.22)] transition-all duration-200 hover:from-emerald-700 hover:to-emerald-800 active:scale-[0.98]"
              >
                <Check className="h-3.5 w-3.5" />
                Прочитати
              </button>
            )}
          </div>
        </div>

        {isReschedule && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm leading-6 text-stone-700">
            <span>Клієнт</span>

            {item.clientName && (
              <span className="rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                {item.clientName}
              </span>
            )}

            <span>переніс</span>

            {item.serviceName && (
              <span className="rounded-xl border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                {item.serviceName}
              </span>
            )}

            <span>з</span>

            {item.oldDate && (
              <span className="rounded-xl border border-stone-300 bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700">
                {item.oldDate}
              </span>
            )}

            <span>на</span>

            {item.newDate && (
              <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                {item.newDate}
              </span>
            )}
          </div>
        )}

        <p className="mt-3 text-xs font-medium text-stone-400">
          Створено: {formatDateTimeUA(item.createdAt)}
        </p>
      </div>
    </div>
  );
}

export default function Notifications() {
  const queryClient = useQueryClient();
  const studioId = localStorage.getItem("studioId");

  const [visibleCount, setVisibleCount] = useState(10);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [socketState, setSocketState] = useState(
    socket.connected ? "ok" : "offline"
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

  const liveStatusUi =
    !isOnline || socketState === "offline"
      ? {
          text: "Немає інтернету",
          dotClass: "live-indicator live-indicator--offline",
          wrapClass: "border-red-200 bg-red-50 text-red-700",
        }
      : socketState === "pending"
      ? {
          text: "Оновлення...",
          dotClass: "live-indicator live-indicator--pending",
          wrapClass: "border-amber-200 bg-amber-50 text-amber-700",
        }
      : {
          text: "Оновлюється автоматично",
          dotClass: "live-indicator live-indicator--ok",
          wrapClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
        };

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
        const exists = old.some(
          (item) => String(item.id) === String(payload.id)
        );
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
    const previous =
      queryClient.getQueryData(["notifications", studioId]) || [];

    queryClient.setQueryData(["notifications", studioId], (old = []) =>
      old.map((n) => (n.id === id ? { ...n, isRead: true } : n))
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
    const previous =
      queryClient.getQueryData(["notifications", studioId]) || [];

    queryClient.setQueryData(["notifications", studioId], (old = []) =>
      old.map((n) => ({ ...n, isRead: true }))
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
    <div className="min-h-screen space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-stone-200/60 bg-white p-4 shadow-[0_4px_24px_-4px_rgba(120,90,60,0.08)] sm:p-6">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-60" />

        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-3 py-1.5">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700">
                Центр сповіщень
              </span>
            </div>

            <h1 className="text-3xl font-black tracking-tight text-stone-800 sm:text-4xl">
              Повідомлення
            </h1>

            <p className="mt-2 max-w-xl text-sm text-stone-600 sm:text-base">
              Усі оновлення студії, перенесення записів та важливі події в одному місці.
            </p>
          </div>

          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
              liveStatusUi.wrapClass
            )}
          >
            <span className={liveStatusUi.dotClass} />
            <span className="whitespace-nowrap">{liveStatusUi.text}</span>
          </div>
        </div>
      </div>

      <SectionCard
        title="Список повідомлень"
        subtitle="Останні сповіщення та службові оновлення"
        actions={
          notifications.some((n) => !n.isRead) ? (
            <button
              onClick={markAllAsRead}
              className="rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(5,150,105,0.22)] transition-all duration-200 hover:from-emerald-700 hover:to-emerald-800 active:scale-[0.98]"
            >
              Прочитати всі
            </button>
          ) : (
            <button
              disabled
              className="rounded-2xl border border-stone-200 bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-500 cursor-not-allowed"
            >
              Прочитано все
            </button>
          )
        }
      >
        {showNotificationsSkeleton ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <NotificationCardSkeleton key={i} />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/50 p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100">
              <Bell className="h-6 w-6 text-stone-400" />
            </div>

            <p className="text-sm text-stone-500">Нових повідомлень немає</p>
            <p className="mt-1 text-xs text-stone-400">
              Коли з’являться нові події, вони будуть тут.
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
                  onClick={() => setVisibleCount((prev) => prev + 10)}
                  className="rounded-2xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 transition-all duration-200 hover:bg-stone-100 active:scale-[0.98]"
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