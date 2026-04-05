// StudioBookingWidget.jsx
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Check, ChevronRight, Sparkles } from "lucide-react";
import Calendar from "./Calendar";
import BookingCustomerForm from "./BookingCustomerForm";
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function timeToMinutes(t) {
  const [hh, mm] = String(t || "00:00")
    .split(":")
    .map(Number);
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

const ANY_MASTER_ID = "__any_master__";
const MASTER_PICK_MODE = {
  ANY: "any",
  SPECIFIC: "specific",
};

function getScheduleForDate(date, schedule, exceptions = []) {
  if (!date) return null;

  const iso = formatDateLocal(date);

  const exactException = exceptions.find(
    (item) => String(item?.date || "").slice(0, 10) === iso,
  );

  if (exactException) {
    if (!exactException.enabled) return null;

    return {
      enabled: true,
      start: exactException.start,
      end: exactException.end,
    };
  }

  const dayKey = getDayKeyFromDateObj(date);
  const fallback = schedule?.[dayKey];

  if (!fallback?.enabled) return null;
  return fallback;
}

function resolveMasterDayForDate(date, master) {
  if (!date || !master) return null;

  const masterScheduleData = getMasterSchedule(master);
  const masterExceptionsData = getMasterExceptions(master);

  const iso = formatDateLocal(date);

  const exactException = masterExceptionsData.find(
    (item) => String(item?.date || "").slice(0, 10) === iso,
  );

  // 1. Якщо є точний виняток на дату — він головний
  if (exactException) {
    if (!exactException.enabled) return null;

    return {
      enabled: true,
      start: exactException.start,
      end: exactException.end,
    };
  }

  // 2. Якщо є базовий графік — беремо його
  if (masterScheduleData && Object.keys(masterScheduleData).length > 0) {
    return getScheduleForDate(date, masterScheduleData, []);
  }

  // 3. Якщо нема ні графіка, ні винятку — повертаємо спеціальний маркер:
  // "працює за графіком студії"
  return "__USE_STUDIO_SCHEDULE__";
}

function getMasterSchedule(master) {
  if (!master) return {};

  if (
    master.schedule &&
    typeof master.schedule === "object" &&
    Object.keys(master.schedule).length > 0
  ) {
    return master.schedule;
  }

  const days = Array.isArray(master.scheduleDays) ? master.scheduleDays : [];
  const out = {};

  for (const d of days) {
    const key = weekdayEnumToKey(d.weekday || d.day);
    if (!key) continue;

    const rawStart = d.start ?? d.startTime ?? d.from ?? d.startMin;
    const rawEnd = d.end ?? d.endTime ?? d.to ?? d.endMin;

    const start =
      typeof rawStart === "string" && rawStart.includes(":")
        ? rawStart
        : minutesToTime(Number(rawStart || 0));

    const end =
      typeof rawEnd === "string" && rawEnd.includes(":")
        ? rawEnd
        : minutesToTime(Number(rawEnd || 0));

    out[key] = {
      enabled: Boolean(d.enabled),
      start,
      end,
    };
  }

  return out;
}

function getMasterExceptions(master) {
  const raw = Array.isArray(master?.scheduleExceptions)
    ? master.scheduleExceptions
    : [];

  return raw.map((item) => ({
    ...item,
    date: String(item?.date || "").slice(0, 10),
  }));
}

export default function StudioBookingWidget({
  studio,
  schedule: scheduleProp,
  scheduleExceptions: scheduleExceptionsProp,
  slotDuration: slotDurationProp,
  master,
  masterSchedule: masterScheduleProp,
  masterScheduleExceptions: masterScheduleExceptionsProp,
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
    const masterKey = master?.id ?? "no-master";
    const preKey = preselectedService?.serviceId ?? "no-pre";
    const servicesKey = services.map((s) => s.id).join("|");

    return `${studioKey}::${masterKey}::${preKey}::${servicesKey}`;
  }, [
    studio?.id,
    studio?.slug,
    master?.id,
    preselectedService?.serviceId,
    services,
  ]);

  if (!studio) return null;

  return (
    <StudioBookingWidgetInner
      key={remountKey}
      studio={studio}
      services={services}
      scheduleProp={scheduleProp}
      scheduleExceptionsProp={scheduleExceptionsProp}
      slotDurationProp={slotDurationProp}
      initialMaster={master}
      initialMasterScheduleProp={masterScheduleProp}
      initialMasterScheduleExceptionsProp={masterScheduleExceptionsProp}
      preselectedService={preselectedService}
      onCancel={onCancel}
      onSuccess={onSuccess}
    />
  );
}

