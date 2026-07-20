// StudioBookingWidget.jsx
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Check,
  ChevronLeft,
  ChevronRight,
  UserRound,
  Sparkles,
  Users,
  Banknote,
  CalendarX2,
  Phone,
  Search,
} from "lucide-react";
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

function parseTimeToMinutes(value) {
  const time = String(value || "").trim();

  if (!/^\d{1,2}:\d{2}$/.test(time)) {
    return null;
  }

  const [hh, mm] = time.split(":").map(Number);

  if (
    !Number.isFinite(hh) ||
    !Number.isFinite(mm) ||
    hh < 0 ||
    hh > 23 ||
    mm < 0 ||
    mm > 59
  ) {
    return null;
  }

  return hh * 60 + mm;
}

function normalizeMaybeTime(value) {
  if (value == null || value === "") return "";

  if (typeof value === "string" && value.includes(":")) {
    return value;
  }

  const minutes = Number(value);

  if (!Number.isFinite(minutes)) return "";

  return minutesToTime(minutes);
}

function getBreakStart(item) {
  return normalizeMaybeTime(
    item?.breakStart ??
      item?.breakStartTime ??
      item?.breakFrom ??
      item?.pauseStart ??
      item?.pauseFrom ??
      item?.lunchStart ??
      item?.breakStartMin,
  );
}

function getBreakEnd(item) {
  return normalizeMaybeTime(
    item?.breakEnd ??
      item?.breakEndTime ??
      item?.breakTo ??
      item?.pauseEnd ??
      item?.pauseTo ??
      item?.lunchEnd ??
      item?.breakEndMin,
  );
}

function getBreakRanges(...sources) {
  return sources.flatMap((source) => {
    if (!source) return [];

    if (Array.isArray(source.breaks)) {
      return source.breaks;
    }

    const breakStart = getBreakStart(source);
    const breakEnd = getBreakEnd(source);

    const startMin = parseTimeToMinutes(breakStart);
    const endMin = parseTimeToMinutes(breakEnd);

    if (startMin == null || endMin == null || endMin <= startMin) {
      return [];
    }

    return [{ startMin, endMin }];
  });
}

function slotOverlapsBreak(slotStartMin, slotEndMin, breaks = []) {
  return breaks.some(
    (breakRange) =>
      slotStartMin < breakRange.endMin && slotEndMin > breakRange.startMin,
  );
}


