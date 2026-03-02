// StudioBookingWidget.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "../components/Calendar";
import BookingCustomerForm from "../components/BookingCustomerForm";
import "../pages/StudioDetails.css";

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
  if (s === "MON") return "mon";
  if (s === "TUE") return "tue";
  if (s === "WED") return "wed";
  if (s === "THU") return "thu";
  if (s === "FRI") return "fri";
  if (s === "SAT") return "sat";
  if (s === "SUN") return "sun";
  return null;
}

export default function StudioBookingWidget({ studio, preselectedService, onCancel }) {
  // ✅ робимо плоский список послуг з serviceCategories
  const services = useMemo(() => {
    if (Array.isArray(studio?.services)) return studio.services;

    const cats = Array.isArray(studio?.serviceCategories) ? studio.serviceCategories : [];
    return cats.flatMap((c) => (Array.isArray(c?.services) ? c.services : []));
  }, [studio]);

  const remountKey = useMemo(() => {
    const studioKey = studio?.id ?? studio?.slug ?? "no-studio";
    const preKey = preselectedService?.serviceId ?? "no-pre";
    const servicesKey = services.map((s) => s.id).join("|");
    return `${studioKey}::${preKey}::${servicesKey}`;
  }, [studio?.id, studio?.slug, preselectedService?.serviceId, services]);

  if (!studio) return <p className="text-sm text-gray-600">Студію не знайдено</p>;

  return (
    <StudioBookingWidgetInner
      key={remountKey}
      studio={studio}
      services={services}
      preselectedService={preselectedService}
      onCancel={onCancel}
    />
  );
}

