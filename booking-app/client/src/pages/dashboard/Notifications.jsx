// Notifications.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { uk } from "date-fns/locale/uk";
import { socket } from "../../lib/socket";
import {
  ArrowRight,
  Ban,
  Bell,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  FilePenLine,
  OctagonAlert,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { api } from "../../api/http";

function toPublicUrl(v) {
  const PUBLIC = import.meta.env.VITE_R2_PUBLIC_BASE_URL;
  const s = String(v || "").trim();

  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;

  return PUBLIC ? `${PUBLIC}/${s}` : s;
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function getClientTitle(client) {
  return (
    [client?.firstName, client?.lastName].filter(Boolean).join(" ").trim() ||
    client?.name ||
    "Клієнт"
  );
}

function findClientForNotification(item, clients = []) {
  const notificationClientId = String(item?.clientId || item?.client?.id || "");
  const notificationName = normalizeText(item?.clientName);

  return (
    clients.find((client) => {
      const clientId = String(client?.id || "");
      if (notificationClientId && clientId === notificationClientId) return true;

      const clientFullName = normalizeText(
        [client?.firstName, client?.lastName].filter(Boolean).join(" "),
      );
      const clientName = normalizeText(client?.name);

      return Boolean(
        notificationName &&
          (clientFullName === notificationName || clientName === notificationName),
      );
    }) || null
  );
}

function getNotificationClientPhoto(item, client) {
  return toPublicUrl(
    item?.clientPhotoUrl ||
      item?.clientPhoto ||
      item?.client?.photoUrl ||
      item?.client?.photo ||
      item?.client?.avatar ||
      item?._client?.photoUrl ||
      item?._client?.photo ||
      item?._client?.avatar ||
      client?.photoUrl ||
      client?.photo ||
      client?.avatar ||
      "",
  );
}

function ClientAvatar({ item, client, name, className = "h-10 w-10" }) {
  const photo = getNotificationClientPhoto(item, client);

  return (
    <div
      className={`${className} grid shrink-0 place-items-center overflow-hidden rounded-full border border-[#eadbc9] bg-[#fff1e8] text-[#ff6200]`}
    >
      {photo ? (
        <img
          src={photo}
          alt={name || getClientTitle(client)}
          className="h-full w-full object-cover"
        />
      ) : (
        <UserRound className="h-5 w-5" />
      )}
    </div>
  );
}

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

function formatCreatedCompact(dateStr) {
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

function getRescheduleInfo(item) {
  if (!item?.oldDate || !item?.newDate) {
    return {
      text: "змінив запис",
      type: "datetime",
      modalTitle: "Запис оновлено",
    };
  }

  const oldParts = splitDateTime(item.oldDate);
  const newParts = splitDateTime(item.newDate);

  const dateChanged = oldParts.date !== newParts.date;
  const timeChanged = oldParts.time !== newParts.time;


  if (dateChanged && timeChanged) {
    return {
      text: "змінив(ла) дату та час запису",
      type: "datetime",
      modalTitle: "Нові дата та час оновлені",
    };
  }

  if (dateChanged) {
    return {
      text: "змінив(ла) дату запису",
      type: "date",
      modalTitle: "Нову дату оновлено",
    };
  }

  if (timeChanged) {
    return {
      text: "змінив(ла) час запису",
      type: "time",
      modalTitle: "Новий час оновлено",
    };
  }

  return {
    text: "оновив(ла) запис",
    type: "datetime",
    modalTitle: "Запис оновлено",
  };
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
        "group relative overflow-hidden rounded-[28px] border border-[#eadbc9] bg-white shadow-[0_18px_50px_rgba(17,17,17,0.06)] transition-all duration-300 hover:shadow-[0_24px_70px_rgba(17,17,17,0.09)]",
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

        <SkeletonBlock className="mt-4 h-4.5 w-4.50" />
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

function CancelBookingModal({ item, clients = [], onClose }) {
  if (!item) return null;

const canceledTime = splitDateTime(
  item.newDate || item.bookingDate || item.date || item.startAt,
);
const matchedClient = findClientForNotification(item, clients);
const clientName = item.clientName || getClientTitle(matchedClient);


  return (
<div
  className="fixed inset-0 z-[9999] flex items-stretch justify-center bg-[#202020]/45 p-0 backdrop-blur-[6px] sm:items-center sm:p-6"
  onMouseDown={(e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  }}
>
      <div className="flex h-dvh w-full max-w-2xl flex-col overflow-hidden rounded-none border-0 bg-[#fbfaf8] shadow-[0_30px_90px_rgba(15,23,42,0.24)] sm:h-auto sm:max-h-[calc(100dvh-48px)] sm:rounded-[32px] sm:border sm:border-[#f0e2d3]">
        <div className="relative shrink-0 overflow-hidden bg-[#202020] px-4 pb-5 pt-4 text-white sm:px-6 sm:pb-6 sm:pt-5">
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#ef4444] via-[#dc2626] to-[#b91c1c]" />

          <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-white/10 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-[#fecaca] ring-1 ring-white/10">
                <Ban className="h-3.5 w-3.5" />
                Скасування запису
              </span>

              <h3 className="mt-3 text-[28px] font-black leading-[0.95] tracking-[-0.045em] sm:text-[36px]">
                Запис скасовано
              </h3>

              <div className="mt-4 rounded-[26px] border border-white/10 bg-white/[0.08] p-4 backdrop-blur">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#fecaca]">
                  Скасований слот
                </p>

                <div className="mt-2 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[42px] font-black leading-none tracking-[-0.05em] text-white sm:text-[52px]">
                      {canceledTime.time || "—"}
                    </p>

                    <p className="mt-1 text-sm font-bold text-white/70">
                      {canceledTime.date}
                    </p>
                  </div>

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#dc2626] text-white shadow-[0_16px_34px_rgba(220,38,38,0.28)]">
                    <Ban className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/15 active:scale-[0.96]"
              aria-label="Закрити"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
  <div className="rounded-[24px] border border-[#eadbc9] bg-white p-3 shadow-[0_12px_30px_rgba(17,17,17,0.05)]">
    <div className="flex items-center gap-2">
      <ClientAvatar
        item={item}
        client={matchedClient}
        name={clientName}
        className="h-[72px] w-[72px]"
      />

      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8a837c]">
          Клієнт
        </p>

        <p className="mt-0.5 line-clamp-2 text-sm font-black leading-5 text-[#202020]">
          {clientName || "—"}
        </p>
      </div>
    </div>
  </div>

  <div className="rounded-[24px] border border-[#eadbc9] bg-white p-3 shadow-[0_12px_30px_rgba(17,17,17,0.05)]">
    <div className="flex items-center gap-1">
 <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center text-[#77716b]">
      <FilePenLine className="h-9 w-9" />
    </div>

      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8a837c]">
          Послуга
        </p>

        <p className="mt-0.5 line-clamp-2 text-sm font-black leading-5 text-[#202020]">
          {item.serviceName || "—"}
        </p>
      </div>
    </div>
  </div>

<div className="grid grid-cols-2 gap-3 sm:contents">
  <DetailItem
    icon={CalendarDays}
    label="Дата і час"
    value={item.newDate || item.bookingDate || item.date || item.startAt}
    dateTime
    accent
  />

  <DetailItem
    icon={Ban}
    label="Статус"
    value="Скасовано клієнтом"
    accent
  />
</div>
</div>

          <div className="mt-3 text-right text-[11px] font-semibold text-[#8a837c]">
            Створено: {formatDateTimeUA(item.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
}

function RescheduleModal({ item, clients = [], onClose, onRead }) {
  if (!item) return null;

  const oldTime = splitDateTime(item.oldDate);
  const newTime = splitDateTime(item.newDate);
  const rescheduleInfo = getRescheduleInfo(item);
const matchedClient = findClientForNotification(item, clients);
const clientName = item.clientName || getClientTitle(matchedClient);

  return (
<div
  className="fixed inset-0 z-[9999] flex items-stretch justify-center bg-[#202020]/45 p-0 backdrop-blur-[6px] sm:items-center sm:p-6"
  onMouseDown={(e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  }}
>
      <div className="flex h-dvh w-full max-w-2xl flex-col overflow-hidden rounded-none border-0 bg-[#fbfaf8] shadow-[0_30px_90px_rgba(15,23,42,0.24)] sm:h-auto sm:max-h-[calc(100dvh-48px)] sm:rounded-[32px] sm:border sm:border-[#f0e2d3]">
        <div className="relative shrink-0 overflow-hidden bg-[#202020] px-4 pb-5 pt-4 text-white sm:px-6 sm:pb-6 sm:pt-5">
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#ff7a18] via-[#ff6200] to-[#ff8c42]" />

          <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-white/10 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-[#ffd6bd] ring-1 ring-white/10">
                <Sparkles className="h-3.5 w-3.5" />
                Перенесення запису
              </span>

<h3 className="mt-3 text-[28px] font-black leading-[0.95] tracking-[-0.045em] sm:text-[36px]">
  {rescheduleInfo.modalTitle}
</h3>

              <div className="mt-4 rounded-[26px] border border-white/10 bg-white/[0.08] p-4 backdrop-blur">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#ffd6bd]">
                  Актуальний слот
                </p>

                <div className="mt-2 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[42px] font-black leading-none tracking-[-0.05em] text-white sm:text-[52px]">
                      {newTime.time || "—"}
                    </p>
                    <p className="mt-1 text-sm font-bold text-white/70">
                      {newTime.date}
                    </p>
                  </div>

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#ff6200] text-white shadow-[0_16px_34px_rgba(255,98,0,0.28)]">
                   {rescheduleInfo.type === "time" ? (
  <Clock3 className="h-6 w-6" />
) : rescheduleInfo.type === "date" ? (
  <CalendarDays className="h-6 w-6" />
) : (
  <CalendarClock className="h-6 w-6" />
)}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/15 active:scale-[0.96]"
              aria-label="Закрити"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] border border-[#eadbc9] bg-white p-3 shadow-[0_12px_30px_rgba(17,17,17,0.05)]">
              <div className="flex items-center gap-2">
<ClientAvatar
  item={item}
  client={matchedClient}
  name={clientName}
  className="h-18 w-18"
/>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8a837c]">
                    Клієнт
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm font-black leading-5 text-[#202020]">
                   {clientName || "—"}
                  </p>
                </div>
              </div>
            </div>

<div className="rounded-[24px] border border-[#eadbc9] bg-white p-3 shadow-[0_12px_30px_rgba(17,17,17,0.05)]">
  <div className="flex items-center gap-2">
    <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center text-[#77716b]">
      <FilePenLine className="h-9 w-9" />
    </div>

    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8a837c]">
        Послуга
      </p>

      <p className="mt-0.5 line-clamp-2 text-sm font-black leading-5 text-[#202020]">
        {item.serviceName || "—"}
      </p>
    </div>
  </div>
</div>
          </div>

          <div className="mt-4 overflow-hidden rounded-[28px] border border-[#eadbc9] bg-white shadow-[0_14px_36px_rgba(17,17,17,0.05)]">
            <div className="flex items-center justify-between border-b border-[#f0e7da] px-4 py-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#ff6200]">
                  Маршрут перенесення
                </p>
                <p className="mt-0.5 text-xs font-semibold text-[#77716b]">
                  Було → Cтало
                </p>
              </div>
            </div>

            <div className="relative grid grid-cols-2">
           <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ffd6bd] bg-white text-[#ff5a00] shadow-[0_8px_20px_rgba(255,90,0,0.12)]">
    <ArrowRight className="h-4 w-4" />
  </span>
</div>
              <div className="p-4 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f5f1ea] text-[#77716b]">
                  <Clock3 className="h-5 w-5" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8a837c]">
                  Було
                </p>
                <p className="mt-1 text-[24px] font-black leading-none tracking-[-0.04em] text-[#202020]">
                  {oldTime.time || "—"}
                </p>
                <p className="mt-1 text-[12px] font-bold leading-4 text-[#77716b]">
                  {oldTime.date}
                </p>
              </div>

              <div className="relative bg-[#fff7f0] p-4 text-center">
                <div className="absolute inset-x-5 top-0 h-[3px] rounded-b-full bg-[#ff6200]" />
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#ff5a00] shadow-sm">
                  {rescheduleInfo.type === "time" ? (
  <Clock3 className="h-5 w-5" />
) : rescheduleInfo.type === "date" ? (
  <CalendarDays className="h-5 w-5" />
) : (
  <CalendarClock className="h-5 w-5" />
)}
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#ff6200]">
                  Стало
                </p>
                <p className="mt-1 text-[24px] font-black leading-none tracking-[-0.04em] text-[#202020]">
                  {newTime.time || "—"}
                </p>
                <p className="mt-1 text-[12px] font-bold leading-4 text-[#77716b]">
                  {newTime.date}
                </p>
              </div>
            </div>
          </div>

<div className="mt-3 text-right text-[11px] font-semibold text-[#8a837c]">
  Створено: {formatDateTimeUA(item.createdAt)}
</div>
        </div>
      </div>
    </div>
  );
}

function NotificationCard({ item, clients = [], onRead, onOpenDetails, onOpenCanceled }) {
const isCanceled = item.type === "BOOKING_CANCELED";

const isReschedule =
  item.type === "BOOKING_RESCHEDULED" ||
  (!isCanceled && item.oldDate && item.newDate);
  const rescheduleInfo = getRescheduleInfo(item);
  const matchedClient = findClientForNotification(item, clients);
  const clientName = item.clientName || getClientTitle(matchedClient);
  const StatusIcon = isCanceled
  ? Ban
  : isReschedule
    ? rescheduleInfo.type === "time"
      ? Clock3
      : rescheduleInfo.type === "date"
        ? CalendarDays
        : CalendarClock
    : Bell;

const statusIconClass = isCanceled
  ? "bg-[#fff1f1] text-[#dc2626] sm:[.reschedule-card:hover_&]:bg-[#dc2626] sm:[.reschedule-card:hover_&]:text-white"
  : isReschedule
    ? "bg-[#fff1e8] text-[#ff6200] sm:[.reschedule-card:hover_&]:bg-[#ff6200] sm:[.reschedule-card:hover_&]:text-white"
    : "bg-[#f5f1ea] text-[#77716b] sm:[.reschedule-card:hover_&]:bg-[#202020] sm:[.reschedule-card:hover_&]:text-white";

    const serviceMiniIconClass =
  "bg-[#fff1e8] text-[#ff6200] sm:[.reschedule-card:hover_&]:bg-[#ff6200] sm:[.reschedule-card:hover_&]:text-white";

const dateMiniIconClass = isCanceled
  ? "bg-[#fff1f1] text-[#dc2626] sm:[.reschedule-card:hover_&]:bg-[#dc2626] sm:[.reschedule-card:hover_&]:text-white"
  : "bg-[#fff1e8] text-[#ff6200] sm:[.reschedule-card:hover_&]:bg-[#ff6200] sm:[.reschedule-card:hover_&]:text-white";

const DateMiniIcon = isReschedule
  ? rescheduleInfo.type === "time"
    ? Clock3
    : rescheduleInfo.type === "date"
      ? CalendarDays
      : CalendarClock
  : CalendarDays;
  return (
<div
onClick={() => {
  if (isReschedule) {
    if (!item.isRead) {
      onRead?.(item.id);
    }

    onOpenDetails?.(item);
    return;
  }

  if (isCanceled) {
    if (!item.isRead) {
      onRead?.(item.id);
    }

    onOpenCanceled?.(item);
  }
}}
className={cn(
  "reschedule-card relative cursor-pointer overflow-hidden rounded-[24px] border p-3 transition-all duration-200",
  "hover:bg-[#fff7f0] hover:-translate-y-0.5 hover:border-[#ffd6bd]",
  item.isRead
    ? "border-[#eadbc9] bg-white shadow-[0_8px_24px_rgba(17,17,17,0.04)]"
    : "border-[#ffd6bd] bg-[#fffaf6] shadow-[0_16px_44px_rgba(255,90,0,0.10)]",
)}
>
      {!item.isRead && (
        <div className="absolute inset-y-4 left-0 w-1 rounded-r-full bg-[#ff5a00]" />
      )}

<div className="min-w-0">
<div className="flex items-center justify-between gap-3">
  <div className="flex min-w-0 items-center gap-2">
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-200",
        statusIconClass,
      )}
    >
      <StatusIcon className="h-4 w-4" />
    </span>

    <p className="line-clamp-1 text-[15px] font-black text-[#202020] sm:text-[16px]">
      {isCanceled
        ? "Скасування запису"
        : isReschedule
          ? "Перенесення запису"
          : item.title || "Повідомлення"}
    </p>
  </div>

{item.isRead ? (
  <span className="mr-2 shrink-0 text-xs font-black text-[#77716b]/60 sm:mr-3">
    Прочитано
  </span>
) : (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onRead(item.id);
      }}
      className="inline-flex h-7 shrink-0 items-center gap-1 rounded-xl bg-[#fff1e8] px-2.5 text-[11px] font-black text-[#ff5a00] transition hover:bg-[#ff5a00] hover:text-white active:scale-[0.98]"
    >
      Нове
    </button>
  )}
</div>

  {isReschedule && (
<button
  type="button"
  onClick={() => {
    if (!item.isRead) onRead?.(item.id);
    onOpenDetails?.(item);
  }}
className="reschedule-group mt-2 flex w-full items-center justify-between gap-3 rounded-[16px] bg-white px-2.5 py-2 text-left transition-all duration-200 sm:hover:bg-[#fff7f0] sm:[.reschedule-card:hover_&]:bg-[#fff7f0]"
>
      <div className="flex min-w-0 items-center gap-2">
<ClientAvatar
  item={item}
  client={matchedClient}
  name={clientName}
  className="h-11 w-11 -ml-1"
/>

        <div className="min-w-0">
          <p className="line-clamp-2 text-[13px] font-black leading-4 text-[#202020] sm:line-clamp-1 sm:text-sm">
          {clientName} {rescheduleInfo.text}
          </p>

<div className="mt-1 min-w-0 space-y-1 text-[11px] font-bold text-[#77716b] sm:text-xs">
  <div className="flex min-w-0 items-center gap-1.5">
    <span
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
        serviceMiniIconClass,
      )}
    >
      <FilePenLine className="h-3 w-3" />
    </span>

    <p className="line-clamp-1 leading-4">
      {item.serviceName || "Послуга"}
    </p>
  </div>

  <div className="flex min-w-0 items-center gap-1.5">
    <span
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
        dateMiniIconClass,
      )}
    >
      <DateMiniIcon className="h-3 w-3" />
    </span>

    <p className="line-clamp-1 text-[#ff5a00]">
      {item.newDate || "Новий час"}
    </p>
  </div>

  <p className="line-clamp-1 pl-6 text-[10px] font-bold text-[#aaa19a]">
    Створено: {formatCreatedCompact(item.createdAt)}
  </p>
</div>
        </div>
      </div>

<ChevronRight className="h-5 w-5 shrink-0 text-[#ff5a00] transition-all duration-200 sm:[.reschedule-group:hover_&]:translate-x-1 sm:[.reschedule-card:hover_&]:translate-x-1" />
    </button>
  )}
{isCanceled && (
  <button
    type="button"
    onClick={() => {
      if (!item.isRead) onRead?.(item.id);
      onOpenCanceled?.(item);
    }}
    className="cancel-group mt-2 flex w-full items-center justify-between gap-3  px-2.5 py-2 text-left transition-all duration-200 "
  >
    <div className="flex min-w-0 items-center gap-2">
     <ClientAvatar
        item={item}
        client={matchedClient}
        name={clientName}
        className="h-11 w-11 -ml-1"
      />

      <div className="min-w-0">
        <p className="line-clamp-2 text-[13px] font-black leading-4 text-[#202020] sm:line-clamp-1 sm:text-sm">
          {clientName} скасував(ла) запис
        </p>

<div className="mt-1 min-w-0 space-y-1 text-[11px] font-bold text-[#77716b] sm:text-xs">
  <div className="flex min-w-0 items-center gap-1.5">
    <span
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
        serviceMiniIconClass,
      )}
    >
      <FilePenLine className="h-3 w-3" />
    </span>

    <p className="line-clamp-1 leading-4">
      {item.serviceName || "Послуга"}
    </p>
  </div>

  <div className="flex min-w-0 items-center gap-1.5">
    <span
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
        dateMiniIconClass,
      )}
    >
      <CalendarDays className="h-3 w-3" />
    </span>

    <p className="line-clamp-1 text-[#dc2626]">
      {item.newDate || item.bookingDate || item.date || item.startAt || "Дата запису"}
    </p>
  </div>

  <p className="line-clamp-1 pl-6 text-[10px] font-bold text-[#aaa19a]">
    Створено: {formatCreatedCompact(item.createdAt)}
  </p>