function minutesToTime(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function buildSlots(
  start,
  end,
  stepMinutes,
  durationMinutes = stepMinutes,
  breaks = [],
) {
  const startM = timeToMinutes(start);
  const endM = timeToMinutes(end);

  const step = Number(stepMinutes) > 0 ? Number(stepMinutes) : 15;
  const duration =
    Number(durationMinutes) > 0 ? Number(durationMinutes) : step;

  if (endM <= startM) return [];

  const slots = [];
  let minutes = startM;

  while (minutes + duration <= endM) {
    const slotEnd = minutes + duration;

    if (!slotOverlapsBreak(minutes, slotEnd, breaks)) {
      slots.push(minutesToTime(minutes));
    }

    minutes += step;
  }

  return slots;
}

function formatDateLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function filterPastSlots(slots, selectedDate, currentTimestamp) {
  if (!selectedDate) return slots;

  const now = new Date(currentTimestamp);

  const selectedDateKey = formatDateLocal(selectedDate);
  const todayKey = formatDateLocal(now);

  if (selectedDateKey !== todayKey) {
    return slots;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return slots.filter((slot) => timeToMinutes(slot) > currentMinutes);
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

function normalizeScheduleEntry(entry) {
  if (!entry || typeof entry !== "object") return null;

  if (entry.enabled === false) return null;

  const start =
    entry.start ??
    entry.startTime ??
    entry.from ??
    entry.openTime ??
    entry.startMin;

  const end =
    entry.end ??
    entry.endTime ??
    entry.to ??
    entry.closeTime ??
    entry.endMin;

  const normalizedStart =
    typeof start === "string" && start.includes(":")
      ? start
      : Number.isFinite(Number(start))
        ? minutesToTime(Number(start))
        : "";

  const normalizedEnd =
    typeof end === "string" && end.includes(":")
      ? end
      : Number.isFinite(Number(end))
        ? minutesToTime(Number(end))
        : "";

  if (!normalizedStart || !normalizedEnd) return null;

  return {
    ...entry,
    enabled: true,
    start: normalizedStart,
    end: normalizedEnd,
    breakStart: getBreakStart(entry),
    breakEnd: getBreakEnd(entry),
  };
}

function getScheduleForDate(date, schedule, exceptions = []) {
  if (!date) return null;

  const iso = formatDateLocal(date);

  const exactException = Array.isArray(exceptions)
    ? exceptions.find((item) => String(item?.date || "").slice(0, 10) === iso)
    : null;

  if (exactException) {
    return normalizeScheduleEntry(exactException);
  }

  const dayKey = getDayKeyFromDateObj(date);
  const fallback =
    schedule && typeof schedule === "object" ? schedule?.[dayKey] : null;

  return normalizeScheduleEntry(fallback);
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
  breakStart: getBreakStart(exactException),
  breakEnd: getBreakEnd(exactException),
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
  breakStart: getBreakStart(d),
  breakEnd: getBreakEnd(d),
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
  breakStart: getBreakStart(item),
  breakEnd: getBreakEnd(item),
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
  isReschedule = false,
  rescheduleBookingId = null,
  preselectedDate = null,
  preselectedTime = null,
  bookingMode = "client",
  clients = [],
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
  const rescheduleKey = isReschedule ? `reschedule-${rescheduleBookingId || "no-id"}` : "create";
  const dateKey = preselectedDate || "no-date";
  const timeKey = preselectedTime || "no-time";
  const clientKey = Array.isArray(clients)
    ? clients.map((client) => client.id).join("|")
    : "no-clients";

  return `${studioKey}::${masterKey}::${preKey}::${servicesKey}::${rescheduleKey}::${dateKey}::${timeKey}::${bookingMode}::${clientKey}`;
}, [
  studio?.id,
  studio?.slug,
  master?.id,
  preselectedService?.serviceId,
  services,
  isReschedule,
  rescheduleBookingId,
  preselectedDate,
  preselectedTime,
  bookingMode,
  clients,
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
  isReschedule={isReschedule}
  rescheduleBookingId={rescheduleBookingId}
  preselectedDate={preselectedDate}
  preselectedTime={preselectedTime}
  bookingMode={bookingMode}
  clients={clients}
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
  isReschedule,
  rescheduleBookingId,
  preselectedDate,
  preselectedTime,
  bookingMode,
  clients,
  onCancel,
  onSuccess,
}) {
  const queryClient = useQueryClient();
  const ownerMode = bookingMode === "owner";
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
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState(
    () => defaultServiceId,
  );
  const [selectedTime, setSelectedTime] = useState(null);
  
  const [form, setForm] = useState({ name: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [busyTimes, setBusyTimes] = useState(() => new Set());
  const [busyLoading, setBusyLoading] = useState(false);
const [currentTimeTick, setCurrentTimeTick] = useState(() => Date.now());

  const visibleClients = useMemo(() => {
    const query = clientSearch.trim().toLowerCase();
    const list = Array.isArray(clients) ? clients : [];

    if (!query) return list;

    return list.filter((client) =>
      [
        client?.name,
        client?.firstName,
        client?.lastName,
        client?.phone,
        client?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [clients, clientSearch]);

  const selectedClient = useMemo(
    () =>
      (Array.isArray(clients) ? clients : []).find(
        (client) => String(client.id) === String(selectedClientId),
      ) || null,
    [clients, selectedClientId],
  );

useEffect(() => {
  const intervalId = window.setInterval(() => {
    setCurrentTimeTick(Date.now());
  }, 30_000);

  return () => {
    window.clearInterval(intervalId);
  };
}, []);
  const allMasters = useMemo(() => {
    return Array.isArray(studio?.masters) ? studio.masters : [];
  }, [studio?.masters]);

useEffect(() => {
  if (!isReschedule) return;

  if (preselectedDate) {
    const [y, m, d] = preselectedDate.split("-").map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    setSelectedDate(dt);
  }

  if (preselectedTime) {
    setSelectedTime(preselectedTime);
  }
}, [isReschedule, preselectedDate, preselectedTime]);

useEffect(() => {
  if (!isReschedule) return;

  if (initialMaster?.id) {
    setMasterPickMode(MASTER_PICK_MODE.SPECIFIC);
    setSelectedMasterId(String(initialMaster.id));
  } else {
    setMasterPickMode(MASTER_PICK_MODE.ANY);
    setSelectedMasterId(ANY_MASTER_ID);
  }
}, [isReschedule, initialMaster?.id]);

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
  breaks: getBreakRanges(a, b),
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

  const selectedService = useMemo(
  () =>
    services.find((s) => String(s.id) === String(selectedServiceId)) || null,
  [services, selectedServiceId],
);

const selectedServiceDuration = useMemo(() => {
  const duration = Number(selectedService?.duration);

  if (Number.isFinite(duration) && duration > 0) {
    return duration;
  }

  return slotDuration;
}, [selectedService?.duration, slotDuration]);

const selectedServiceIdForBusy = selectedService?.id ?? null;

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
buildSlots(
  studioDay.start,
  studioDay.end,
  slotDuration,
  selectedServiceDuration,
  getBreakRanges(studioDay),
).forEach((slot) => {
  unique.add(slot);
});
          return;
        }

        const intersection = intersectSchedules(studioDay, resolvedMasterDay);
        if (!intersection) return;

buildSlots(
  intersection.start,
  intersection.end,
  slotDuration,
  selectedServiceDuration,
  getBreakRanges(intersection),
).forEach((slot) => {
  unique.add(slot);
});
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
return buildSlots(
  studioDay.start,
  studioDay.end,
  slotDuration,
  selectedServiceDuration,
  getBreakRanges(studioDay),
);
}

    const intersection = intersectSchedules(studioDay, resolvedMasterDay);
    if (!intersection) return [];

return buildSlots(
  intersection.start,
  intersection.end,
  slotDuration,
  selectedServiceDuration,
  getBreakRanges(intersection),
);
}, [
  selectedDate,
  dayConfig,
  isAnyMasterSelected,
  availableMasters,
  selectedMaster,
  schedule,
  scheduleExceptions,
  slotDuration,
  selectedServiceDuration,
]);
const availableSlots = useMemo(() => {
  return filterPastSlots(slots, selectedDate, currentTimeTick);
}, [slots, selectedDate, currentTimeTick]);

useEffect(() => {
  if (!selectedTime) return;

  if (!availableSlots.includes(selectedTime)) {
    setSelectedTime(null);
  }
}, [availableSlots, selectedTime]);

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

if (isReschedule && rescheduleBookingId) {
  params.set("excludeBookingId", String(rescheduleBookingId));
}

if (selectedMaster?.id) {
  params.set("masterId", String(selectedMaster.id));
}

if (selectedServiceIdForBusy) {
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
}, [
  studio?.id,
  selectedDateStr,
  selectedMaster?.id,
  selectedServiceIdForBusy,
  isReschedule,
  rescheduleBookingId,
]);

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
    e?.preventDefault?.();

    if (!studio?.id || !selectedDateStr || !dayKey || !isDayEnabled) return;
    if (!selectedTime) return;

    const service = selectedService || visibleServices?.[0] || null;
    if (!service?.id) return;

    if (ownerMode && !selectedClient?.id) {
      alert("Оберіть клієнта");
      return;
    }

    if (masterPickMode === MASTER_PICK_MODE.SPECIFIC && !selectedMaster?.id) {
      alert("Оберіть майстра");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      const normalizedRole = String(role || "").toLowerCase();

      if (!token || (!ownerMode && normalizedRole !== "client")) {
        alert("Щоб записатися, потрібно увійти як клієнт");
        return;
      }

      if (ownerMode && normalizedRole !== "owner") {
        alert("Щоб створити запис, потрібно увійти як власник");
        return;
      }

const url = ownerMode
  ? `${import.meta.env.VITE_API_URL}/owner/studio/${studio.id}/manual-booking`
  : isReschedule
    ? `${import.meta.env.VITE_API_URL}/client/bookings/${rescheduleBookingId}/reschedule`
    : `${import.meta.env.VITE_API_URL}/bookings/studio/${studio.id}`;

const method = !ownerMode && isReschedule ? "PATCH" : "POST";

const res = await fetch(url, {
  method,
  headers: {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
  body: JSON.stringify({
    ...(ownerMode ? { studioClientId: selectedClient.id } : {}),
    serviceId: service.id,
    masterId: selectedMaster?.id || null,
    date: selectedDateStr,
    time: selectedTime,
  }),
});

const data = await res.json().catch(() => null);

if (!res.ok) {
  throw new Error(
    data?.message || `Create booking failed (${res.status})`,
  );
}

await queryClient.invalidateQueries({
  queryKey: ownerMode
    ? ["owner-bookings", studio.id]
    : ["client-bookings"],
});

if (onSuccess) {
  onSuccess({
    successMode: isReschedule ? "reschedule" : "create",

    studioName: studio?.name || "Студія",

    studioLogo:
      studio?.logoUrl ||
      studio?.logo ||
      "",

    address: [
      studio?.street,
      studio?.building,
      studio?.apartment,
      studio?.city,
    ]
      .filter(Boolean)
      .join(", "),

    serviceName: service?.name || "",

    masterName:
      ownerMode && data?.assignedMaster?.name
        ? data.assignedMaster.name
        : masterPickMode === MASTER_PICK_MODE.ANY
          ? "Буде призначено автоматично"
          : selectedMaster?.name || "—",

    masterPhoto:
      ownerMode && data?.assignedMaster?.photoUrl
        ? data.assignedMaster.photoUrl
        : masterPickMode === MASTER_PICK_MODE.ANY
          ? ""
          : selectedMaster?.photoUrl ||
            selectedMaster?.photo ||
            selectedMaster?.avatar ||
            "",

    date: selectedDateStr,
    time: selectedTime,

    price:
      service?.price != null
        ? `${service.price} грн`
        : "—",

    duration: service?.duration
      ? `${service.duration} хв`
      : `${slotDuration} хв`,

    clientName: ownerMode
      ? selectedClient?.name ||
        [selectedClient?.firstName, selectedClient?.lastName]
          .filter(Boolean)
          .join(" ") ||
        "Клієнт"
      : "",
  });
}

onCancel?.();
    } catch (err) {
      console.error(err);
      alert(
  String(
    err?.message ||
      (isReschedule
        ? "Не вдалося перенести запис"
        : "Не вдалося створити запис"),
  ),
);
    } finally {
      setSubmitting(false);
    }
  }

  const canGoNext =
    (!ownerMode || Boolean(selectedClientId)) &&
    Boolean(selectedServiceId) &&
    Boolean(selectedDateStr) &&
    Boolean(selectedTime) &&
    (masterPickMode === MASTER_PICK_MODE.ANY || Boolean(selectedMaster?.id)) &&
    isDayEnabled;

  const timeRowRef = useRef(null);
const clientsSectionRef = useRef(null);
const servicesSectionRef = useRef(null);
const mastersSectionRef = useRef(null);
const calendarSectionRef = useRef(null);
const timeSectionRef = useRef(null);
  const dateDisplay = selectedDate
    ? selectedDate.toLocaleDateString("uk-UA", {
        weekday: "short",
        day: "numeric",
        month: "long",
      })
    : "";

  const isSinglePreselected = Boolean(preselectedService?.serviceId);

  function scrollToSection(ref, delay = 180) {
  requestAnimationFrame(() => {
    setTimeout(() => {
      ref.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, delay);
  });
}

function scrollTimeRow(direction) {
  const container = timeRowRef.current;

  if (!container) return;

  const scrollDistance = Math.max(
    240,
    Math.round(container.clientWidth * 0.7),
  );

  container.scrollBy({
    left: direction * scrollDistance,
    behavior: "smooth",
  });
}

  return (
    <div
  className="relative flex h-full min-h-0 flex-col"
  data-testid="booking-widget"
>
   <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 pb-6 sm:px-6">
        {ownerMode && (
          <section
            ref={clientsSectionRef}
            data-testid="booking-clients-section"
          >
            <div className="mb-4">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.25em] text-amber-600">
                Крок 1
              </p>
              <h2 className="text-lg font-bold text-stone-800">
                Оберіть клієнта
              </h2>
            </div>

            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="search"
                value={clientSearch}
                onChange={(event) => setClientSearch(event.target.value)}
                placeholder="Пошук за ім’ям або телефоном"
                className="h-12 w-full rounded-2xl border border-stone-200 bg-white pl-11 pr-4 text-sm font-semibold text-stone-800 outline-none transition focus:border-[#ff6200] focus:ring-2 focus:ring-[#ff6200]/15"
              />
            </div>

            {visibleClients.length === 0 ? (
              <div className="rounded-2xl border border-stone-200 bg-stone-100 p-5 text-sm text-stone-500">
                {clients.length
                  ? "Клієнтів за запитом не знайдено."
                  : "Клієнти ще не додані."}
              </div>
            ) : (
              <div className="grid max-h-[310px] grid-cols-1 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-2">
                {visibleClients.map((client) => {
                  const active =
                    String(client.id) === String(selectedClientId);
                  const clientName =
                    client.name ||
                    [client.firstName, client.lastName]
                      .filter(Boolean)
                      .join(" ") ||
                    "Клієнт";
                  const photo =
                    client.photoUrl || client.photo || client.avatar || "";

                  return (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => {
                        setSelectedClientId(String(client.id));
                        scrollToSection(servicesSectionRef);
                      }}
                      className={cn(
                        "flex min-h-[76px] items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99]",
                        active
                          ? "border-[#ff6200] bg-[#ff6200]/5 ring-2 ring-[#ff6200]/15"
                          : "border-stone-200 bg-white hover:border-[#ff6200]/30 hover:bg-[#ff6200]/5",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border",
                          active
                            ? "border-[#ff6200] bg-white text-[#ff6200]"
                            : "border-stone-200 bg-stone-100 text-stone-500",
                        )}
                      >
                        {photo ? (
                          <img
                            src={photo}
                            alt={clientName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserRound className="h-5 w-5" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-stone-800">
                          {clientName}
                        </p>
                        <p className="mt-1 flex items-center gap-1 truncate text-xs text-stone-500">
                          <Phone className="h-3 w-3 shrink-0" />
                          {client.phone || "Телефон не вказано"}
                        </p>
                      </div>

                      <div
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                          active
                            ? "border-[#ff6200] bg-[#ff6200] text-white"
                            : "border-stone-300 bg-white text-transparent",
                        )}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        <section
          ref={servicesSectionRef}
          data-testid="booking-services-section"
        >
          <div className="mb-4">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.25em] text-amber-600">
              Крок {ownerMode ? 2 : 1}
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
    <button
      key={service.id}
      type="button"
onClick={() => {
  if (isSinglePreselected) return;
  setSelectedServiceId(service.id);
  setMasterPickMode(MASTER_PICK_MODE.ANY);
  setSelectedMasterId(ANY_MASTER_ID);
  setSelectedDate(null);
  setSelectedTime(null);

  scrollToSection(mastersSectionRef);
}}
      data-testid={`booking-service-${service.id}`}
      className={cn(
        "w-full rounded-2xl border p-4 text-left ",
active
   ? "border border-[#ff6200] bg-[#ff6200]/5 text-[#202020] ring-2 ring-[#ff6200]/15"
  : "border-stone-200 bg-white hover:border-[var(--color-cream)] hover:!bg-[#ff6200]/5",
        !isSinglePreselected && "active:scale-[0.995]",
        isSinglePreselected ? "cursor-default" : "",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-sm font-semibold transition-colors duration-150",
           active ? "text-[#202020]" : "text-stone-800",
            )}
          >
            {service.name}
          </p>

          <div
            className={cn(
              "mt-1.5 flex items-center gap-3 text-xs transition-colors duration-150",
              active ? "text-[#9a3412]" : "text-stone-500"
            )}
          >
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {service.duration || slotDuration} хв
            </span>

            <span className="flex items-center gap-1">
                 <Banknote className="h-3.5 w-3.5" />
              {service.price ?? 0} грн
            </span>
          </div>
        </div>

        <div
          className={cn(
            "ml-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border transition-all duration-150",
            active
  ? "border-[#ff6200] bg-[#ff6200] text-white"
  : "border-stone-300 bg-white text-transparent",
          )}
        >
          <Check className="h-3.5 w-3.5" />
        </div>
      </div>
    </button>
  );
})}
            </div>
          )}
        </section>
<section ref={mastersSectionRef} data-testid="booking-masters-section">
          <div className="mb-4">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.25em] text-amber-600">
              Крок {ownerMode ? 3 : 2}
            </p>
            <h2 className="text-lg font-bold text-stone-800">
              Оберіть майстра
            </h2>
          </div>

<div className="grid grid-cols-2 gap-2 sm:gap-3">
<button
  type="button"
  onClick={() => {
    setMasterPickMode(MASTER_PICK_MODE.ANY);
    setSelectedMasterId(ANY_MASTER_ID);
    setSelectedDate(null);
    setSelectedTime(null);

    scrollToSection(calendarSectionRef);
  }}
  className={cn(
    "relative flex min-h-[74px] flex-col items-center justify-center gap-1.5 rounded-[16px] border px-2.5 py-2.5 text-center transition-[border-color,box-shadow,background-color,transform] duration-150",
    "sm:min-h-[88px] sm:flex-row sm:justify-start sm:gap-3 sm:rounded-2xl sm:p-4 sm:text-left",
    masterPickMode === MASTER_PICK_MODE.ANY
      ? "border-[#ff6200] bg-[#ff6200]/5 text-[#202020] ring-2 ring-[#ff6200]/15"
      : "border-stone-200 bg-white hover:border-[#ff6200]/30 hover:bg-[#ff6200]/5",
    "active:scale-[0.985]",
  )}
>
  <div
    className={cn(
      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-bold transition-all duration-150",
      "sm:h-12 sm:w-12 sm:rounded-2xl",
      masterPickMode === MASTER_PICK_MODE.ANY
        ? "border-[#ff6200] bg-white text-[#ff6200]"
        : "border-stone-200 bg-stone-100 text-stone-600",
    )}
  >
    <Users className="h-4 w-4 sm:h-5 sm:w-5" />
  </div>

  <div className="min-w-0">
    <p
      className={cn(
        "line-clamp-2 text-[11px] font-semibold leading-[1.15] transition-colors duration-150",
        "sm:truncate sm:text-sm sm:leading-normal",
        masterPickMode === MASTER_PICK_MODE.ANY
          ? "text-[#202020]"
          : "text-stone-800",
      )}
    >
      Будь-хто вільний
    </p>
  </div>

  <div
    className={cn(
      "absolute right-2 top-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-150",
      "sm:static sm:ml-auto sm:h-6 sm:w-6",
      masterPickMode === MASTER_PICK_MODE.ANY
        ? "border-[#ff6200] bg-[#ff6200] text-white"
        : "border-stone-300 bg-white text-transparent",
    )}
  >
    <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
  </div>
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

    if (availableMasters.length === 1) {
      scrollToSection(calendarSectionRef);
    }
  }}
  className={cn(
    "relative flex min-h-[74px] flex-col items-center justify-center gap-1.5 rounded-[16px] border px-2.5 py-2.5 text-center transition-[border-color,box-shadow,background-color,transform] duration-150",
    "sm:min-h-[88px] sm:flex-row sm:justify-start sm:gap-3 sm:rounded-2xl sm:p-4 sm:text-left",
    masterPickMode === MASTER_PICK_MODE.SPECIFIC
      ? "border-[#ff6200] bg-[#ff6200]/5 text-[#202020] ring-2 ring-[#ff6200]/15"
      : "border-stone-200 bg-white hover:border-[#ff6200]/30 hover:bg-[#ff6200]/5",
    "active:scale-[0.985]",
  )}
>
  <div
    className={cn(
      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-bold transition-all duration-150",
      "sm:h-12 sm:w-12 sm:rounded-2xl",
      masterPickMode === MASTER_PICK_MODE.SPECIFIC
        ? "border-[#ff6200] bg-white text-[#ff6200]"
        : "border-stone-200 bg-stone-100 text-stone-600",
    )}
  >
    <UserRound className="h-4 w-4 sm:h-5 sm:w-5" />
  </div>

  <div className="min-w-0">
    <p
      className={cn(
        "line-clamp-2 text-[11px] font-semibold leading-[1.15] transition-colors duration-150",
        "sm:truncate sm:text-sm sm:leading-normal",
        masterPickMode === MASTER_PICK_MODE.SPECIFIC
          ? "text-[#202020]"
          : "text-stone-800",
      )}
    >
      Обрати майстра
    </p>
  </div>

  <div
    className={cn(
      "absolute right-2 top-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-150",
      "sm:static sm:ml-auto sm:h-6 sm:w-6",
      masterPickMode === MASTER_PICK_MODE.SPECIFIC
        ? "border-[#ff6200] bg-[#ff6200] text-white"
        : "border-stone-300 bg-white text-transparent",
    )}
  >
    <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
  </div>
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

  scrollToSection(calendarSectionRef);
}}
className={cn(
  "flex items-center gap-3 rounded-2xl border p-4 text-left transition-[border-color,box-shadow,background-color,transform] duration-150",
active
  ? "border border-[#ef4444] bg-[#ff6200]/5 text-[#202020] ring-2 ring-[#ef4444]/15"
  : "border-stone-200 bg-white hover:border-[var(--color-cream)] hover:bg-[var(--color-cream)]",
  "active:scale-[0.995]"
)}
                      >
