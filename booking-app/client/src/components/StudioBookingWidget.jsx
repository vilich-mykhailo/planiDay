import { useEffect, useMemo, useRef, useState } from "react";
/* eslint-disable no-unused-vars */
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Check, ChevronRight, Sparkles } from "lucide-react";
import Calendar from "./Calendar";
import BookingCustomerForm from "./BookingCustomerForm";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function timeToMinutes(t) {
  const [hh, mm] = String(t || "00:00").split(":").map(Number);
  return (hh || 0) * 60 + (mm || 0);
}

function minutesToTime(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function buildSlots(start, end, stepMinutes) {
  const startM = timeToMinutes(start);
  const endM = timeToMinutes(end);

  if (endM <= startM) return [];

  const slots = [];
  let minutes = startM;

  while (minutes + stepMinutes <= endM) {
    slots.push(minutesToTime(minutes));
    minutes += stepMinutes;
  }

  return slots;
}

function formatDateLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDayKeyFromDateObj(date) {
  const map = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return map[date.getDay()];
}

function weekdayEnumToKey(v) {
  const s = String(v || "").toUpperCase();
  const m = {
    MON: "mon",
    TUE: "tue",
    WED: "wed",
    THU: "thu",
    FRI: "fri",
    SAT: "sat",
    SUN: "sun",
  };

  return m[s] || null;
}

export default function StudioBookingWidget({
  studio,
  preselectedService,
  onCancel,
  onSuccess,
}) {
  const services = useMemo(() => {
    if (Array.isArray(studio?.services) && studio.services.length) {
      return studio.services;
    }

    const uncategorized = Array.isArray(studio?.uncategorizedServices)
      ? studio.uncategorizedServices
      : [];

    const cats = Array.isArray(studio?.serviceCategories)
      ? studio.serviceCategories
      : [];

    const categorized = cats.flatMap((c) =>
      Array.isArray(c?.services)
        ? c.services.map((service) => ({
            ...service,
            categoryId: c.id ?? null,
            categoryName: c.name ?? "",
          }))
        : [],
    );

    return [...uncategorized, ...categorized];
  }, [studio]);

  const remountKey = useMemo(() => {
    const studioKey = studio?.id ?? studio?.slug ?? "no-studio";
    const preKey = preselectedService?.serviceId ?? "no-pre";
    const servicesKey = services.map((s) => s.id).join("|");

    return `${studioKey}::${preKey}::${servicesKey}`;
  }, [studio?.id, studio?.slug, preselectedService?.serviceId, services]);

  if (!studio) return null;

  return (
    <StudioBookingWidgetInner
      key={remountKey}
      studio={studio}
      services={services}
      preselectedService={preselectedService}
      onCancel={onCancel}
      onSuccess={onSuccess}
    />
  );
}

function StudioBookingWidgetInner({
  studio,
  services,
  preselectedService,
  onCancel,
  onSuccess,
}) {
  const slotDuration =
    typeof studio?.slotDuration === "number" && studio.slotDuration > 0
      ? studio.slotDuration
      : 15;

  const schedule = useMemo(() => {
    if (studio?.schedule && typeof studio.schedule === "object") {
      return studio.schedule;
    }

    const days = Array.isArray(studio?.scheduleDays) ? studio.scheduleDays : [];
    const out = {};

    for (const d of days) {
      const key = weekdayEnumToKey(d.weekday);
      if (!key) continue;

      out[key] = {
        enabled: Boolean(d.enabled),
        start: minutesToTime(Number(d.startMin || 0)),
        end: minutesToTime(Number(d.endMin || 0)),
      };
    }

    return out;
  }, [studio]);

  const visibleServices = useMemo(() => {
    const wantedId = preselectedService?.serviceId;

    if (!wantedId) return services;

    return services.filter((s) => String(s.id) === String(wantedId));
  }, [services, preselectedService?.serviceId]);

  const defaultServiceId = useMemo(() => {
    if (!visibleServices.length) return null;

    const wantedId = preselectedService?.serviceId;
    const exists =
      wantedId &&
      visibleServices.some((s) => String(s.id) === String(wantedId));

    return exists ? wantedId : (visibleServices[0]?.id ?? null);
  }, [visibleServices, preselectedService?.serviceId]);

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [step, setStep] = useState("pick");
  const [selectedServiceId, setSelectedServiceId] = useState(
    () => defaultServiceId,
  );
  const [selectedTime, setSelectedTime] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "" });

  const [busyTimes, setBusyTimes] = useState(() => new Set());
  const [busyLoading, setBusyLoading] = useState(false);

  const selectedDateStr = useMemo(
    () => (selectedDate ? formatDateLocal(selectedDate) : null),
    [selectedDate],
  );

  const dayKey = useMemo(
    () => (selectedDate ? getDayKeyFromDateObj(selectedDate) : null),
    [selectedDate],
  );

  const isDayEnabled = useMemo(() => {
    if (!dayKey) return false;
    return Boolean(schedule?.[dayKey]?.enabled);
  }, [schedule, dayKey]);

  const dayConfig = useMemo(() => {
    if (!dayKey || !isDayEnabled) return null;
    return schedule?.[dayKey] ?? null;
  }, [schedule, dayKey, isDayEnabled]);

  const slots = useMemo(() => {
    if (!dayConfig) return [];
    return buildSlots(dayConfig.start, dayConfig.end, slotDuration);
  }, [dayConfig, slotDuration]);

  useEffect(() => {
    let alive = true;

    async function loadBusy() {
      if (!studio?.id || !selectedDateStr) return;

      setBusyLoading(true);

      try {
        const token = localStorage.getItem("token");

        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/bookings/studio/${studio.id}/busy?date=${encodeURIComponent(selectedDateStr)}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        );

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.message || `Load busy failed (${res.status})`);
        }

        const list = Array.isArray(data?.busy) ? data.busy : [];

        if (alive) {
          setBusyTimes(new Set(list));
        }
      } catch (e) {
        console.error(e);
        if (alive) {
          setBusyTimes(new Set());
        }
      } finally {
        if (alive) {
          setBusyLoading(false);
        }
      }
    }

    loadBusy();

    return () => {
      alive = false;
    };
  }, [studio?.id, selectedDateStr]);

  const disabledDays = useMemo(() => {
    const enabledKeys = new Set(
      Object.keys(schedule || {}).filter((k) => schedule?.[k]?.enabled),
    );

    return (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (d < today) return true;
      if (enabledKeys.size === 0) return true;

      return !enabledKeys.has(getDayKeyFromDateObj(d));
    };
  }, [schedule]);

  const selectedService = useMemo(
    () =>
      services.find((s) => String(s.id) === String(selectedServiceId)) || null,
    [services, selectedServiceId],
  );

  useEffect(() => {
    setSelectedServiceId(defaultServiceId);
    setSelectedTime(null);
  }, [defaultServiceId]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!studio?.id || !selectedDateStr || !dayKey || !isDayEnabled) return;
    if (!selectedTime) return;
    if (!form.name || !form.phone) return;

    const service = selectedService || visibleServices?.[0] || null;
    if (!service?.id) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/bookings/studio/${studio.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            serviceId: service.id,
            date: selectedDateStr,
            time: selectedTime,
            duration: Number(service?.duration || studio?.slotDuration || 60),
            name: form.name,
            phone: form.phone,
          }),
        },
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.message || `Create booking failed (${res.status})`,
        );
      }

      if (onSuccess) {
        onSuccess({
          studioName: studio.name,
          serviceName: service?.name ?? "",
          date: selectedDateStr,
          time: selectedTime,
          phone: form.phone,
        });
      }

      onCancel?.();
    } catch (err) {
      console.error(err);
      alert(String(err?.message || "Не вдалося створити запис"));
    }
  }

  const canGoNext =
    Boolean(selectedServiceId) &&
    Boolean(selectedDateStr) &&
    isDayEnabled &&
    Boolean(selectedTime);

  const timeRowRef = useRef(null);

  const dateDisplay = selectedDate
    ? selectedDate.toLocaleDateString("uk-UA", {
        weekday: "short",
        day: "numeric",
        month: "long",
      })
    : "";

  const isSinglePreselected = Boolean(preselectedService?.serviceId);

  return (
    <div className="flex h-full flex-col" data-testid="booking-widget">
      <div className="mb-8 flex items-center gap-3">
        {["Послуга", "Дата & Час"].map((label, i) => {
          const done =
            (i === 0 && selectedServiceId) || (i === 1 && selectedTime);

          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300",
                  done
                    ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white"
                    : i === 0
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                      : "bg-stone-200 text-stone-500",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>

              <span
                className={cn(
                  "text-xs font-semibold tracking-wide",
                  done || i === 0 ? "text-stone-800" : "text-stone-500",
                )}
              >
                {label}
              </span>

              {i === 0 && <ChevronRight className="h-3.5 w-3.5 text-stone-300" />}
            </div>
          );
        })}
      </div>

      <div className="flex-1 space-y-8">
        <section data-testid="booking-services-section">
          <div className="mb-4">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.25em] text-amber-600">
              Крок 1
            </p>
            <h2 className="text-lg font-bold text-stone-800">Оберіть послугу</h2>
          </div>

          {visibleServices.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-stone-100 p-5 text-sm text-stone-500">
              Послуги ще не додані.
            </div>
          ) : (
            <div className="space-y-2.5">
              {visibleServices.map((service) => {
                const active = String(service.id) === String(selectedServiceId);

                return (
                  <motion.button
                    key={service.id}
                    type="button"
                    layout
                    onClick={() => {
                      if (isSinglePreselected) return;
                      setSelectedServiceId(service.id);
                      setSelectedTime(null);
                    }}
                    data-testid={`booking-service-${service.id}`}
                    className={cn(
                      "w-full rounded-2xl border p-4 text-left transition-all duration-200",
                      active
                        ? "border-emerald-600 bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-lg shadow-emerald-600/10"
                        : "border-stone-200 bg-white hover:border-amber-200 hover:bg-stone-50",
                      isSinglePreselected ? "cursor-default" : "",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            active ? "text-white" : "text-stone-800",
                          )}
                        >
                          {service.name}
                        </p>

                        <div
                          className={cn(
                            "mt-1.5 flex items-center gap-3 text-xs",
                            active ? "text-white/80" : "text-stone-500",
                          )}
                        >
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {service.duration || slotDuration} хв
                          </span>
                          <span className="font-semibold">
                            {service.price ?? 0} грн
                          </span>
                        </div>
                      </div>

                      {active && (
                        <div className="ml-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                          <Check className="h-3.5 w-3.5 text-white" />
                        </div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </section>

        <section data-testid="booking-calendar-section">
          <div className="mb-4">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.25em] text-amber-600">
              Крок 2
            </p>
            <h2 className="text-lg font-bold text-stone-800">Дата та час</h2>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-[0_4px_18px_rgba(0,0,0,0.03)] sm:p-5">
            <Calendar
              selected={selectedDate}
              onSelect={(d) => {
                if (!d) return;
                d.setHours(0, 0, 0, 0);
                setSelectedDate(d);
                setSelectedTime(null);
              }}
              disabled={disabledDays}
            />
          </div>

          {!isDayEnabled && selectedDate && (
            <p
              className="mt-3 pl-1 text-xs text-red-500"
              data-testid="booking-day-closed-msg"
            >
              У цей день студія не працює
            </p>
          )}
        </section>

        {isDayEnabled && slots.length > 0 && (
          <section data-testid="booking-time-section">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold capitalize text-stone-500">
                  {dateDisplay}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-stone-800">
                  Оберіть час{" "}
                  {busyLoading && (
                    <span className="text-amber-600">&middot; оновлення...</span>
                  )}
                </p>
              </div>

              {selectedTime && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  <Check className="h-3.5 w-3.5" />
                  {selectedTime}
                </div>
              )}
            </div>

            <div
              ref={timeRowRef}
              className="flex flex-wrap gap-2"
              data-testid="booking-time-slots"
            >
              {slots.map((time) => {
                const busy = busyTimes.has(time);
                const active = selectedTime === time;

                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => !busy && setSelectedTime(time)}
                    disabled={busy}
                    data-testid={`booking-time-${time}`}
                    className={cn(
                      "rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200",
                      active
                        ? "border-emerald-600 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-600/15"
                        : busy
                          ? "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400 line-through"
                          : "border-stone-200 bg-white text-stone-800 hover:border-amber-200 hover:bg-stone-50",
                    )}
                    title={busy ? "Зайнято" : ""}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <div className="sticky bottom-0 z-20 -mx-5 mt-6 border-t border-stone-200 bg-white px-5 py-4 sm:-mx-6 sm:px-6">
        {selectedService && selectedTime && (
          <div className="mb-3 flex items-center justify-between text-xs text-stone-500">
            <span>{selectedService.name}</span>
            <span className="font-bold text-stone-800">
              {selectedService.price} грн
            </span>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            disabled={!canGoNext}
            onClick={() => setStep("details")}
            data-testid="booking-next-btn"
            className={cn(
              "flex-1 rounded-2xl py-3.5 text-sm font-bold transition-all duration-200",
              canGoNext
                ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 active:scale-[0.98]"
                : "cursor-not-allowed bg-stone-200 text-stone-400",
            )}
          >
            <span className="inline-flex items-center gap-2">
              Далі
              <Sparkles className="h-4 w-4 opacity-80" />
            </span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            data-testid="booking-cancel-btn"
            className="rounded-2xl border border-stone-200 bg-white px-6 py-3.5 text-sm font-bold text-stone-800 transition-colors duration-200 hover:bg-stone-50 active:scale-[0.98]"
          >
            Скасувати
          </button>
        </div>
      </div>

      <AnimatePresence>
        {step === "details" && (
          <BookingCustomerForm
            form={form}
            setForm={setForm}
            onSubmit={handleSubmit}
            submitDisabled={!selectedTime || !form.name || !form.phone}
            onBack={() => {
              setForm({ name: "", phone: "" });
              setStep("pick");
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}