</div>
      </div>
    </div>

   <ChevronRight className="h-5 w-5 shrink-0 text-[#dc2626] transition-all duration-200 sm:[.cancel-group:hover_&]:translate-x-1 sm:[.reschedule-card:hover_&]:translate-x-1" />
  </button>
)}
</div>
    </div>
  );
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function endOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function startOfWeekMonday(d) {
  const x = startOfDay(d);
  const day = x.getDay();
  const mondayIndex = (day + 6) % 7;
  x.setDate(x.getDate() - mondayIndex);
  return x;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function getNotificationDate(item) {
  const raw = item?.createdAt || item?.newDate || item?.bookingDate || item?.date || item?.startAt;
  if (!raw) return null;

  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;

  return d;
}

function getNotificationTypeKey(item) {
  const isCanceled = item?.type === "BOOKING_CANCELED";
  const isReschedule =
    item?.type === "BOOKING_RESCHEDULED" ||
    (!isCanceled && item?.oldDate && item?.newDate);

  if (isCanceled) return "canceled";
  if (isReschedule) return "rescheduled";
  return "other";
}

function Pill({ active, count, showCount = false, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold",
        active
          ? "inline-flex h-9 items-center justify-center gap-2 rounded-2xl border border-[#ff5a00] bg-[#ff5a00] px-2 text-sm font-bold text-white transition-all duration-200 hover:bg-[#ef4f00] active:scale-[0.98]"
          : "inline-flex h-9 items-center justify-center gap-2 rounded-2xl border border-[#eadbc9] bg-white px-2 text-sm font-bold text-[#202020] shadow-sm transition-all duration-200 hover:border-[#ffd6bd] hover:bg-[#fff7f0] active:scale-[0.98]",
      )}
    >
      <span>{children}</span>

      {showCount && (
        <span
          className={cn(
            "text-[11px] font-medium tracking-tight",
            active ? "text-white/80" : "text-[#ff5a00]",
          )}
        >
          +{count ?? 0}
        </span>
      )}
    </button>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Оберіть",
  withClientPhotos = false,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e) {
      if (selectRef.current && !selectRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const selected = options.find((item) => String(item.id) === String(value));

  return (
    <div ref={selectRef} className={cn("relative min-w-0", className)}>
      {label && (
        <span className="mb-2 block text-sm font-black text-[#202020]">
          {label}
        </span>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-12 w-full items-center justify-between gap-3 rounded-[14px] border border-[#e5eaf0] bg-white px-4 text-sm font-bold text-[#202020] shadow-sm transition hover:border-[#d8dee8] hover:bg-[#fff8f3] focus:border-[#ff6200] focus:ring-4 focus:ring-[#ff6200]/10"
      >
        {selected ? (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {withClientPhotos && selected.id !== "all" && (
              <ClientAvatar
                client={selected.client}
                name={selected.label}
                className="h-8 w-8"
              />
            )}

            <span className="truncate">
              {selected.label}
            </span>
          </div>
        ) : (
          <span className="truncate text-[#9aa3af]">
            {placeholder}
          </span>
        )}

        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[#6b7280] transition",
            open && "rotate-180 text-[#ff6200]",
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-30 mt-2 w-full overflow-hidden rounded-[16px] border border-[#e5eaf0] bg-white py-2 shadow-[0_18px_42px_rgba(15,23,42,0.14)]">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-center text-sm font-bold text-[#77716b]">
              Немає даних
            </div>
          ) : (
            options.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onChange(item.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm font-bold transition",
                  String(value) === String(item.id)
                    ? "bg-[#fff1e8] text-[#ff6200]"
                    : "text-[#202020] hover:bg-[#fbfaf8]",
                )}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {withClientPhotos && item.id !== "all" && (
                    <ClientAvatar
                      client={item.client}
                      name={item.label}
                      className="h-10 w-10"
                    />
                  )}

                  <span className="truncate">
                    {item.label}
                  </span>
                </div>

                {typeof item.count === "number" && (
                  <span className="shrink-0 text-xs text-[#8b95a5]">
                    {item.count}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const EMPTY_NOTIFICATIONS = [];
const EMPTY_CLIENTS = [];
export default function Notifications() {
  const queryClient = useQueryClient();
  const [studioId, setStudioId] = useState(
  () => localStorage.getItem("studioId") || "",
);
useEffect(() => {
  const syncStudioId = () => {
    setStudioId(localStorage.getItem("studioId") || "");
  };

  syncStudioId();

  window.addEventListener("storage", syncStudioId);
  window.addEventListener("auth-changed", syncStudioId);

  return () => {
    window.removeEventListener("storage", syncStudioId);
    window.removeEventListener("auth-changed", syncStudioId);
  };
}, []);
const [clients, setClients] = useState([]);
const [visibleCount, setVisibleCount] = useState(10);
const [typeFilter, setTypeFilter] = useState("all");
const [clientFilter, setClientFilter] = useState("all");
const [dateFilter, setDateFilter] = useState("all");
const [customDateFrom, setCustomDateFrom] = useState(null);
const [customDateTo, setCustomDateTo] = useState(null);
const datePickerFromRef = useRef(null);
const datePickerToRef = useRef(null);
const [selectedReschedule, setSelectedReschedule] = useState(null);
const [selectedCanceled, setSelectedCanceled] = useState(null);
const [isOnline, setIsOnline] = useState(navigator.onLine);
const [socketState, setSocketState] = useState(() =>
  socket.connected ? "ok" : "pending",
);

const notificationsQuery = useQuery({
  queryKey: ["notifications", studioId],
  queryFn: () => fetchNotifications(studioId),
  enabled: Boolean(studioId),
  staleTime: 0,
  gcTime: 1000 * 60 * 30,
  refetchOnMount: "always",
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
});

useEffect(() => {
  if (!studioId) return;

  queryClient.invalidateQueries({
    queryKey: ["notifications", studioId],
    exact: true,
  });
}, [studioId, queryClient]);

  useEffect(() => {
    if (!studioId) return;

    const loadClients = async () => {
      try {
        const token = localStorage.getItem("token");

        const data = await api(`/owner/studio/${studioId}/clients`, {
          token,
        });

        setClients(Array.isArray(data?.clients) ? data.clients : []);
      } catch (e) {
        console.error("Failed to load clients:", e);
        setClients([]);
      }
    };

    loadClients();
  }, [studioId]);

  const notifications = notificationsQuery.data ?? EMPTY_NOTIFICATIONS;
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

  const notificationTypeCounts = useMemo(() => {
    const counts = {
      all: notifications.length,
      rescheduled: 0,
      canceled: 0,
      other: 0,
    };

    for (const item of notifications) {
      const key = getNotificationTypeKey(item);
      counts[key] = (counts[key] || 0) + 1;
    }

    return counts;
  }, [notifications]);

  const notificationTypeOptions = useMemo(() => {
  return [
    {
      id: "all",
      label: "Усі повідомлення",
      count: notificationTypeCounts.all,
    },
    {
      id: "rescheduled",
      label: "Перенесення",
      count: notificationTypeCounts.rescheduled,
    },
    {
      id: "canceled",
      label: "Скасування",
      count: notificationTypeCounts.canceled,
    },
    {
      id: "other",
      label: "Інші",
      count: notificationTypeCounts.other,
    },
  ];
}, [notificationTypeCounts]);

const dateFilterOptions = useMemo(() => {
  return [
    { id: "all", label: "Увесь період" },
    { id: "today", label: "Сьогодні" },
    { id: "week", label: "Цей тиждень" },
    { id: "month", label: "Цей місяць" },
    { id: "custom", label: "Свій період" },
  ];
}, []);

  const clientOptions = useMemo(() => {
    const map = new Map();

    for (const item of notifications) {
      const matchedClient = findClientForNotification(item, clients);
      const name = String(item.clientName || getClientTitle(matchedClient)).trim();
      if (!name) continue;

      const key = String(item.clientId || matchedClient?.id || name).toLowerCase();

      if (!map.has(key)) {
        map.set(key, {
          id: key,
          label: name,
          count: 0,
          client: matchedClient,
        });
      }

      map.get(key).count += 1;
    }

    return [
      { id: "all", label: "Усі клієнти", count: notifications.length },
      ...Array.from(map.values()).sort((a, b) =>
        a.label.localeCompare(b.label, "uk"),
      ),
    ];
  }, [notifications, clients]);

  const filteredNotifications = useMemo(() => {
    let result = [...notifications];

    if (typeFilter !== "all") {
      result = result.filter((item) => getNotificationTypeKey(item) === typeFilter);
    }

    if (clientFilter !== "all") {
      result = result.filter((item) => {
        const matchedClient = findClientForNotification(item, clients);
        const name = String(item.clientName || getClientTitle(matchedClient)).trim();
        const key = String(item.clientId || matchedClient?.id || name).toLowerCase();

        return key === clientFilter;
      });
    }

    const today = startOfDay(new Date());

    if (dateFilter === "today") {
      const from = startOfDay(today);
      const to = endOfDay(today);

      result = result.filter((item) => {
        const d = getNotificationDate(item);
        return d && d >= from && d <= to;
      });
    }

    if (dateFilter === "week") {
      const from = startOfWeekMonday(today);
      const to = endOfDay(addDays(from, 6));

      result = result.filter((item) => {
        const d = getNotificationDate(item);
        return d && d >= from && d <= to;
      });
    }

    if (dateFilter === "month") {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      const to = endOfDay(new Date(today.getFullYear(), today.getMonth() + 1, 0));

      result = result.filter((item) => {
        const d = getNotificationDate(item);
        return d && d >= from && d <= to;
      });
    }

    if (dateFilter === "custom") {
      const from = customDateFrom ? startOfDay(customDateFrom) : null;
      const to = customDateTo ? endOfDay(customDateTo) : null;

      result = result.filter((item) => {
        const d = getNotificationDate(item);
        if (!d) return false;

        if (from && d < from) return false;
        if (to && d > to) return false;

        return true;
      });
    }

    return result;
  }, [
  notifications,
  clients,
  typeFilter,
  clientFilter,
  dateFilter,
  customDateFrom,
  customDateTo,
]);

  const resetNotificationsVisibleCount = () => setVisibleCount(10);


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
  if (!studioId) return;

  const userId = localStorage.getItem("userId");

  const refetchNotifications = () => {
    queryClient.invalidateQueries({
      queryKey: ["notifications", studioId],
      exact: true,
    });
  };

  const joinRooms = () => {
    if (userId) {
      socket.emit("auth:join", {
        userId,
        studioId,
        role: "owner",
      });
    }

    socket.emit("join:studio", { studioId });

    refetchNotifications();
  };

  const handleConnect = () => {
    joinRooms();
    setSocketState("ok");
  };

  const handleDisconnect = () => {
    setSocketState("offline");
  };

  const handleNewNotification = (payload) => {
    if (!payload) return;
    if (String(payload.studioId) !== String(studioId)) return;

    queryClient.setQueryData(["notifications", studioId], (old) => {
      const list = Array.isArray(old) ? old : [];

      const exists = list.some(
        (item) => String(item.id) === String(payload.id),
      );

      if (exists) return list;

      return [payload, ...list];
    });

    refetchNotifications();
  };

  const handleNotificationsUpdated = (payload) => {
    if (payload?.studioId && String(payload.studioId) !== String(studioId)) {
      return;
    }

    refetchNotifications();
  };

  socket.on("connect", handleConnect);
  socket.on("disconnect", handleDisconnect);
  socket.on("notification:new", handleNewNotification);
  socket.on("notifications:updated", handleNotificationsUpdated);

  if (socket.connected) {
    joinRooms();
  } else {
    socket.connect?.();
  }

  return () => {
    socket.off("connect", handleConnect);
    socket.off("disconnect", handleDisconnect);
    socket.off("notification:new", handleNewNotification);
    socket.off("notifications:updated", handleNotificationsUpdated);
  };
}, [studioId, queryClient]);

useEffect(() => {
  if (selectedReschedule || selectedCanceled) {
    document.body.classList.add("modal-open");
  } else {
    document.body.classList.remove("modal-open");
  }

  return () => {
    document.body.classList.remove("modal-open");
  };
}, [selectedReschedule, selectedCanceled]);

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
      <div className="mx-auto max-w-6xl space-y-6">
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
  title={
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary-buttom)] text-white">
        <Bell className="h-5 w-5" />
      </div>

      <div>
        <h2 className="text-lg font-black tracking-[-0.03em] text-[#202020]">
          Список повідомлень
        </h2>

        <p className="mt-1 text-sm font-medium text-[var(--color-caramel)]">
          Останні сповіщення та службові оновлення
        </p>
      </div>
    </div>
  }
>
<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
  <FilterSelect
    label="Вид повідомлення"
    value={typeFilter}
    onChange={(value) => {
      setTypeFilter(value);
      resetNotificationsVisibleCount();
    }}
    options={notificationTypeOptions}
    placeholder="Усі повідомлення"
  />

  <FilterSelect
    label="Клієнт"
    value={clientFilter}
    onChange={(value) => {
      setClientFilter(value);
      resetNotificationsVisibleCount();
    }}
    options={clientOptions}
    placeholder="Усі клієнти"
    withClientPhotos
  />

  <FilterSelect
    label="Період"
    value={dateFilter}
    onChange={(value) => {
      setDateFilter(value);
      resetNotificationsVisibleCount();
    }}
    options={dateFilterOptions}
    placeholder="Увесь період"
  />
</div>

{dateFilter === "custom" && (
  <div className="mt-4 flex justify-center">
    <div className="w-full max-w-[360px] rounded-[24px] border border-[#eadbc9] bg-[#fffaf6] p-3 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
      <div className="grid grid-cols-2 gap-2">
        {[
          {
            label: "Дата від",
            value: customDateFrom,
            onChange: setCustomDateFrom,
            ref: datePickerFromRef,
          },
          {
            label: "Дата до",
            value: customDateTo,
            onChange: setCustomDateTo,
            ref: datePickerToRef,
          },
        ].map((item) => (
          <label key={item.label} className="min-w-0">
            <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-[0.1em] text-[#aaa19a]">
              {item.label}
            </span>

            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-[#ff6200]" />

              <DatePicker
                ref={item.ref}
                selected={item.value}
                onChange={(date) => {
                  item.onChange(date);
                  resetNotificationsVisibleCount();

                  setTimeout(() => {
                    item.ref.current?.setOpen(false);
                  }, 0);
                }}
                locale={uk}
                dateFormat="dd.MM.yyyy"
                calendarStartDay={1}
                shouldCloseOnSelect={true}
                placeholderText="Оберіть дату"
                popperPlacement="top-start"
                popperClassName="z-[9999] datepicker-popper-mobile"
                className="h-9 w-full rounded-xl border border-[#eadbc9] bg-white pl-8 pr-2 text-[12px] font-bold text-[#202020] shadow-sm outline-none transition-all duration-200 hover:border-[#ffd6bd] focus:border-[#ff6200] focus:ring-4 focus:ring-[#ff6200]/10"
              />
            </div>
          </label>
        ))}
      </div>
    </div>
  </div>
)}

        <div className="my-5 h-px bg-[#eadbc9]" />

        {showNotificationsSkeleton ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <NotificationCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
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
              {filteredNotifications.slice(0, visibleCount).map((n) => (
<NotificationCard
  key={n.id}
  item={n}
  clients={clients}
  onRead={markAsRead}
  onOpenDetails={setSelectedReschedule}
  onOpenCanceled={setSelectedCanceled}
/>
              ))}
            </div>

            {visibleCount < filteredNotifications.length && (
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
  clients={clients}
  onClose={() => setSelectedReschedule(null)}
  onRead={markAsRead}
/>

<CancelBookingModal
  item={selectedCanceled}
  clients={clients}
  onClose={() => setSelectedCanceled(null)}
/>
    </div>
    </div>
  );
}
