import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { socket } from "../../lib/socket";
import {
  ArrowRight,
  Ban,
  Bell,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  OctagonAlert,
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

function CancelBookingModal({ item, onClose }) {
  if (!item) return null;

const canceledTime = splitDateTime(
  item.newDate || item.bookingDate || item.date || item.startAt,
);

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
          <div className="grid grid-cols-2 gap-3">
            <DetailItem icon={UserRound} label="Клієнт" value={item.clientName} />

            <DetailItem icon={Scissors} label="Послуга" value={item.serviceName} />

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

          <div className="mt-3 text-right text-[11px] font-semibold text-[#8a837c]">
            Створено: {formatDateTimeUA(item.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
}

function RescheduleModal({ item, onClose, onRead }) {
  if (!item) return null;

  const oldTime = splitDateTime(item.oldDate);
  const newTime = splitDateTime(item.newDate);
  const rescheduleInfo = getRescheduleInfo(item);

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
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#fff1e8] text-[#ff5a00]">
                  <UserRound className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8a837c]">
                    Клієнт
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm font-black leading-5 text-[#202020]">
                    {item.clientName || "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-[#eadbc9] bg-white p-3 shadow-[0_12px_30px_rgba(17,17,17,0.05)]">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f5f1ea] text-[#77716b]">
                  <Scissors className="h-5 w-5" />
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
                  Було → стало
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

function NotificationCard({ item, onRead, onOpenDetails, onOpenCanceled }) {
const isCanceled = item.type === "BOOKING_CANCELED";

const isReschedule =
  item.type === "BOOKING_RESCHEDULED" ||
  (!isCanceled && item.oldDate && item.newDate);
  const rescheduleInfo = getRescheduleInfo(item);
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
    "reschedule-card relative overflow-hidden rounded-[24px] border p-3 transition-all duration-200 cursor-pointer",
    "hover:bg-[#fff7f0] hover:-translate-y-0.5 hover:border-[#ffd6bd] hover:shadow-[0_18px_44px_rgba(255,90,0,0.10)]",
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
    <p className="line-clamp-1 text-[15px] font-black text-[#202020] sm:text-[16px]">
      {isCanceled
  ? "Скасування запису"
  : isReschedule
    ? "Перенесення запису"
    : item.title || "Повідомлення"}
    </p>

    {item.isRead ? (
      <span className="shrink-0 text-xs font-black text-[#77716b]/60">
        Прочитано
      </span>
    ) : (
      <button
        type="button"
        onClick={() => onRead(item.id)}
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
<span className="grid h-8 w-8 shrink-0 -ml-1 place-items-center rounded-xl bg-[#fff1e8] text-[#ff5a00] transition-all duration-200 sm:[.reschedule-group:hover_&]:bg-[#ff6200] sm:[.reschedule-group:hover_&]:text-white sm:[.reschedule-card:hover_&]:bg-[#ff6200] sm:[.reschedule-card:hover_&]:text-white">
 {rescheduleInfo.type === "time" ? (
  <Clock3 className="h-4.5 w-4.5" />
) : rescheduleInfo.type === "date" ? (
  <CalendarDays className="h-4.5 w-4.5" />
) : (
  <CalendarClock className="h-4.5 w-4.5" />
)}
</span>

        <div className="min-w-0">
          <p className="line-clamp-2 text-[13px] font-black leading-4 text-[#202020] sm:line-clamp-1 sm:text-sm">
          {item.clientName || "Клієнт"} {rescheduleInfo.text}
          </p>

<div className="mt-0.5 min-w-0 text-[11px] font-bold text-[#77716b] sm:text-xs">
  <p className="line-clamp-2 leading-4">
    {item.serviceName || "Послуга"}
  </p>

  <p className="mt-0.5 line-clamp-1 text-[#ff5a00]">
    {item.newDate || "Новий час"}
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
     <span className="grid h-8 w-8 shrink-0 -ml-1 place-items-center rounded-xl bg-[#fef2f2] text-[#dc2626] transition-all duration-200 sm:[.cancel-group:hover_&]:bg-[#dc2626] sm:[.cancel-group:hover_&]:text-white sm:[.reschedule-card:hover_&]:bg-[#dc2626] sm:[.reschedule-card:hover_&]:text-white">
        <Ban className="h-4.5 w-4.5" />
      </span>

      <div className="min-w-0">
        <p className="line-clamp-2 text-[13px] font-black leading-4 text-[#202020] sm:line-clamp-1 sm:text-sm">
          {item.clientName || "Клієнт"} скасував(ла) запис
        </p>

        <div className="mt-0.5 min-w-0 text-[11px] font-bold text-[#77716b] sm:text-xs">
          <p className="line-clamp-2 leading-4">
            {item.serviceName || "Послуга"}
          </p>

          <p className="mt-0.5 line-clamp-1 text-[#dc2626]">
            {item.newDate || item.bookingDate || item.date || item.startAt || "Дата запису"}
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

export default function Notifications() {
  const queryClient = useQueryClient();
  const studioId = localStorage.getItem("studioId");
const [visibleCount, setVisibleCount] = useState(10);
const [selectedReschedule, setSelectedReschedule] = useState(null);
const [selectedCanceled, setSelectedCanceled] = useState(null);
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
  onOpenCanceled={setSelectedCanceled}
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
      <CancelBookingModal
  item={selectedCanceled}
  onClose={() => setSelectedCanceled(null)}
/>
    </div>
    </div>
  );
}