<div
  className={cn(
    "flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border text-sm font-bold transition-all duration-150",
active
  ? "border-[#ff6200] bg-white text-[#ff6200] shadow-[0_4px_12px_rgba(255,98,0,0.15)]"
  : "border-stone-200 bg-stone-100 text-stone-600"
  )}
>
  {item.photoUrl ? (
    <img
      src={item.photoUrl}
      alt={item.name}
      className="h-full w-full object-cover"
    />
  ) : (
    <UserRound className="h-5 w-5" />
  )}
</div>

                        <div className="min-w-0 flex-1">
<p className={cn(
  "truncate text-sm font-semibold transition-colors duration-150",
active ? "text-[#202020]" : "text-stone-800",
)}>
                            {item.name || "Майстер"}
                          </p>

<p className={cn(
  "mt-1 truncate text-xs transition-colors duration-150",
 active ? "text-[#9a3412]" : "text-stone-500",
)}>
                            {item.role || "Спеціаліст"}
                          </p>
                        </div>

                        {active && (
<div
  className={cn(
    "ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-150",
active
  ? "border-[#ff6200] bg-[#ff6200] text-white"
  : "border-stone-300 bg-white text-transparent",
  )}
>
  <Check className="h-3.5 w-3.5" />
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

      <section ref={calendarSectionRef} data-testid="booking-calendar-section">
          <div className="mb-4">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.25em] text-amber-600">
              Крок {ownerMode ? 4 : 3}
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

  scrollToSection(timeSectionRef);
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
        
<div ref={timeSectionRef} className="scroll-mt-24">
  {isDayEnabled &&
    selectedDate &&
    slots.length > 0 &&
    availableSlots.length === 0 && (
      <div className="flex items-start gap-3 rounded-2xl border border-[#ff6200]/25 bg-[#ff6200]/5 px-4 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ff6200]/10 text-[#ff6200]">
          <CalendarX2 className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#2C2C2C]">
            На сьогодні вільного часу немає
          </p>

          <p className="mt-1 text-xs leading-5 text-stone-500">
            Оберіть іншу дату, щоб переглянути доступні години для запису.
          </p>
        </div>
      </div>
    )}

  {isDayEnabled && availableSlots.length > 0 && (
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
      </div>

<div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[44px_minmax(0,1fr)_44px]">
  {/* Стрілка ліворуч */}
  <button
    type="button"
    onClick={() => scrollTimeRow(-1)}
    className="hidden h-10 w-10 place-items-center justify-self-start rounded-full border border-[#eadfce] bg-white text-[#77716b] shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition hover:border-[#ff6200]/40 hover:bg-[#fff7f0] hover:text-[#ff6200] active:scale-95 sm:grid"
    aria-label="Прокрутити години ліворуч"
  >
    <ChevronLeft className="h-5 w-5" />
  </button>

  {/* Горизонтальний список */}
  <div
    ref={timeRowRef}
    className="
      flex min-w-0 flex-nowrap gap-2
      overflow-x-auto scroll-smooth
      pb-2

      snap-x snap-mandatory
      overscroll-x-contain
      touch-pan-x

      [-ms-overflow-style:none]
      [scrollbar-width:none]
      [&::-webkit-scrollbar]:hidden
    "
    data-testid="booking-time-slots"
  >
    {availableSlots.map((time) => {
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
            "h-10 shrink-0 snap-start rounded-xl border px-4 text-sm font-semibold transition active:scale-[0.97]",
            active
              ? "border-[#ff6200] bg-[#ff6200]/5 text-[#202020] ring-2 ring-[#ff6200]/15"
              : busy
                ? "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400 line-through"
                : "border-stone-200 bg-white text-stone-800 hover:border-[#ff6200] hover:!bg-[#ff6200]/5",
          )}
          title={busy ? "Зайнято" : ""}
        >
          {time}
        </button>
      );
    })}
  </div>

  {/* Стрілка праворуч */}
  <button
    type="button"
    onClick={() => scrollTimeRow(1)}
    className="hidden h-10 w-10 place-items-center justify-self-end rounded-full border border-[#eadfce] bg-white text-[#77716b] shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition hover:border-[#ff6200]/40 hover:bg-[#fff7f0] hover:text-[#ff6200] active:scale-95 sm:grid"
    aria-label="Прокрутити години праворуч"
  >
    <ChevronRight className="h-5 w-5" />
  </button>
