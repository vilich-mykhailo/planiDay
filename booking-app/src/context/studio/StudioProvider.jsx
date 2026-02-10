import { useEffect, useMemo, useState } from "react";
import { StudioContext } from "./StudioContext";
import { studios as seedStudios } from "../../data/studios";

const STORAGE_KEY = "booking_app_studio_v1";

function getSeedStudio() {
  return seedStudios[0];
}

function normalizeStudio(raw) {
  const base = raw || {};

  return {
    ...base,
    services: Array.isArray(base.services) ? base.services : [],
    schedule: base.schedule ?? {},
    slotDuration:
      typeof base.slotDuration === "number" ? base.slotDuration : 15,
  };
}

export default function StudioProvider({ children }) {
  const [studio, setStudio] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return normalizeStudio(JSON.parse(raw));
      return normalizeStudio(getSeedStudio()); // seed тільки якщо storage порожній
    } catch (err) {
      console.warn("Failed to read studio from localStorage", err);
      return normalizeStudio(getSeedStudio());
    }
  });

useEffect(() => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(studio))
  } catch (err) {
    console.warn('Failed to save studio to localStorage', err)
  }
}, [studio])


  function updateStudio(patch) {
    setStudio((prev) => normalizeStudio({ ...prev, ...patch }));
  }

  function setServices(services) {
    setStudio((prev) => normalizeStudio({ ...prev, services }));
  }

  function setSchedule(schedule) {
    setStudio((prev) =>
      normalizeStudio({
        ...prev,
        schedule,
        services: Array.isArray(prev.services) ? prev.services : [],
      }),
    );
  }

 
  const value = useMemo(
    () => ({ studio, updateStudio, setServices, setSchedule }),
    [studio],
  );

  return (
    <StudioContext.Provider value={value}>{children}</StudioContext.Provider>
  );
}