function StudioBookingWidgetInner({
  studio,
  services,
  scheduleProp,
  scheduleExceptionsProp,
  slotDurationProp,
  initialMaster,
  initialMasterScheduleProp,
  initialMasterScheduleExceptionsProp,
  preselectedService,
  onCancel,
  onSuccess,
}) {
  const queryClient = useQueryClient();
  const slotDuration =
    typeof slotDurationProp === "number" && slotDurationProp > 0
      ? slotDurationProp
      : typeof studio?.slotDuration === "number" && studio.slotDuration > 0
        ? studio.slotDuration
        : 15;

  const schedule = useMemo(() => {
    if (scheduleProp && typeof scheduleProp === "object") {
      return scheduleProp;
    }

    if (studio?.schedule && typeof studio.schedule === "object") {
      return studio.schedule;
    }

    const days = Array.isArray(studio?.scheduleDays) ? studio.scheduleDays : [];
    const out = {};

    for (const d of days) {
      const key = weekdayEnumToKey(d.weekday || d.day);
      if (!key) continue;

      out[key] = {
        enabled: Boolean(d.enabled),
        start: minutesToTime(Number(d.startMin || 0)),
        end: minutesToTime(Number(d.endMin || 0)),
      };
    }

    return out;
  }, [scheduleProp, studio]);

  const scheduleExceptions = useMemo(() => {
    const raw = Array.isArray(scheduleExceptionsProp)
      ? scheduleExceptionsProp
      : Array.isArray(studio?.scheduleExceptions)
        ? studio.scheduleExceptions
        : [];

    return raw.map((item) => ({
      ...item,
      date: String(item?.date || "").slice(0, 10),
    }));
  }, [scheduleExceptionsProp, studio?.scheduleExceptions]);

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

  const [selectedDate, setSelectedDate] = useState(null);
  const [step, setStep] = useState("pick");
  const [selectedServiceId, setSelectedServiceId] = useState(
    () => defaultServiceId,
  );
  const [selectedTime, setSelectedTime] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [busyTimes, setBusyTimes] = useState(() => new Set());
  const [busyLoading, setBusyLoading] = useState(false);

  const allMasters = useMemo(() => {
    return Array.isArray(studio?.masters) ? studio.masters : [];
  }, [studio?.masters]);

  const availableMasters = useMemo(() => {
    const service = services.find(
      (s) => String(s.id) === String(selectedServiceId || defaultServiceId),
    );

    console.log("selectedServiceId", selectedServiceId);
    console.log("service", service);
    console.log("service.masters", service?.masters);
    console.log("allMasters", allMasters);

    if (!service) return allMasters;
    if (service.allMasters) return allMasters;

    const allowedIds = Array.isArray(service.masters)
      ? service.masters
          .map((m) => {
            if (typeof m === "string" || typeof m === "number") {
              return String(m);
            }

            return String(m?.id || m?.masterId || m?.master?.id || "");
          })
          .filter(Boolean)
      : [];

    console.log("allowedIds", allowedIds);

    return allMasters.filter((m) => allowedIds.includes(String(m.id)));
  }, [allMasters, services, selectedServiceId, defaultServiceId]);

  const [selectedMasterId, setSelectedMasterId] = useState(() => {
    if (initialMaster?.id) return String(initialMaster.id);
    return ANY_MASTER_ID;
  });

  useEffect(() => {
  document.body.style.overflow = "hidden";

  return () => {
    document.body.style.overflow = "";
  };
}, []);
  useEffect(() => {
    if (!availableMasters.length) {
      setSelectedMasterId(ANY_MASTER_ID);
      setMasterPickMode(MASTER_PICK_MODE.ANY);
      return;
    }

    setSelectedMasterId((prev) => {
      if (prev === ANY_MASTER_ID) return prev;

      const exists = prev
        ? availableMasters.some((m) => String(m.id) === String(prev))
        : false;

      if (exists) return prev;

      if (
        initialMaster?.id &&
        availableMasters.some((m) => String(m.id) === String(initialMaster.id))
      ) {
        return String(initialMaster.id);
      }

      return ANY_MASTER_ID;
    });

    if (
      initialMaster?.id &&
      availableMasters.some((m) => String(m.id) === String(initialMaster.id))
    ) {
      setMasterPickMode(MASTER_PICK_MODE.SPECIFIC);
    }
  }, [availableMasters, initialMaster?.id]);

  const [masterPickMode, setMasterPickMode] = useState(() => {
    if (initialMaster?.id) return MASTER_PICK_MODE.SPECIFIC;
    return MASTER_PICK_MODE.ANY;
  });

  const selectedMaster = useMemo(() => {
    if (selectedMasterId === ANY_MASTER_ID) return null;

    return (
      availableMasters.find((m) => String(m.id) === String(selectedMasterId)) ||
      null
    );
  }, [availableMasters, selectedMasterId]);

  const isAnyMasterSelected =
    masterPickMode === MASTER_PICK_MODE.ANY ||
    selectedMasterId === ANY_MASTER_ID;

  const masterSchedule = useMemo(() => {
    if (
      initialMasterScheduleProp &&
      typeof initialMasterScheduleProp === "object" &&
      initialMaster?.id &&
      selectedMaster?.id &&
      String(initialMaster.id) === String(selectedMaster.id)
    ) {
      return initialMasterScheduleProp;
    }

    return getMasterSchedule(selectedMaster);
  }, [initialMasterScheduleProp, initialMaster?.id, selectedMaster]);

  const masterScheduleExceptions = useMemo(() => {
    if (
      Array.isArray(initialMasterScheduleExceptionsProp) &&
      initialMaster?.id &&
      selectedMaster?.id &&
      String(initialMaster.id) === String(selectedMaster.id)
    ) {
      return initialMasterScheduleExceptionsProp.map((item) => ({
        ...item,
        date: String(item?.date || "").slice(0, 10),
      }));
    }

    return getMasterExceptions(selectedMaster);
  }, [initialMasterScheduleExceptionsProp, initialMaster?.id, selectedMaster]);

  function intersectSchedules(a, b) {
    if (!a?.enabled || !b?.enabled) return null;

    const start = Math.max(timeToMinutes(a.start), timeToMinutes(b.start));
    const end = Math.min(timeToMinutes(a.end), timeToMinutes(b.end));

    if (end <= start) return null;

    return {
      enabled: true,
      start: minutesToTime(start),
      end: minutesToTime(end),
    };
  }

  const selectedDateStr = useMemo(
    () => (selectedDate ? formatDateLocal(selectedDate) : null),
    [selectedDate],
  );

  const dayKey = useMemo(
    () => (selectedDate ? getDayKeyFromDateObj(selectedDate) : null),
    [selectedDate],
  );

  const dayConfig = useMemo(() => {
    if (!selectedDate) return null;

    const studioDay = getScheduleForDate(
      selectedDate,
      schedule,
      scheduleExceptions,
    );

    if (!studioDay) return null;

    if (isAnyMasterSelected) {
      const anyMasterDay = availableMasters
        .map((m) => {
          const resolvedMasterDay = resolveMasterDayForDate(selectedDate, m);

          if (!resolvedMasterDay) return null;

          if (resolvedMasterDay === "__USE_STUDIO_SCHEDULE__") {
            return studioDay;
          }

          return intersectSchedules(studioDay, resolvedMasterDay);
        })
        .filter(Boolean);

      return anyMasterDay[0] || null;
    }

    if (!selectedMaster) return null;

    const resolvedMasterDay = resolveMasterDayForDate(
      selectedDate,
      selectedMaster,
    );

    if (!resolvedMasterDay) return null;

    if (resolvedMasterDay === "__USE_STUDIO_SCHEDULE__") {
      return studioDay;
    }

    return intersectSchedules(studioDay, resolvedMasterDay);
  }, [
    selectedDate,
    schedule,
    scheduleExceptions,
    selectedMaster,
    availableMasters,
    isAnyMasterSelected,
  ]);

  const isDayEnabled = useMemo(() => {
    return Boolean(dayConfig?.enabled);
  }, [dayConfig]);

  const slots = useMemo(() => {
    if (!selectedDate || !dayConfig) return [];

    const studioDay = getScheduleForDate(
      selectedDate,
      schedule,
      scheduleExceptions,
    );
    if (!studioDay) return [];

    if (isAnyMasterSelected) {
      const unique = new Set();

      availableMasters.forEach((m) => {
        const resolvedMasterDay = resolveMasterDayForDate(selectedDate, m);

        if (!resolvedMasterDay) return;

        if (resolvedMasterDay === "__USE_STUDIO_SCHEDULE__") {
          buildSlots(studioDay.start, studioDay.end, slotDuration).forEach(
            (slot) => {
              unique.add(slot);
            },
          );
          return;
        }

        const intersection = intersectSchedules(studioDay, resolvedMasterDay);
        if (!intersection) return;

        buildSlots(intersection.start, intersection.end, slotDuration).forEach(
          (slot) => {
            unique.add(slot);
          },
        );
      });

      return Array.from(unique).sort(
        (a, b) => timeToMinutes(a) - timeToMinutes(b),
      );
    }

    const resolvedMasterDay = resolveMasterDayForDate(
      selectedDate,
      selectedMaster,
    );

    if (!resolvedMasterDay) return [];

    if (resolvedMasterDay === "__USE_STUDIO_SCHEDULE__") {
      return buildSlots(studioDay.start, studioDay.end, slotDuration);
    }

    const intersection = intersectSchedules(studioDay, resolvedMasterDay);
    if (!intersection) return [];

    return buildSlots(intersection.start, intersection.end, slotDuration);
  }, [
    selectedDate,
    dayConfig,
    isAnyMasterSelected,
    availableMasters,
    selectedMaster,
    schedule,
    scheduleExceptions,
    slotDuration,
  ]);

  const selectedService = useMemo(
    () =>
      services.find((s) => String(s.id) === String(selectedServiceId)) || null,
    [services, selectedServiceId],
  );
  
  const selectedServiceIdForBusy = selectedService?.id ?? null;

useEffect(() => {
  let alive = true;

  async function loadBusy() {
    if (!studio?.id || !selectedDateStr) return;

    setBusyLoading(true);

    try {
      const token = localStorage.getItem("token");

      const params = new URLSearchParams({
        date: selectedDateStr,
      });

      if (selectedMaster?.id) {
        params.set("masterId", String(selectedMaster.id));
      } else if (selectedServiceIdForBusy) {
        params.set("serviceId", String(selectedServiceIdForBusy));
      }

      const busyUrl = `${import.meta.env.VITE_API_URL}/bookings/studio/${studio.id}/busy?${params.toString()}`;

      const res = await fetch(busyUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

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
}, [studio?.id, selectedDateStr, selectedMaster?.id, selectedServiceIdForBusy]);

  const disabledDays = useMemo(() => {
    return (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (d < today) return true;

      const studioDay = getScheduleForDate(d, schedule, scheduleExceptions);
      if (!studioDay?.enabled) return true;

      if (isAnyMasterSelected) {
        const hasAnyAvailableMaster = availableMasters.some((m) => {
          const resolvedMasterDay = resolveMasterDayForDate(d, m);

          if (!resolvedMasterDay) return false;

          if (resolvedMasterDay === "__USE_STUDIO_SCHEDULE__") {
            return true;
          }

          return Boolean(intersectSchedules(studioDay, resolvedMasterDay));
        });

        return !hasAnyAvailableMaster;
      }

      if (!selectedMaster) return true;

      const resolvedMasterDay = resolveMasterDayForDate(d, selectedMaster);

      if (!resolvedMasterDay) return true;

      if (resolvedMasterDay === "__USE_STUDIO_SCHEDULE__") {
        return false;
      }

      return !intersectSchedules(studioDay, resolvedMasterDay);
    };
  }, [
    schedule,
    scheduleExceptions,
    selectedMaster,
    availableMasters,
    isAnyMasterSelected,
  ]);


  useEffect(() => {
    setSelectedServiceId(defaultServiceId);
    setSelectedTime(null);
  }, [defaultServiceId]);

  async function handleSubmit(e) {
    console.log("selectedMaster =", selectedMaster);
console.log("selectedMasterId =", selectedMaster?.id);
console.log("selectedDateStr =", selectedDateStr);
console.log("selectedTime =", selectedTime);
console.log("master scheduleDays =", selectedMaster?.scheduleDays);
console.log("master schedule =", selectedMaster?.schedule);
console.log("master scheduleExceptions =", selectedMaster?.scheduleExceptions);
    e.preventDefault();

    if (!studio?.id || !selectedDateStr || !dayKey || !isDayEnabled) return;
    if (!selectedTime) return;

    const service = selectedService || visibleServices?.[0] || null;
    if (!service?.id) return;

    if (masterPickMode === MASTER_PICK_MODE.SPECIFIC && !selectedMaster?.id) {
      alert("Оберіть майстра");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      if (!token || role !== "client") {
        alert("Щоб записатися, потрібно увійти як клієнт");
        return;
      }

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
            masterId: selectedMaster?.id || null,
            date: selectedDateStr,
            time: selectedTime,
          }),
        },
      );

const data = await res.json().catch(() => null);

if (!res.ok) {
  throw new Error(
    data?.message || `Create booking failed (${res.status})`,
  );
}

await queryClient.invalidateQueries({
  queryKey: ["bookings", studio.id],
});

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
    Boolean(selectedTime) &&
    (masterPickMode === MASTER_PICK_MODE.ANY || Boolean(selectedMaster?.id)) &&
    isDayEnabled;

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
    <div className="flex-1 space-y-5">
        <section data-testid="booking-services-section">
          <div className="mb-4">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.25em] text-amber-600">
              Крок 1
            </p>
            <h2 className="text-lg font-bold text-stone-800">
              Оберіть послугу
            </h2>
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
                      setMasterPickMode(MASTER_PICK_MODE.ANY);
                      setSelectedMasterId(ANY_MASTER_ID);
                      setSelectedDate(null);
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

        <section data-testid="booking-masters-section">
          <div className="mb-4">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.25em] text-amber-600">
              Крок 2
            </p>
            <h2 className="text-lg font-bold text-stone-800">
              Оберіть майстра
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setMasterPickMode(MASTER_PICK_MODE.ANY);
                setSelectedMasterId(ANY_MASTER_ID);
                setSelectedDate(null);
                setSelectedTime(null);
              }}
              className={cn(
                "flex min-h-[88px] items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-200",
                masterPickMode === MASTER_PICK_MODE.ANY
                  ? "border-emerald-600 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-600/10"
                  : "border-stone-200 bg-white hover:border-amber-200 hover:bg-stone-50",
              )}
            >
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-sm font-bold",
                  masterPickMode === MASTER_PICK_MODE.ANY
                    ? "border-white/20 bg-white/15 text-white"
                    : "border-stone-200 bg-stone-100 text-stone-600",
                )}
              >
                *
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "truncate text-sm font-semibold",
                    masterPickMode === MASTER_PICK_MODE.ANY
                      ? "text-white"
                      : "text-stone-800",
                  )}
                >
                  Будь-хто вільний
                </p>

                <p
                  className={cn(
                    "mt-1 text-xs",
                    masterPickMode === MASTER_PICK_MODE.ANY
                      ? "text-white/80"
                      : "text-stone-500",
                  )}
                >
                  Підберемо доступного майстра автоматично
                </p>
              </div>

              {masterPickMode === MASTER_PICK_MODE.ANY && (
                <div className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setMasterPickMode(MASTER_PICK_MODE.SPECIFIC);

                if (
                  selectedMasterId === ANY_MASTER_ID &&
                  availableMasters.length === 1
                ) {
                  setSelectedMasterId(String(availableMasters[0].id));
                }

                setSelectedDate(null);
                setSelectedTime(null);
              }}
              className={cn(
                "flex min-h-[88px] items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-200",
                masterPickMode === MASTER_PICK_MODE.SPECIFIC
                  ? "border-emerald-600 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-600/10"
                  : "border-stone-200 bg-white hover:border-amber-200 hover:bg-stone-50",
              )}
            >
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-sm font-bold",
                  masterPickMode === MASTER_PICK_MODE.SPECIFIC
                    ? "border-white/20 bg-white/15 text-white"
                    : "border-stone-200 bg-stone-100 text-stone-600",
                )}
              >
                ✓
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "truncate text-sm font-semibold",
                    masterPickMode === MASTER_PICK_MODE.SPECIFIC
                      ? "text-white"
                      : "text-stone-800",
                  )}
                >
                  Обрати певного майстра
                </p>

                <p
                  className={cn(
                    "mt-1 text-xs",
                    masterPickMode === MASTER_PICK_MODE.SPECIFIC
                      ? "text-white/80"
                      : "text-stone-500",
                  )}
                >
                  Самостійно виберіть спеціаліста
                </p>
              </div>

              {masterPickMode === MASTER_PICK_MODE.SPECIFIC && (
                <div className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
              )}
            </button>
          </div>

          {masterPickMode === MASTER_PICK_MODE.ANY && (
            <p className="mt-3 pl-1 text-xs text-stone-500">
              Підберемо доступного майстра автоматично
            </p>
          )}

          {masterPickMode === MASTER_PICK_MODE.SPECIFIC && (
            <div className="mt-4">
              {availableMasters.length === 0 ? (
                <div className="rounded-2xl border border-stone-200 bg-stone-100 p-5 text-sm text-stone-500">
                  Для цієї послуги немає доступних майстрів.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {availableMasters.map((item) => {
                    const active =
                      String(item.id) === String(selectedMasterId || "");

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedMasterId(String(item.id));
                          setSelectedDate(null);
                          setSelectedTime(null);
                        }}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-200",
                          active
                            ? "border-emerald-600 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-600/10"
                            : "border-stone-200 bg-white hover:border-amber-200 hover:bg-stone-50",
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border text-sm font-bold",
                            active
                              ? "border-white/20 bg-white/15 text-white"
                              : "border-stone-200 bg-stone-100 text-stone-600",
                          )}
                        >
                          {item.photoUrl ? (
                            <img
                              src={item.photoUrl}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            String(item.name || "M")
                              .trim()
                              .slice(0, 1)
                              .toUpperCase()
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "truncate text-sm font-semibold",
                              active ? "text-white" : "text-stone-800",
                            )}
                          >
                            {item.name || "Майстер"}
                          </p>

                          <p
                            className={cn(
                              "mt-1 truncate text-xs",
                              active ? "text-white/80" : "text-stone-500",
                            )}
                          >
                            {item.role || "Спеціаліст"}
                          </p>
                        </div>

                        {active && (
                          <div className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
                            <Check className="h-3.5 w-3.5 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>

        <section data-testid="booking-calendar-section">
          <div className="mb-4">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.25em] text-amber-600">
              Крок 3
            </p>
            <h2 className="text-lg font-bold text-stone-800">Дата та час</h2>
          </div>

         <div className="rounded-2xl border border-stone-200 bg-white p-3 shadow-[0_4px_18px_rgba(0,0,0,0.03)] sm:p-4">
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

          {!selectedMaster && !isAnyMasterSelected && (
            <p className="mt-3 pl-1 text-xs text-stone-500">
              Спочатку оберіть майстра
            </p>
          )}

          {masterPickMode === MASTER_PICK_MODE.ANY && (
            <p className="mt-3 pl-1 text-xs text-stone-500">
              Буде призначено доступного майстра
            </p>
          )}

          {!isDayEnabled &&
            selectedDate &&
            (masterPickMode === MASTER_PICK_MODE.ANY || selectedMaster) && (
              <p
                className="mt-3 pl-1 text-xs text-red-500"
                data-testid="booking-day-closed-msg"
              >
                У цей день майстер недоступний
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
                    <span className="text-amber-600">
                      &middot; оновлення...
                    </span>
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

     <div className="sticky bottom-0 z-20 -mx-5 mt-4 border-t border-stone-200 bg-white px-5 py-3 sm:-mx-6 sm:px-6">
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
  "flex-1 rounded-2xl py-3 text-sm font-bold transition-all duration-200",
              canGoNext
                ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 active:scale-[0.98]"
                : "cursor-not-allowed bg-stone-200 text-stone-400",
            )}
          >
            <span className="inline-flex items-center gap-2">
              Продовжити
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
  bookingDetails={{
    studioName: studio?.name || "Студія",
    address: [studio?.street, studio?.building, studio?.apartment, studio?.city]
      .filter(Boolean)
      .join(", "),
    serviceName: selectedService?.name || "—",
    masterName:
      masterPickMode === MASTER_PICK_MODE.ANY
        ? "Буде призначено автоматично"
        : selectedMaster?.name || "—",
    date: selectedDate
      ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
      : "—",
    time: selectedTime || "—",
    price:
      selectedService?.price != null ? `${selectedService.price} грн` : "—",
    duration: selectedService?.duration
      ? `${selectedService.duration} хв`
      : `${slotDuration} хв`,
  }}
  onSubmit={handleSubmit}
  onBack={() => {
    setStep("pick");
  }}
/>
        )}
      </AnimatePresence>
    </div>
  );
}
