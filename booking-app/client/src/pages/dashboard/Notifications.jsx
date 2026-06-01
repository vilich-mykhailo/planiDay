import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { socket } from "../../lib/socket";
import {
  ArrowRight,
  Bell,
  CalendarClock,
  Check,
  Clock3,
  Scissors,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
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

function splitDateTime(value) {
  const raw = String(value || "").trim();
  if (!raw) return { date: "—", time: "" };

  const iso = new Date(raw);
  if (!Number.isNaN(iso.getTime())) {
    const [date, time] = formatDateTimeUA(raw).split(" ");
    return { date, time };
  }

  const parts = raw.match(/^(.+?)\s+(\d{1,2}:\d{2})$/);
  if (parts) {
    return { date: parts[1], time: parts[2] };
  }

  return { date: raw, time: "" };
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
        "group relative overflow-hidden rounded-[28px] border border-[#eadbc9] bg-white shadow-[0_18px_50px_rgba(17,17,17,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(17,17,17,0.09)]",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-[3px] bg-[#ff5a00]" />

      <div className="border-b border-[#eadbc9] px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[26px] font-black tracking-tight text-[#202020]">
              {title}
            </h2>

            {subtitle && (
              <p className="text-sm font-medium text-[#77716b]">
                {subtitle}
              </p>
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
    <div className={cn("animate-pulse rounded-2xl bg-[#f2eee8]", className)} />
  );
}

function NotificationCardSkeleton() {
  return (
    <div className="rounded-[28px] border border-[#eadbc9] bg-white p-4 shadow-[0_12px_32px_rgba(17,17,17,0.05)]">
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

function DetailItem({ icon: Icon, label, value, accent = false, dateTime = false }) {
  const dateParts = dateTime ? splitDateTime(value) : null;

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col items-center rounded-[22px] border p-3 text-center sm:p-4",
        accent
          ? "border-[#ffd6bd] bg-[#fff7f0]"
          : "border-[#eadbc9] bg-white",
      )}
    >
      <div
        className={cn(
          "mb-3 flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm",
          accent ? "bg-white text-[#ff5a00]" : "bg-[#fbfaf8] text-[#77716b]",
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#8a837c]">
        {label}
      </p>

      {dateTime ? (
        <div className="mt-1 min-w-0">
          {dateParts.time && (
            <p className="text-[20px] font-black leading-none text-[#202020]">
              {dateParts.time}
            </p>
          )}

          <p className="mt-1 text-[12px] font-bold leading-4 text-[#77716b] sm:text-[13px]">
            {dateParts.date}
          </p>
        </div>
      ) : (
        <p className="mt-1 max-w-full break-words text-[15px] font-black leading-5 text-[#202020]">
          {value || "—"}
        </p>
      )}
    </div>
  );
}

function RescheduleModal({ item, onClose, onRead }) {
  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-stretch justify-center bg-[#202020]/45 p-0 backdrop-blur-[6px] sm:items-center sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="flex h-dvh w-full max-w-2xl flex-col overflow-hidden rounded-none border-0 bg-[#f7f5f1] shadow-[0_30px_90px_rgba(15,23,42,0.24)] sm:h-auto sm:max-h-[calc(100dvh-48px)] sm:rounded-[30px] sm:border sm:border-[#f0e2d3]">
        <div className="relative shrink-0 overflow-hidden bg-[#f3eee7] px-5 py-5 sm:px-6 sm:py-6">
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#ff7a18] via-[#ff6200] to-[#ff8c42]" />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[11px] font-black uppercase tracking-[0.08em] text-[#ff6200] shadow-[0_8px_20px_rgba(255,98,0,0.08)]">
                <CalendarClock className="h-3.5 w-3.5" />
                Перенесення
              </span>

              <h3 className="mt-3 text-[28px] font-black leading-[0.95] tracking-[-0.04em] text-[#202020] sm:text-[34px]">
                Запис перенесено
              </h3>

              <p className="mt-2 max-w-xl text-sm font-medium leading-5 text-[#77716b]">
                Клієнт змінив час візиту. Нижче зібрані всі деталі перенесення.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[#77716b] shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition hover:bg-[#fff3e9] hover:text-[#ff6200] active:scale-[0.96]"
              aria-label="Закрити"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-white px-5 py-5 sm:px-6">
          <div className="grid grid-cols-2 gap-3">
            <DetailItem icon={UserRound} label="Клієнт" value={item.clientName} />
            <DetailItem icon={Scissors} label="Послуга" value={item.serviceName} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <DetailItem icon={Clock3} label="Було" value={item.oldDate} dateTime />

            <div className="hidden h-11 w-11 items-center justify-center rounded-full border border-[#ffd6bd] bg-[#fff7f0] text-[#ff5a00] sm:flex">
              <ArrowRight className="h-5 w-5" />
            </div>

            <DetailItem icon={CalendarClock} label="Стало" value={item.newDate} accent dateTime />
          </div>

          <div className="mt-4 rounded-[22px] border border-[#eadbc9] bg-[#fbfaf8] px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#8a837c]">
              Створено
            </p>
            <p className="mt-1 text-sm font-bold text-[#202020]">
              {formatDateTimeUA(item.createdAt)}
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 shrink-0 border-t border-[#f0e7da] bg-[#fbfaf8] px-5 py-4 sm:px-6">
          <div className="flex flex-row gap-2 sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-2xl border border-[#eadbc9] bg-white px-4 text-sm font-black text-[#202020] transition hover:border-[#ffd6bd] hover:bg-[#fff7f0] sm:flex-none"
            >
              Закрити
            </button>

            {!item.isRead && (
              <button
                type="button"
                onClick={() => {
                  onRead?.(item.id);
                  onClose?.();
                }}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#ff5a00] px-4 text-sm font-black text-white shadow-[0_16px_34px_rgba(255,90,0,0.24)] transition-all duration-200 hover:bg-[#ef4f00] active:scale-[0.98] sm:flex-none"
              >
                <Check className="h-4 w-4" />
                Прочитати
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationCard({ item, onRead, onOpenDetails }) {
  const isReschedule = item.oldDate || item.newDate;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[24px] border p-3 transition-all duration-200 sm:p-4",
        "hover:-translate-y-0.5 hover:border-[#ffd6bd] hover:shadow-[0_18px_44px_rgba(255,90,0,0.10)]",
        item.isRead
          ? "border-[#eadbc9] bg-white shadow-[0_8px_24px_rgba(17,17,17,0.04)]"
          : "border-[#ffd6bd] bg-[#fffaf6] shadow-[0_16px_44px_rgba(255,90,0,0.10)]",
      )}
    >
      {!item.isRead && (
        <div className="absolute inset-y-4 left-0 w-1 rounded-r-full bg-[#ff5a00]" />
      )}

      <div className="min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="line-clamp-1 text-[15px] font-black text-[#202020] sm:text-[16px]">
              {isReschedule ? "Перенесення запису" : item.title || "Повідомлення"}
            </p>

            {!item.isRead && (
              <span className="rounded-full border border-[#ffd6bd] bg-[#fff1e8] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#ff5a00]">
                Нове
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center">
            {item.isRead ? (
              <span className="inline-flex h-8 items-center justify-center rounded-xl border border-[#eadbc9] bg-[#f5f1ea] px-3 text-xs font-black text-[#77716b]">
                Прочитано
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onRead(item.id)}
                className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-[#ff5a00] px-3 text-xs font-black text-white shadow-[0_12px_26px_rgba(255,90,0,0.24)] transition-all duration-200 hover:bg-[#ef4f00] active:scale-[0.98]"
              >
                <Check className="h-3.5 w-3.5" />
                Прочитати
              </button>
            )}
          </div>
        </div>

        {isReschedule && (
          <button
            type="button"
            onClick={() => onOpenDetails?.(item)}
            className="mt-2 w-full rounded-[18px] border border-[#eadbc9] bg-white px-3 py-2.5 text-left transition-all duration-200 hover:border-[#ffd6bd] hover:bg-[#fff7f0]"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#fff1e8] text-[#ff5a00]">
                    <CalendarClock className="h-3.5 w-3.5" />
                  </span>

<p className="line-clamp-2 min-h-[36px] text-[13px] font-black text-[#202020] sm:text-sm">
  {item.clientName || "Клієнт"} змінив час запису
</p>
                </div>


              </div>
            
              <span className="inline-flex h-8 shrink-0 items-center gap-1 rounded-xl border border-[#ffd6bd] bg-[#fff1e8] px-2.5 text-xs font-black text-[#ff5a00]">
                Деталі
                <ArrowRight className="h-3.5 w-3.5" />
              </span>

            </div>
          </button>
        )}

        <p className="mt-2 text-[11px] font-semibold text-[#77716b] sm:text-xs">
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
  const [selectedReschedule, setSelectedReschedule] = useState(null);
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

  const liveStatusUi =
    !isOnline || socketState === "offline"
      ? {
          text: "Немає інтернету",
          wrapClass:
            "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger)]",
        }
      : socketState === "pending"
        ? {
            text: "Оновлення...",
            wrapClass:
              "border-[#ffd6bd] bg-[#fff1e8] text-[#ff5a00]",
          }
        : {
            text: "Оновлюється автоматично",
            wrapClass:
              "border-[#ffd6bd] bg-[#fff1e8] text-[#ff5a00]",
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
    <div className="min-h-screen space-y-6 bg-[#faf8f4] pb-10">
<div className="relative overflow-hidden rounded-[32px] border border-[#ebe7df] bg-white/95 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-7">
  <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#ff7a18] via-[#ff6200] to-[#ff8c42]" />

  <div className="absolute -right-7 -top-10 hidden h-28 w-28 rounded-full bg-white/40 sm:block" />
  <div className="absolute bottom-4 right-24 hidden h-5 w-5 rounded-full bg-[#ff5a00]/20 sm:block" />

  <div className="relative max-w-2xl">
    <h1 className="max-w-xl text-4xl font-black leading-[0.95] tracking-tight text-[#202020] sm:text-6xl">
      Повідом<span className="text-[#ff5a00]">лення</span>
    </h1>

    <p className="mt-3 max-w-[640px] text-[14px] leading-6 text-[#7b766f] sm:text-[16px]">
      Усі оновлення студії, перенесення записів та важливі події в одному місці.
    </p>


  </div>
</div>

      <SectionCard
        title="Список повідомлень"
        subtitle="Останні сповіщення та службові оновлення"
        actions={
          notifications.some((n) => !n.isRead) ? (
            <button
              type="button"
              onClick={markAllAsRead}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#ff5a00] px-4 text-sm font-black text-white shadow-[0_16px_34px_rgba(255,90,0,0.24)] transition-all duration-200 hover:bg-[#ef4f00] active:scale-[0.98]"
            >
              <Check className="h-4 w-4" />
              Прочитати всі
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex h-11 cursor-not-allowed items-center justify-center rounded-2xl border border-[#eadbc9] bg-[#f5f1ea] px-4 text-sm font-black text-[#77716b]"
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
          <div className="rounded-[24px] border-2 border-dashed border-[#ffd6bd] bg-[#fff7f0] p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#ff5a00] shadow-sm">
              <Bell className="h-6 w-6" />
            </div>

            <p className="text-sm font-black text-[#202020]">
              Нових повідомлень немає
            </p>
            <p className="mt-1 text-xs font-medium text-[#77716b]">
              Коли з’являться нові події, вони будуть тут.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {notifications.slice(0, visibleCount).map((n) => (
                <NotificationCard
                  key={n.id}
                  item={n}
                  onRead={markAsRead}
                  onOpenDetails={setSelectedReschedule}
                />
              ))}
            </div>

            {visibleCount < notifications.length && (
              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 10)}
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#eadbc9] bg-white px-5 text-sm font-black text-[#202020] shadow-sm transition-all duration-200 hover:border-[#ffd6bd] hover:bg-[#fff7f0] active:scale-[0.98]"
                >
                  Показати ще
                </button>
              </div>
            )}
          </>
        )}
      </SectionCard>

      <RescheduleModal
        item={selectedReschedule}
        onClose={() => setSelectedReschedule(null)}
        onRead={markAsRead}
      />
    </div>
  );
}