</div>
    </section>
  )}
</div>
      </div>

     <div className="z-20 shrink-0 border-t border-stone-200 bg-white px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_30px_rgba(15,23,42,0.06)] sm:px-6 sm:pb-4 sm:pt-4">
        {selectedService && selectedTime && (
          <div className="mb-3 flex items-center justify-between gap-3 text-xs text-stone-500">
            <span className="min-w-0 truncate">
              {ownerMode && selectedClient
                ? `${selectedClient.name || [selectedClient.firstName, selectedClient.lastName].filter(Boolean).join(" ")} · `
                : ""}
              {selectedService.name}
            </span>
            <span className="shrink-0 font-bold text-stone-800">
              {selectedService.price} грн
            </span>
          </div>
        )}

        <div className="flex gap-1">
<button
  type="button"
  disabled={!canGoNext || submitting}
  onClick={(event) => {
    if (ownerMode) {
      setStep("confirm");
      return;
    }

    setStep("details");
  }}
  data-testid="booking-next-btn"
  className={cn(
    `
      flex-1 inline-flex items-center justify-center
      rounded-[12px] py-3
      text-sm font-semibold
      transition-all duration-300
      active:scale-[0.98]
    `,
    canGoNext && !submitting
      ? `
          border border-[#202020]
          bg-[#202020] text-white
          shadow-[0_12px_26px_rgba(15,15,15,0.18)]
          hover:scale-[1.015]
          hover:border-[#ff6200]
          hover:bg-[#ff6200]
          hover:shadow-[0_14px_30px_rgba(255,98,0,0.24)]
        `
      : `
          cursor-not-allowed
          border border-[#eadfce]
          bg-[#f1ebe4]
          text-[#aaa19a]
          shadow-none
        `,
  )}