function StudioBookingWidgetInner({ studio, services, preselectedService, onCancel }) {
  const navigate = useNavigate();

  const slotDuration =
    typeof studio?.slotDuration === "number" && studio.slotDuration > 0 ? studio.slotDuration : 15;

  // ✅ schedule: або вже готовий studio.schedule, або будуємо з scheduleDays (БД)
  const schedule = useMemo(() => {
    if (studio?.schedule && typeof studio.schedule === "object") return studio.schedule;

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

  const defaultServiceId = useMemo(() => {
    if (!services.length) return null;
    const wantedId = preselectedService?.serviceId;
    const exists = wantedId && services.some((s) => s.id === wantedId);
    return exists ? wantedId : (services[0]?.id ?? null);
  }, [services, preselectedService?.serviceId]);

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [step, setStep] = useState("pick");
  const [selectedServiceId, setSelectedServiceId] = useState(() => defaultServiceId);
  const [selectedTime, setSelectedTime] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "" });

  const [busyTimes, setBusyTimes] = useState(() => new Set());
  const [busyLoading, setBusyLoading] = useState(false);

  const selectedDateStr = useMemo(() => (selectedDate ? formatDateLocal(selectedDate) : null), [selectedDate]);

  const dayKey = useMemo(() => (selectedDate ? getDayKeyFromDateObj(selectedDate) : null), [selectedDate]);

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

  // ✅ тягнемо busy слоти з API при зміні дати
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
          }
        );

        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.message || `Load busy failed (${res.status})`);

        const list = Array.isArray(data?.busy) ? data.busy : [];
        if (alive) setBusyTimes(new Set(list));
      } catch (e) {
        console.error(e);
        if (alive) setBusyTimes(new Set());
      } finally {
        if (alive) setBusyLoading(false);
      }
    }

    loadBusy();
    return () => {
      alive = false;
    };
  }, [studio?.id, selectedDateStr]);

  const disabledDays = useMemo(() => {
    const enabledKeys = new Set(Object.keys(schedule || {}).filter((k) => schedule?.[k]?.enabled));

    return (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (d < today) return true;
      if (enabledKeys.size === 0) return true;

      const key = getDayKeyFromDateObj(d);
      return !enabledKeys.has(key);
    };
  }, [schedule]);

  const selectedService = useMemo(
    () => services.find((s) => s.id === selectedServiceId) || null,
    [services, selectedServiceId]
  );

  const studioAddress = [studio?.city, studio?.street, studio?.building].filter(Boolean).join(", ");

  async function handleSubmit(e) {
    e.preventDefault();

    if (!studio?.id || !selectedDateStr || !dayKey || !isDayEnabled) return;
    if (!selectedTime) return;
    if (!form.name || !form.phone) return;

    const service = selectedService || services?.[0] || null;
    if (!service?.id) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings/studio/${studio.id}`, {
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
          // masterId: null, // якщо потім додаси майстрів — передаватимеш тут
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || `Create booking failed (${res.status})`);

      navigate("/booking/success", {
        state: {
          studioName: studio.name,
          serviceName: service?.name ?? "Без назви",
          date: selectedDateStr,
          time: selectedTime,
          address: studioAddress,
          phone: form.phone,
        },
      });
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

  const submitDisabled =
    !selectedDateStr || !isDayEnabled || !selectedTime || !form.name || !form.phone;

  const timeRowRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef({ startX: 0, startScrollLeft: 0 });

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-6 flex-1">
        {/* Services */}
        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Послуга</h2>
            <p className="text-sm text-gray-600">Оберіть послугу для запису.</p>
          </div>

          {services.length === 0 ? (
            <div className="rounded-2xl border bg-gray-50 p-4 text-sm text-gray-600">
              Поки що немає доданих послуг.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {services.map((service) => {
                const active = service.id === selectedServiceId;
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => {
                      setSelectedServiceId(service.id);
                      setSelectedTime(null);
                      setStep("pick");
                    }}
                    className={[
                      "text-left rounded-2xl border p-4 transition-colors duration-200",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30",
                      active ? "!bg-black !border-black" : "bg-white border-gray-200 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    <p className={["font-medium", active ? "!text-white" : "text-gray-900"].join(" ")}>
                      {service.name}
                    </p>

                    <p className={["mt-1 text-sm", active ? "!text-white" : "text-gray-600"].join(" ")}>
                      {service.duration ? `${service.duration} хв` : `${slotDuration} хв`} • {service.price ?? 0} грн
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Calendar */}
        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Дата</h2>
            <p className="text-sm text-gray-600">Оберіть дату для запису</p>
          </div>

          <div className="rounded-2xl border bg-white p-4">
            <Calendar
              selected={selectedDate}
              onSelect={(d) => {
                if (!d) return;
                d.setHours(0, 0, 0, 0);
                setSelectedDate(d);
                setSelectedTime(null);
                setStep("pick");
              }}
              disabled={disabledDays}
            />
          </div>

          {!isDayEnabled && (
            <p className="text-sm text-red-600">У цей день студія не працює</p>
          )}
        </section>

        {/* Time */}
        <div>
          <h2 className="text-base font-semibold text-gray-900">Час</h2>
          <p className="text-sm text-gray-600">
            Оберіть вільну годину {busyLoading ? "(оновлюємо зайняті слоти...)" : ""}
          </p>
        </div>

        <div
          ref={timeRowRef}
          className="
            -mx-5 sm:mx-0
            overflow-x-auto
            px-5 sm:px-0
            pb-2
            select-none
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
          "
          onWheel={(e) => {
            if (!timeRowRef.current) return;
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
              e.preventDefault();
              timeRowRef.current.scrollLeft += e.deltaY;
            }
          }}
          onMouseDown={(e) => {
            if (!timeRowRef.current) return;
            setIsDragging(true);
            dragStateRef.current.startX = e.pageX;
            dragStateRef.current.startScrollLeft = timeRowRef.current.scrollLeft;
          }}
          onMouseMove={(e) => {
            if (!isDragging || !timeRowRef.current) return;
            e.preventDefault();
            const dx = e.pageX - dragStateRef.current.startX;
            timeRowRef.current.scrollLeft = dragStateRef.current.startScrollLeft - dx;
          }}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
        >
          <div className="flex w-max gap-2">
            {slots.map((time) => {
              const busy = busyTimes.has(time);
              const active = selectedTime === time;

              return (
                <button
                  key={time}
                  type="button"
                  onClick={() => {
                    if (busy) return;
                    setSelectedTime(time);
                    setStep("pick");
                  }}
                  disabled={busy}
                  className={[
                    "shrink-0",
                    "rounded-xl border px-4 py-2 text-sm font-medium transition-colors duration-200",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30",
                    active
                      ? "!bg-black !border-black !text-white"
                      : "bg-white border-gray-200 text-gray-900 hover:bg-gray-50",
                    busy ? "opacity-40 cursor-not-allowed line-through hover:bg-white" : "",
                  ].join(" ")}
                  title={busy ? "Цей час уже зайнятий" : ""}
                >
                  {time}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sticky actions */}
      <div
        className="
          sticky bottom-0 z-20
          -mx-5 sm:-mx-6
          mt-4
          border-t border-gray-200
          bg-white
          px-5 sm:px-6 py-4
        "
      >
        <div className="flex gap-2">
          <button
            type="button"
            className="ui-button-one w-full"
            disabled={!canGoNext}
            onClick={() => setStep("details")}
          >
            Далі
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="
              w-full sm:w-auto
              rounded-2xl border border-gray-200 bg-white
              px-4 py-3 text-sm font-extrabold text-gray-900
              hover:bg-gray-50 active:scale-[0.98] transition
            "
          >
            Скасувати
          </button>
        </div>
      </div>

      {/* Booking form */}
      {step === "details" && (
        <BookingCustomerForm
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          submitDisabled={submitDisabled}
          onBack={() => {
            setForm({ name: "", phone: "" });
            setStep("pick");
          }}
        />
      )}
    </div>
  );
}