>
  <span className="inline-flex items-center gap-2">
    {ownerMode
      ? submitting
        ? "Створюємо..."
        : "Створити запис"
      : isReschedule
        ? "Перенести запис"
        : "Продовжити"}
    <Sparkles className="h-4 w-4 opacity-80" />
  </span>
</button>

          <button
            type="button"
            onClick={onCancel}
            data-testid="booking-cancel-btn"
            className="rounded-[12px] border border-stone-200 bg-white px-6 py-3.5 text-sm font-bold text-stone-800 transition-colors duration-200 hover:!bg-[#ff6200]/5 active:scale-[0.98]"
          >
            Скасувати
          </button>
        </div>
      </div>

      <AnimatePresence>
        {!ownerMode && step === "details" && (
<BookingCustomerForm
  bookingDetails={{
    studioName: studio?.name || "Студія",

    studioLogo:
      studio?.logoUrl ||
      studio?.logo ||
      "",

    address: [
      studio?.street,
      studio?.building,
      studio?.apartment,
      studio?.city,
    ]
      .filter(Boolean)
      .join(", "),

    serviceName: selectedService?.name || "—",

    masterName:
      masterPickMode === MASTER_PICK_MODE.ANY
        ? "Буде призначено автоматично"
        : selectedMaster?.name || "—",

    masterPhoto:
      masterPickMode === MASTER_PICK_MODE.ANY
        ? ""
        : selectedMaster?.photoUrl ||
          selectedMaster?.photo ||
          selectedMaster?.avatar ||
          "",

    date: selectedDate
      ? `${selectedDate.getFullYear()}-${String(
          selectedDate.getMonth() + 1,
        ).padStart(2, "0")}-${String(
          selectedDate.getDate(),
        ).padStart(2, "0")}`
      : "—",

    time: selectedTime || "—",

    price:
      selectedService?.price != null
        ? `${selectedService.price} грн`
        : "—",

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

        {ownerMode && step === "confirm" && (
          <BookingCustomerForm
            bookingDetails={{
              studioName: studio?.name || "Студія",
              studioLogo: studio?.logoUrl || studio?.logo || "",
              address: [
                studio?.street,
                studio?.building,
                studio?.apartment,
                studio?.city,
              ]
                .filter(Boolean)
                .join(", "),
              clientName:
                selectedClient?.name ||
                [selectedClient?.firstName, selectedClient?.lastName]
                  .filter(Boolean)
                  .join(" ") ||
                "Клієнт",
              clientPhone: selectedClient?.phone || "",
              clientPhoto:
                selectedClient?.photoUrl ||
                selectedClient?.photo ||
                selectedClient?.avatar ||
                "",
              serviceName: selectedService?.name || "—",
              masterName:
                masterPickMode === MASTER_PICK_MODE.ANY
                  ? "Буде призначено автоматично"
                  : selectedMaster?.name || "—",
              masterPhoto:
                masterPickMode === MASTER_PICK_MODE.ANY
                  ? ""
                  : selectedMaster?.photoUrl ||
                    selectedMaster?.photo ||
                    selectedMaster?.avatar ||
                    "",
              date: selectedDateStr || "—",
              time: selectedTime || "—",
              price:
                selectedService?.price != null
                  ? `${selectedService.price} грн`
                  : "—",
              duration: selectedService?.duration
                ? `${selectedService.duration} хв`
                : `${slotDuration} хв`,
            }}
            submitting={submitting}
            submitLabel="Підтвердити запис"
            onSubmit={handleSubmit}
            onBack={() => setStep("pick")}
          />
        )}
      </AnimatePresence>


    </div>
  );
}
