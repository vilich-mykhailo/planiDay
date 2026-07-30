// CreateStudio.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cropper from "react-easy-crop";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  Clock,
  Coffee,
  DoorOpen,
  House,
  ImagePlus,
  Images,
  LayoutDashboard,
  MapPin,
  MapPinned,
  Phone,
  Scissors,
  Signpost,
  Tags,
  Timer,
  Users,
  X,
} from "lucide-react";

import TimeSelect from "../components/TimeSelect";
import { api } from "../api/http";

const TOTAL_STEPS = 5;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_DESCRIPTION_LENGTH = 400;

const PHONE_REGEX = /^\+380\d{9}$/;

function sanitizePhoneInput(value) {
  return String(value || "")
    .replace(/[^\d+\s()-]/g, "")
    .replace(/(?!^)\+/g, "")
    .slice(0, 20);
}

function normalizePhone(value) {
  const source = String(value || "").trim();

  if (!source.startsWith("+")) {
    return source.replace(/\D/g, "");
  }

  return `+${source.slice(1).replace(/\D/g, "")}`;
}

function getPhoneValidationError(value) {
  const source = String(value || "").trim();
  const normalizedPhone = normalizePhone(source);
  const digitsCount = normalizedPhone.replace(/\D/g, "").length;

  if (!source) {
    return "Введіть номер телефону.";
  }

  if (!normalizedPhone.startsWith("+380")) {
    return "Введіть український номер, який починається з +380.";
  }

  if (digitsCount !== 12) {
    return "Невірна кількість цифр у номері телефону.";
  }

  if (!PHONE_REGEX.test(normalizedPhone)) {
    return "Введіть коректний номер телефону.";
  }

  return "";
}

const DAYS = [
  { key: "mon", label: "Пн", full: "Понеділок" },
  { key: "tue", label: "Вт", full: "Вівторок" },
  { key: "wed", label: "Ср", full: "Середа" },
  { key: "thu", label: "Чт", full: "Четвер" },
  { key: "fri", label: "Пт", full: "П’ятниця" },
  { key: "sat", label: "Сб", full: "Субота" },
  { key: "sun", label: "Нд", full: "Неділя" },
];

const DEFAULT_SLOT_DURATION = 10;

function defaultDay(enabled = true) {
  return {
    enabled,
    start: "08:00",
    end: "18:00",
    breakStart: "",
    breakEnd: "",
  };
}

function getDefaultSchedule() {
  return {
    mon: defaultDay(),
    tue: defaultDay(),
    wed: defaultDay(),
    thu: defaultDay(),
    fri: defaultDay(),
    sat: defaultDay(false),
    sun: defaultDay(false),
  };
}

function timeToMinutes(value) {
  const [hours, minutes] = String(value || "")
    .split(":")
    .map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return Number.NaN;
  }

  return hours * 60 + minutes;
}

function minutesToTime(total) {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getBreakStart(item) {
  return item?.breakStart || "";
}

function getBreakEnd(item) {
  return item?.breakEnd || "";
}

function getDefaultBreakForItem(item) {
  const startMinutes = timeToMinutes(item?.start);
  const endMinutes = timeToMinutes(item?.end);
  const preferredStart = timeToMinutes("12:00");
  const preferredEnd = timeToMinutes("13:00");

  if (
    Number.isFinite(startMinutes) &&
    Number.isFinite(endMinutes) &&
    startMinutes < preferredStart &&
    preferredEnd < endMinutes
  ) {
    return { breakStart: "12:00", breakEnd: "13:00" };
  }

  const duration = endMinutes - startMinutes;

  if (Number.isFinite(duration) && duration >= 30) {
    const breakLength = Math.min(
      60,
      Math.max(10, Math.floor(duration / 4 / 5) * 5),
    );
    const breakStart =
      startMinutes +
      Math.max(5, Math.floor((duration - breakLength) / 2 / 5) * 5);
    const breakEnd = Math.min(endMinutes - 5, breakStart + breakLength);

    if (
      startMinutes < breakStart &&
      breakStart < breakEnd &&
      breakEnd < endMinutes
    ) {
      return {
        breakStart: minutesToTime(breakStart),
        breakEnd: minutesToTime(breakEnd),
      };
    }
  }

  return { breakStart: "12:00", breakEnd: "13:00" };
}

function withBreakState(item, enabled) {
  if (!enabled) {
    return { ...item, breakStart: "", breakEnd: "" };
  }

  const breakStart = getBreakStart(item);
  const breakEnd = getBreakEnd(item);

  if (breakStart && breakEnd) {
    return { ...item, breakStart, breakEnd };
  }

  return { ...item, ...getDefaultBreakForItem(item) };
}

function getInvalidScheduleFields(item) {
  if (!item?.enabled) return [];

  const startMinutes = timeToMinutes(item.start);
  const endMinutes = timeToMinutes(item.end);

  if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes)) {
    return ["start", "end"];
  }

  if (endMinutes <= startMinutes) {
    return ["start", "end"];
  }

  const breakStart = getBreakStart(item);
  const breakEnd = getBreakEnd(item);

  if (!breakStart && !breakEnd) return [];
  if (!breakStart || !breakEnd) return ["breakStart", "breakEnd"];

  const breakStartMinutes = timeToMinutes(breakStart);
  const breakEndMinutes = timeToMinutes(breakEnd);

  if (
    !Number.isFinite(breakStartMinutes) ||
    !Number.isFinite(breakEndMinutes) ||
    !(
      startMinutes < breakStartMinutes &&
      breakStartMinutes < breakEndMinutes &&
      breakEndMinutes < endMinutes
    )
  ) {
    return ["breakStart", "breakEnd"];
  }

  return [];
}

function isScheduleItemValid(item) {
  return getInvalidScheduleFields(item).length === 0;
}
const PHOTON_API_URL =
  import.meta.env.VITE_PHOTON_API_URL || "https://photon.komoot.io/api/";
const LOCATION_SEARCH_DEBOUNCE_MS = 350;

const SETTLEMENT_KIND_LABELS = {
  city: "Місто",
  town: "Місто",
  village: "Село",
  hamlet: "Селище",
  locality: "Населений пункт",
  isolated_dwelling: "Населений пункт",
};

const LATIN_KEYBOARD_KEYS = "qwertyuiop[]asdfghjkl;'zxcvbnm,.`";
const UKRAINIAN_KEYBOARD_KEYS = "йцукенгшщзхїфівапролджєячсмитьбюґ";

const CATEGORIES = [
  { value: "hair", label: "Перукарня" },
  { value: "barber", label: "Барбершоп" },
  { value: "beauty_salon", label: "Салон краси" },
  { value: "nails", label: "Манікюр і педикюр" },
  { value: "brows_lashes", label: "Брови та вії" },
  { value: "cosmetology", label: "Косметологія" },
  { value: "makeup", label: "Макіяж" },
  { value: "massage", label: "Масаж" },
  { value: "physiotherapy", label: "Фізіотерапія" },
  { value: "depilation", label: "Депіляція" },
  { value: "tattoo_piercing", label: "Тату і пірсинг" },
  { value: "spa", label: "SPA і wellness" },
  { value: "health", label: "Здоровʼя" },
  { value: "fitness_diet", label: "Тренування і дієта" },
  { value: "dentistry", label: "Стоматологія" },
  { value: "podiatry", label: "Подологія" },
  { value: "aesthetic_medicine", label: "Естетична медицина" },
  { value: "natural_medicine", label: "Натуральна медицина" },
  { value: "psychotherapy", label: "Психотерапія" },
  { value: "pets", label: "Тварини" },
  { value: "finance", label: "Фінансові послуги" },
  { value: "shopping", label: "Покупки" },
  { value: "auto", label: "Автосервіс" },
  { value: "other", label: "Інше" },
].sort((first, second) => first.label.localeCompare(second.label, "uk"));

const STEP_CONTENT = {
  1: {
    title: "Створіть свою студію",
    description: "Додайте назву, логотип та обкладинку студії",
    icon: Building2,
  },
2: {
  title: "Оберіть категорію студії",
  description: "Виберіть категорію для вашої студії",
  icon: Tags,
},
  3: {
    title: "Номер телефону",
    description: "Вкажіть номер для зв’язку з клієнтами",
    icon: Phone,
  },
  4: {
    title: "Адреса студії",
    description: "Додайте адресу, щоб клієнти могли вас знайти",
    icon: MapPin,
  },
  5: {
    title: "Графік студії",
    description: "Налаштуйте робочі дні, години роботи та перерви",
    icon: CalendarDays,
  },
};

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function cleanPlacePart(value) {
  return String(value || "").trim();
}

function createSavedCitySelection(value) {
  const name = cleanPlacePart(value);

  return name
    ? {
        id: `saved-${normalizeCityMatch(name)}`,
        name,
        state: "",
        county: "",
        district: "",
      }
    : null;
}

function normalizeCityMatch(value) {
  return cleanPlacePart(value)
    .toLocaleLowerCase("uk")
    .replace(/[ії]/g, "и")
    .replace(/[ы]/g, "и")
    .replace(/[єэ]/g, "е")
    .replace(/[ґ]/g, "г")
    .replace(/[ё]/g, "о")
    .replace(/[ьъ’'`\s-]/g, "");
}

function cityEditDistance(first, second) {
  if (!first) return second.length;
  if (!second) return first.length;

  const row = Array.from({ length: second.length + 1 }, (_, index) => index);

  for (let firstIndex = 1; firstIndex <= first.length; firstIndex += 1) {
    let diagonal = row[0];
    row[0] = firstIndex;

    for (
      let secondIndex = 1;
      secondIndex <= second.length;
      secondIndex += 1
    ) {
      const above = row[secondIndex];
      const left = row[secondIndex - 1];
      const substitution =
        diagonal +
        (first[firstIndex - 1] === second[secondIndex - 1] ? 0 : 1);

      row[secondIndex] = Math.min(above + 1, left + 1, substitution);
      diagonal = above;
    }
  }

  return row[second.length];
}

function getCityMatchScore(search, candidate) {
  const normalizedSearch = normalizeCityMatch(search);
  const normalizedCandidate = normalizeCityMatch(candidate);

  if (!normalizedSearch || !normalizedCandidate) return 0;
  if (normalizedCandidate === normalizedSearch) return 100;
  if (normalizedCandidate.startsWith(normalizedSearch)) {
    return 90 - Math.min(normalizedCandidate.length - normalizedSearch.length, 20);
  }
  if (normalizedCandidate.includes(normalizedSearch)) return 75;

  const distance = cityEditDistance(normalizedSearch, normalizedCandidate);
  const similarity =
    1 - distance / Math.max(normalizedSearch.length, normalizedCandidate.length);

  return Math.max(0, similarity * 70);
}

function hasConfidentCityMatch(search, suggestions) {
  return suggestions.some(
    (suggestion) => getCityMatchScore(search, suggestion.name) >= 58,
  );
}

function convertLatinKeyboardToUkrainian(value) {
  return value
    .toLocaleLowerCase("uk")
    .split("")
    .map((character) => {
      const index = LATIN_KEYBOARD_KEYS.indexOf(character);
      return index >= 0 ? UKRAINIAN_KEYBOARD_KEYS[index] : character;
    })
    .join("");
}

function buildCityFallbackQueries(value) {
  const source = cleanPlacePart(value).toLocaleLowerCase("uk");
  const variants = [];

  if (/[а-яіїєґыэёъ]/i.test(source)) {
    const simplified = source
      .replace(/ы/g, "и")
      .replace(/э/g, "е")
      .replace(/ё/g, "о")
      .replace(/ъ/g, "")
      .replace(/[’'`]/g, "");

    variants.push(
      simplified.replace(/[ії]/g, "и").replace(/є/g, "е").replace(/ґ/g, "г"),
      simplified.replace(/[иї]/g, "і").replace(/є/g, "е").replace(/ґ/g, "г"),
    );
  } else if (/^[a-z[\];',.`\s-]+$/i.test(source)) {
    variants.push(convertLatinKeyboardToUkrainian(source));
  }

  return [...new Set(variants)]
    .filter((variant) => variant && variant !== source)
    .slice(0, 2);
}

function formatPhotonSettlement(feature, index) {
  const properties = feature?.properties || {};
  const name = cleanPlacePart(
    properties.name || properties.city || properties.locality,
  );

  if (!name) return null;

  const state = cleanPlacePart(properties.state);
  const county = cleanPlacePart(properties.county);
  const district = cleanPlacePart(properties.district);
  const region = state || county || district;
  const subregion =
    [county, district].find(
      (part) => part && part !== name && part !== region,
    ) || "";
  const kindKey = cleanPlacePart(
    properties.osm_value || properties.type,
  ).toLowerCase();
  const kind = SETTLEMENT_KIND_LABELS[kindKey];

  if (!kind) return null;

  const valueParts = [name, subregion, region].filter(
    (part, partIndex, parts) =>
      part && parts.findIndex((item) => item === part) === partIndex,
  );
  const detailParts = [state, county, district].filter(
    (part, partIndex, parts) =>
      part &&
      part !== name &&
      parts.findIndex((item) => item === part) === partIndex,
  );

  return {
    id: `${properties.osm_type || "place"}-${properties.osm_id || index}`,
    name,
    label: valueParts.join(", "),
    kind,
    details: detailParts.join(" · "),
    state,
    county,
    district,
  };
}

function rankCitySuggestions(search, suggestions) {
  const seen = new Set();

  return suggestions
    .filter(Boolean)
    .filter((item) => {
      const key = `${item.label}|${item.details}`.toLocaleLowerCase("uk");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort(
      (first, second) =>
        getCityMatchScore(search, second.name) -
        getCityMatchScore(search, first.name),
    )
    .slice(0, 10);
}

function normalizeStreetMatch(value) {
  const withoutType = cleanPlacePart(value)
    .toLocaleLowerCase("uk")
    .replace(
      /^(?:вулиця|вул\.?|проспект|просп\.?|провулок|пров\.?|площа|майдан|бульвар|узвіз|шосе|набережна|алея|проїзд|дорога|тупик)\s+/iu,
      "",
    )
    .replace(
      /\s+(?:вулиця|вул\.?|проспект|просп\.?|провулок|пров\.?|площа|майдан|бульвар|узвіз|шосе|набережна|алея|проїзд|дорога|тупик)$/iu,
      "",
    );

  return normalizeCityMatch(withoutType);
}

function getStreetMatchScore(search, candidate) {
  const normalizedSearch = normalizeStreetMatch(search);
  const normalizedCandidate = normalizeStreetMatch(candidate);

  if (!normalizedSearch || !normalizedCandidate) return 0;
  if (normalizedCandidate === normalizedSearch) return 100;
  if (normalizedCandidate.startsWith(normalizedSearch)) {
    return 90 - Math.min(normalizedCandidate.length - normalizedSearch.length, 20);
  }
  if (normalizedCandidate.includes(normalizedSearch)) return 75;

  const distance = cityEditDistance(normalizedSearch, normalizedCandidate);
  const similarity =
    1 - distance / Math.max(normalizedSearch.length, normalizedCandidate.length);

  return Math.max(0, similarity * 70);
}

function hasConfidentStreetMatch(search, suggestions) {
  return suggestions.some(
    (suggestion) => getStreetMatchScore(search, suggestion.name) >= 58,
  );
}

function formatPhotonStreet(feature, index) {
  const properties = feature?.properties || {};
  const name = cleanPlacePart(properties.name || properties.street);

  if (!name) return null;

  const city = cleanPlacePart(
    properties.city ||
      properties.locality ||
      properties.town ||
      properties.village,
  );
  const district = cleanPlacePart(properties.district);
  const county = cleanPlacePart(properties.county);
  const state = cleanPlacePart(properties.state);
  const detailParts = [city, district, county, state].filter(
    (part, partIndex, parts) =>
      part &&
      part !== name &&
      parts.findIndex((item) => item === part) === partIndex,
  );
  const identityParts = [name, city, state].filter(Boolean);

  return {
    id: `${properties.osm_type || "street"}-${properties.osm_id || index}`,
    name,
    identity: identityParts.join("|"),
    details: detailParts.join(" · "),
    city,
    district,
    county,
    state,
  };
}

function streetBelongsToSelectedCity(street, selectedCity) {
  if (!selectedCity?.name || !street?.city) return false;

  if (
    normalizeCityMatch(street.city) !== normalizeCityMatch(selectedCity.name)
  ) {
    return false;
  }

  for (const part of ["state", "county"]) {
    if (
      selectedCity[part] &&
      normalizeCityMatch(selectedCity[part]) !==
        normalizeCityMatch(street[part])
    ) {
      return false;
    }
  }

  return true;
}

function rankStreetSuggestions(search, suggestions) {
  const seen = new Set();

  return suggestions
    .filter(Boolean)
    .filter((item) => {
      const key = item.identity.toLocaleLowerCase("uk");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort(
      (first, second) =>
        getStreetMatchScore(search, second.name) -
        getStreetMatchScore(search, first.name),
    )
    .slice(0, 10);
}

async function compressImage(
  file,
  {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.82,
    type = "image/jpeg",
  } = {},
) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = image.naturalWidth || image.width;
      let height = image.naturalHeight || image.height;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);

        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Не вдалося обробити обкладинку."));
        return;
      }

      context.drawImage(image, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Не вдалося стиснути обкладинку."));
            return;
          }

          resolve(
            new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
              type,
              lastModified: Date.now(),
            }),
          );
        },
        type,
        quality,
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Не вдалося прочитати зображення."));
    };

    image.src = objectUrl;
  });
}

async function getCroppedImage(imageSrc, cropPixels) {
  const image = new window.Image();
  image.src = imageSrc;

  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  const safeCrop = cropPixels || {
    x: 0,
    y: 0,
    width: image.naturalWidth || image.width,
    height: image.naturalHeight || image.height,
  };

  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 900;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Не вдалося обробити логотип.");
  }

  context.drawImage(
    image,
    safeCrop.x,
    safeCrop.y,
    safeCrop.width,
    safeCrop.height,
    0,
    0,
    900,
    900,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Не вдалося обрізати логотип."));
          return;
        }

        resolve(
          new File([blob], "studio-logo.jpg", {
            type: "image/jpeg",
            lastModified: Date.now(),
          }),
        );
      },
      "image/jpeg",
      0.82,
    );
  });
}

async function uploadStudioImage(studioId, file, kind, token) {
  const formData = new FormData();
  formData.append("file", file);

  const apiBaseUrl = String(import.meta.env.VITE_API_URL || "").replace(
    /\/$/,
    "",
  );

  const response = await fetch(
    `${apiBaseUrl}/media/studio-${kind}/${studioId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    },
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        (kind === "cover"
          ? "Не вдалося завантажити обкладинку."
          : "Не вдалося завантажити логотип."),
    );
  }

  if (!data?.key) {
    throw new Error(
      "Сервер не повернув адресу завантаженого зображення.",
    );
  }

  return data.key;
}

function BackButton({ onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-[52px] items-center justify-center gap-2 rounded-[15px] border border-[#eadfce] bg-white px-5 text-[13px] font-black text-[#202020] transition-all duration-300 hover:border-[#ff6200] hover:text-[#ff6200] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
    >
      <ChevronLeft className="h-4 w-4" />
      Назад
    </button>
  );
}

function ContinueButton({
  children = "Продовжити",
  disabled = false,
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="group inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[15px] bg-[#202020] px-4 text-[14px] font-black text-white transition-all duration-300 hover:scale-[1.015] hover:bg-[#ff6200] active:scale-[0.98] disabled:pointer-events-none disabled:bg-[#f1ebe4] disabled:text-[#aaa19a] disabled:shadow-none"
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
    </button>
  );
}

function ErrorMessage({ children }) {
  if (!children) return null;

  return (
    <div className="rounded-[15px] border border-[#ef4444]/20 bg-[#fff1f1] px-4 py-3 text-[12px] font-semibold leading-5 text-[#ef4444]">
      {children}
    </div>
  );
}

function Toggle({ checked }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-7 w-12 items-center rounded-full",
        checked
          ? "bg-gradient-to-r from-[#22c55e] to-[#16a34a]"
          : "bg-[#d8d2ca]",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </span>
  );
}

function TimeField({ children, className = "" }) {
  const fieldRef = useRef(null);

  function handleClick(event) {
    const clickedControl = event.target.closest(
      "button,input,[role='button']",
    );

    if (clickedControl && fieldRef.current?.contains(clickedControl)) {
      return;
    }

    const control =
      fieldRef.current?.querySelector("button,input,[role='button']") ||
      fieldRef.current?.firstElementChild;

    control?.focus?.();
    control?.click?.();
  }

  return (
    <div
      ref={fieldRef}
      onClick={handleClick}
      className={cn("cursor-pointer", className)}
    >
      {children}
    </div>
  );
}

function CategorySelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const listId = "studio-category-options";
  const selectedCategory = CATEGORIES.find((item) => item.value === value);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function selectCategory(nextValue) {
    onChange(nextValue);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex h-12 w-full items-center gap-3 rounded-[15px] border bg-white px-3.5 text-left transition-all duration-200",
          "hover:border-[#ffd6bd] focus:outline-none focus:ring-4 focus:ring-[#ff6200]/10",
          open
            ? "border-[#ff6200]"
            : "border-[#eadfce]",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        autoFocus
      >
        <span
          className={cn(
            "grid h-8 w-8 shrink-0 place-items-center rounded-[10px] transition-colors",
            open || selectedCategory
              ? "bg-[#fff1e8] text-[#ff6200]"
              : "bg-[#f5f1ec] text-[#8a847d]",
          )}
        >
          <Tags className="h-[17px] w-[17px]" />
        </span>

        <span
          className={cn(
            "min-w-0 flex-1 truncate text-[13px] font-bold",
            selectedCategory ? "text-[#202020]" : "text-[#9a928a]",
          )}
        >
          {selectedCategory?.label || "Оберіть категорію"}
        </span>

        <ChevronDown
          className={cn(
            "h-[18px] w-[18px] shrink-0 text-[#ff6200] transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-[18px] border border-[#eadbc9] bg-white shadow-[0_20px_55px_rgba(17,17,17,0.14)]">
          <div
            id={listId}
            role="listbox"
            className="max-h-[260px] overflow-y-auto p-1.5"
          >
            {CATEGORIES.map((item) => {
              const isSelected = item.value === value;

              return (
                <button
                  key={item.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => selectCategory(item.value)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors",
                    isSelected
                      ? "bg-[#fff1e8] text-[#ff6200]"
                      : "text-[#202020] hover:bg-[#fff7f1]",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-[9px]",
                      isSelected
                        ? "bg-[#ff6200] text-white"
                        : "bg-[#f5f1ec] text-[#8a847d]",
                    )}
                  >
                    {isSelected ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Tags className="h-3.5 w-3.5" />
                    )}
                  </span>

                  <span className="min-w-0 flex-1 truncate text-[13px] font-bold">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CityAutocomplete({
  value,
  onChange,
  selectionValid,
  className = "",
}) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const requestRef = useRef(null);
  const requestSequenceRef = useRef(0);
  const blurTimerRef = useRef(null);
  const listId = "studio-city-suggestions";

  useEffect(() => {
    const search = query.trim();
    const requestId = ++requestSequenceRef.current;

    requestRef.current?.abort();

    if (!hasInteracted || search.length < 2) {
      setSuggestions([]);
      setLoading(false);
      setError("");
      setOpen(false);
      return undefined;
    }

    const controller = new AbortController();
    requestRef.current = controller;
    setSuggestions([]);
    setLoading(true);
    setError("");
    setOpen(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        async function loadSettlements(searchValue) {
          const url = new URL(PHOTON_API_URL, window.location.origin);
          url.searchParams.set("q", searchValue);
          url.searchParams.set("lang", "default");
          url.searchParams.set("limit", "10");
          url.searchParams.set("countrycode", "UA");
          url.searchParams.append("layer", "city");
          url.searchParams.append("layer", "locality");

          const response = await fetch(url.toString(), {
            signal: controller.signal,
            headers: { Accept: "application/json" },
          });

          if (!response.ok) {
            throw new Error(`City search failed: ${response.status}`);
          }

          const payload = await response.json();
          return (payload?.features || [])
            .map(formatPhotonSettlement)
            .filter(Boolean);
        }

        let nextSuggestions = await loadSettlements(search);

        if (
          !/^[a-z]/i.test(search) ||
          nextSuggestions.length === 0
        ) {
          for (const fallbackQuery of buildCityFallbackQueries(search)) {
            if (hasConfidentCityMatch(search, nextSuggestions)) break;

            try {
              const fallbackSuggestions =
                await loadSettlements(fallbackQuery);
              nextSuggestions = [
                ...nextSuggestions,
                ...fallbackSuggestions,
              ];
            } catch (fallbackError) {
              if (fallbackError?.name === "AbortError") throw fallbackError;
              if (!nextSuggestions.length) throw fallbackError;
              break;
            }
          }
        }

        nextSuggestions = rankCitySuggestions(search, nextSuggestions);

        if (requestId !== requestSequenceRef.current) return;

        setSuggestions(nextSuggestions);
        setActiveIndex(0);
        setOpen(true);
      } catch (searchError) {
        if (
          searchError?.name === "AbortError" ||
          requestId !== requestSequenceRef.current
        ) {
          return;
        }

        setSuggestions([]);
        setError(
          "Не вдалося завантажити населені пункти. Перевірте інтернет і спробуйте ще раз.",
        );
        setOpen(true);
      } finally {
        if (requestId === requestSequenceRef.current) {
          setLoading(false);
        }
      }
    }, LOCATION_SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [hasInteracted, query]);

  useEffect(() => {
    return () => {
      requestRef.current?.abort();
      if (blurTimerRef.current) {
        window.clearTimeout(blurTimerRef.current);
      }
    };
  }, []);

  function selectSuggestion(suggestion) {
    requestRef.current?.abort();
    requestSequenceRef.current += 1;
    setQuery(suggestion.name);
    onChange(suggestion.name, suggestion);
    setSuggestions([]);
    setLoading(false);
    setError("");
    setOpen(false);
    setHasInteracted(false);
  }

  function handleInputChange(event) {
    const nextValue = event.target.value;
    setQuery(nextValue);
    onChange(nextValue, null);
    setHasInteracted(true);
    setActiveIndex(0);
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }

    if (!suggestions.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => (current + 1) % suggestions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(
        (current) => (current - 1 + suggestions.length) % suggestions.length,
      );
      return;
    }

    if (event.key === "Enter" && open) {
      event.preventDefault();
      selectSuggestion(suggestions[activeIndex] || suggestions[0]);
    }
  }

  function clearQuery() {
    requestRef.current?.abort();
    requestSequenceRef.current += 1;
    setQuery("");
    onChange("", null);
    setSuggestions([]);
    setLoading(false);
    setError("");
    setOpen(false);
    setHasInteracted(true);
  }

  const showResults = open && hasInteracted && query.trim().length >= 2;

  return (
    <div>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#ff5a00]" />

        <input
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (hasInteracted && query.trim().length >= 2) setOpen(true);
          }}
          onBlur={() => {
            blurTimerRef.current = window.setTimeout(() => setOpen(false), 120);
          }}
          placeholder="Почніть вводити населений пункт"
          className={cn(className, "pl-11 pr-11")}
autoComplete="off"
autoCapitalize="words"
spellCheck
role="combobox"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={showResults}
          aria-activedescendant={
            showResults && suggestions[activeIndex]
              ? `${listId}-${activeIndex}`
              : undefined
          }
          aria-busy={loading}
        />

        {loading ? (
          <span
            className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin rounded-full border-2 border-[#ffd6bd] border-t-[#ff5a00]"
            aria-hidden="true"
          />
        ) : query ? (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={clearQuery}
            className="absolute right-2.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-[#9b948c] transition hover:bg-[#fff1e8] hover:text-[#ff5a00]"
            aria-label="Очистити місто"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {query && selectionValid ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[#218358]">
          <Check className="h-3.5 w-3.5" />
          Населений пункт вибрано зі списку.
        </p>
      ) : (
        <p className="mt-2 text-xs font-medium text-[#77716b]">
          Виберіть населений пункт зі списку.
        </p>
      )}

      {showResults && (
        <div className="mt-2 overflow-hidden rounded-2xl border border-[#eadbc9] bg-white shadow-[0_18px_45px_rgba(17,17,17,0.12)]">
          <div
            id={listId}
            role="listbox"
            className="max-h-[min(16rem,38dvh)] overflow-y-auto py-1.5"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm font-bold text-[#77716b]">
                <span
                  className="h-5 w-5 animate-spin rounded-full border-2 border-[#ffd6bd] border-t-[#ff5a00]"
                  aria-hidden="true"
                />
                Шукаємо населені пункти…
              </div>
            ) : error ? (
              <div className="px-4 py-5 text-center text-sm font-semibold leading-5 text-[#e5484d]">
                {error}
              </div>
            ) : suggestions.length ? (
              suggestions.map((suggestion, index) => {
                const isActive = index === activeIndex;

                return (
                  <button
                    id={`${listId}-${index}`}
                    key={suggestion.id}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectSuggestion(suggestion)}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
                      isActive ? "bg-[#fff1e8]" : "hover:bg-[#fff7f0]",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                        isActive
                          ? "bg-[#ff5a00] text-white"
                          : "bg-[#fff1e8] text-[#ff5a00]",
                      )}
                    >
                      <MapPinned className="h-4.5 w-4.5" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-black text-[#202020]">
                          {suggestion.name}
                        </span>
                        <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wide text-[#ff5a00]">
                          {suggestion.kind}
                        </span>
                      </span>

                      <span className="mt-0.5 block truncate text-xs font-medium text-[#77716b]">
                        {suggestion.details || "Україна"}
                      </span>
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-5 text-center">
                <p className="text-sm font-black text-[#202020]">
                  Нічого не знайдено
                </p>
                <p className="mt-1 text-xs font-medium text-[#77716b]">
                  Спробуйте коротшу назву або інше написання.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-[#f0e7da] bg-[#fbfaf8] px-4 py-2 text-right">
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer"
              onMouseDown={(event) => event.preventDefault()}
              className="text-[10px] font-bold text-[#9b948c] hover:text-[#ff5a00]"
            >
              Дані © OpenStreetMap
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function StreetAutocomplete({
  value,
  city,
  citySelection,
  onChange,
  className = "",
}) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const requestRef = useRef(null);
  const requestSequenceRef = useRef(0);
  const blurTimerRef = useRef(null);
  const listId = "studio-street-suggestions";
  const cityContext = cleanPlacePart(citySelection?.name || city)
    .split(",")[0]
    .trim();
  const hasVerifiedCity = Boolean(
    citySelection?.name &&
      normalizeCityMatch(citySelection.name) === normalizeCityMatch(city),
  );

  useEffect(() => {
    const search = query.trim();
    const requestId = ++requestSequenceRef.current;

    requestRef.current?.abort();

    if (!hasVerifiedCity || !hasInteracted || search.length < 2) {
      setSuggestions([]);
      setLoading(false);
      setError("");
      setOpen(false);
      return undefined;
    }

    const controller = new AbortController();
    requestRef.current = controller;
    setSuggestions([]);
    setLoading(true);
    setError("");
    setOpen(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        async function loadStreets(searchValue) {
          const url = new URL(PHOTON_API_URL, window.location.origin);
          const contextualQuery = cityContext
            ? `${searchValue}, ${cityContext}`
            : searchValue;

          url.searchParams.set("q", contextualQuery);
          url.searchParams.set("lang", "default");
          url.searchParams.set("limit", "20");
          url.searchParams.set("countrycode", "UA");
          url.searchParams.append("layer", "street");

          const response = await fetch(url.toString(), {
            signal: controller.signal,
            headers: { Accept: "application/json" },
          });

          if (!response.ok) {
            throw new Error(`Street search failed: ${response.status}`);
          }

          const payload = await response.json();
          return (payload?.features || [])
            .map(formatPhotonStreet)
            .filter(Boolean)
            .filter((street) =>
              streetBelongsToSelectedCity(street, citySelection),
            );
        }

        let nextSuggestions = await loadStreets(search);

        if (!/^[a-z]/i.test(search) || nextSuggestions.length === 0) {
          for (const fallbackQuery of buildCityFallbackQueries(search)) {
            if (hasConfidentStreetMatch(search, nextSuggestions)) break;

            try {
              const fallbackSuggestions = await loadStreets(fallbackQuery);
              nextSuggestions = [
                ...nextSuggestions,
                ...fallbackSuggestions,
              ];
            } catch (fallbackError) {
              if (fallbackError?.name === "AbortError") throw fallbackError;
              if (!nextSuggestions.length) throw fallbackError;
              break;
            }
          }
        }

        nextSuggestions = rankStreetSuggestions(search, nextSuggestions);

        if (requestId !== requestSequenceRef.current) return;

        setSuggestions(nextSuggestions);
        setActiveIndex(0);
        setOpen(true);
      } catch (searchError) {
        if (
          searchError?.name === "AbortError" ||
          requestId !== requestSequenceRef.current
        ) {
          return;
        }

        setSuggestions([]);
        setError(
          "Не вдалося завантажити вулиці. Перевірте інтернет і спробуйте ще раз.",
        );
        setOpen(true);
      } finally {
        if (requestId === requestSequenceRef.current) {
          setLoading(false);
        }
      }
    }, LOCATION_SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [cityContext, citySelection, hasInteracted, hasVerifiedCity, query]);

  useEffect(() => {
    return () => {
      requestRef.current?.abort();
      if (blurTimerRef.current) {
        window.clearTimeout(blurTimerRef.current);
      }
    };
  }, []);

  function selectSuggestion(suggestion) {
    requestRef.current?.abort();
    requestSequenceRef.current += 1;
    setQuery(suggestion.name);
    onChange(suggestion.name);
    setSuggestions([]);
    setLoading(false);
    setError("");
    setOpen(false);
    setHasInteracted(false);
  }

  function handleInputChange(event) {
    const nextValue = event.target.value;
    setQuery(nextValue);
    onChange(nextValue);
    setHasInteracted(true);
    setActiveIndex(0);
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }

    if (!suggestions.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => (current + 1) % suggestions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(
        (current) => (current - 1 + suggestions.length) % suggestions.length,
      );
      return;
    }

    if (event.key === "Enter" && open) {
      event.preventDefault();
      selectSuggestion(suggestions[activeIndex] || suggestions[0]);
    }
  }

  function clearQuery() {
    requestRef.current?.abort();
    requestSequenceRef.current += 1;
    setQuery("");
    onChange("");
    setSuggestions([]);
    setLoading(false);
    setError("");
    setOpen(false);
    setHasInteracted(true);
  }

  const showResults = open && hasInteracted && query.trim().length >= 2;

  return (
    <div>
      <div className="relative">
        <Signpost className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#ff5a00]" />

        <input
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (hasInteracted && query.trim().length >= 2) setOpen(true);
          }}
          onBlur={() => {
            blurTimerRef.current = window.setTimeout(() => setOpen(false), 120);
          }}
          placeholder={
            hasVerifiedCity
              ? "Почніть вводити назву вулиці"
              : "Спочатку виберіть населений пункт"
          }
          className={cn(
            className,
            "pl-11 pr-11",
            !hasVerifiedCity &&
              "cursor-not-allowed border-[#e5dfd7] bg-[#f5f2ed] text-[#9b948c]",
          )}
          disabled={!hasVerifiedCity}
autoComplete="off"
autoCapitalize="words"
spellCheck
role="combobox"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={showResults}
          aria-activedescendant={
            showResults && suggestions[activeIndex]
              ? `${listId}-${activeIndex}`
              : undefined
          }
          aria-busy={loading}
        />

        {loading ? (
          <span
            className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin rounded-full border-2 border-[#ffd6bd] border-t-[#ff5a00]"
            aria-hidden="true"
          />
        ) : query ? (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={clearQuery}
            className="absolute right-2.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-[#9b948c] transition hover:bg-[#fff1e8] hover:text-[#ff5a00]"
            aria-label="Очистити вулицю"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {showResults && (
        <div className="mt-2 overflow-hidden rounded-2xl border border-[#eadbc9] bg-white shadow-[0_18px_45px_rgba(17,17,17,0.12)]">
          <div
            id={listId}
            role="listbox"
            className="max-h-[min(16rem,38dvh)] overflow-y-auto py-1.5"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm font-bold text-[#77716b]">
                <span
                  className="h-5 w-5 animate-spin rounded-full border-2 border-[#ffd6bd] border-t-[#ff5a00]"
                  aria-hidden="true"
                />
                Шукаємо вулиці…
              </div>
            ) : error ? (
              <div className="px-4 py-5 text-center text-sm font-semibold leading-5 text-[#e5484d]">
                {error}
              </div>
            ) : suggestions.length ? (
              suggestions.map((suggestion, index) => {
                const isActive = index === activeIndex;

                return (
                  <button
                    id={`${listId}-${index}`}
                    key={suggestion.id}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectSuggestion(suggestion)}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
                      isActive ? "bg-[#fff1e8]" : "hover:bg-[#fff7f0]",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                        isActive
                          ? "bg-[#ff5a00] text-white"
                          : "bg-[#fff1e8] text-[#ff5a00]",
                      )}
                    >
                      <Signpost className="h-4.5 w-4.5" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-black text-[#202020]">
                          {suggestion.name}
                        </span>
                        <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wide text-[#ff5a00]">
                          Вулиця
                        </span>
                      </span>

                      <span className="mt-0.5 block truncate text-xs font-medium text-[#77716b]">
                        {suggestion.details || cityContext || "Україна"}
                      </span>
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-5 text-center">
                <p className="text-sm font-black text-[#202020]">
                  Вулицю не знайдено
                </p>
                <p className="mt-1 text-xs font-medium text-[#77716b]">
                  Перевірте місто або спробуйте коротшу назву.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-[#f0e7da] bg-[#fbfaf8] px-4 py-2 text-right">
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer"
              onMouseDown={(event) => event.preventDefault()}
              className="text-[10px] font-bold text-[#9b948c] hover:text-[#ff5a00]"
            >
              Дані © OpenStreetMap
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateStudio() {
  const navigate = useNavigate();

  const coverInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const [step, setStep] = useState(1);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");

  const [city, setCity] = useState("");
  const [selectedCity, setSelectedCity] = useState(null);
  const [street, setStreet] = useState("");
  const [building, setBuilding] = useState("");
  const [apartment, setApartment] = useState("");

  const [schedule, setSchedule] = useState(() => getDefaultSchedule());
  const [scheduleFieldErrors, setScheduleFieldErrors] = useState({});
  const [openScheduleDay, setOpenScheduleDay] = useState(null);

  const [coverFile, setCoverFile] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("");
  const [logoPreviewUrl, setLogoPreviewUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [createdStudio, setCreatedStudio] = useState(null);
  const [coverLoading, setCoverLoading] = useState(false);
  const [cropLoading, setCropLoading] = useState(false);
  const [error, setError] = useState("");

  const [cropModal, setCropModal] = useState({
    open: false,
    imageUrl: "",
  });

  const [crop, setCrop] = useState({
    x: 0,
    y: 0,
  });

  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const inputClassName =
    "h-14 w-full rounded-[17px] border border-[#eadfce] bg-white px-4 text-[14px] font-bold text-[#202020] outline-none transition-all placeholder:text-[#b8afa5] hover:border-[#ffd6bd] focus:border-[#ff6200] focus:ring-4 focus:ring-[#ff6200]/10";

  const citySelectionValid = Boolean(
    selectedCity?.name &&
      normalizeCityMatch(selectedCity.name) === normalizeCityMatch(city),
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "owner") {
      navigate("/login-owner", {
        replace: true,
      });
    }
  }, [navigate]);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreviewUrl("");
      return undefined;
    }

    const url = URL.createObjectURL(coverFile);
    setCoverPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreviewUrl("");
      return undefined;
    }

    const url = URL.createObjectURL(logoFile);
    setLogoPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  function clearError() {
    if (error) setError("");
  }

  function scheduleErrorKey(dayKey, field) {
    return `${dayKey}.${field}`;
  }

  function hasScheduleFieldError(dayKey, field) {
    return Boolean(scheduleFieldErrors[scheduleErrorKey(dayKey, field)]);
  }

  function setScheduleDayErrors(dayKey, fields = []) {
    setScheduleFieldErrors((current) => {
      const next = { ...current };

      Object.keys(next).forEach((key) => {
        if (key.startsWith(`${dayKey}.`)) delete next[key];
      });

      fields.forEach((field) => {
        next[scheduleErrorKey(dayKey, field)] = true;
      });

      return next;
    });
  }

  function clearScheduleDayErrors(dayKey) {
    setScheduleDayErrors(dayKey, []);
  }

  function toggleScheduleDay(dayKey) {
    const nextDay = {
      ...schedule[dayKey],
      enabled: !schedule[dayKey].enabled,
    };

    setSchedule((current) => ({ ...current, [dayKey]: nextDay }));

    if (!nextDay.enabled) {
      clearScheduleDayErrors(dayKey);
    } else {
      setScheduleDayErrors(dayKey, getInvalidScheduleFields(nextDay));
    }

    clearError();
  }

  function toggleScheduleBreak(dayKey) {
    const config = schedule[dayKey];
    const hasBreak = Boolean(
      getBreakStart(config) && getBreakEnd(config),
    );
    const nextDay = withBreakState(config, !hasBreak);

    setSchedule((current) => ({ ...current, [dayKey]: nextDay }));
    setScheduleDayErrors(dayKey, getInvalidScheduleFields(nextDay));
    clearError();
  }

  function updateScheduleTime(dayKey, field, value) {
    const nextDay = { ...schedule[dayKey], [field]: value };

    setSchedule((current) => ({ ...current, [dayKey]: nextDay }));
    setScheduleDayErrors(dayKey, getInvalidScheduleFields(nextDay));
    clearError();
  }

  function validateSchedule() {
    const invalidDay = DAYS.find(
      (day) => !isScheduleItemValid(schedule[day.key]),
    );

    if (!invalidDay) {
      setScheduleFieldErrors({});
      return true;
    }

    setScheduleDayErrors(
      invalidDay.key,
      getInvalidScheduleFields(schedule[invalidDay.key]),
    );
    setError(
      `Перевірте години роботи та перерви для дня: ${invalidDay.full}.`,
    );

    return false;
  }

  function goToStep(nextStep) {
    setError("");
    setStep(nextStep);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function closeCropModal() {
    if (cropModal.imageUrl) {
      URL.revokeObjectURL(cropModal.imageUrl);
    }

    setCropModal({
      open: false,
      imageUrl: "",
    });

    setCrop({
      x: 0,
      y: 0,
    });

    setZoom(1);
    setCroppedAreaPixels(null);
  }

  async function handlePickCover(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setError("");

    if (!file.type?.startsWith("image/")) {
      setError("Оберіть файл зображення для обкладинки.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Максимальний розмір обкладинки — 10 MB.");
      return;
    }

    try {
      setCoverLoading(true);

      const compressed = await compressImage(file);

      setCoverFile(compressed);
    } catch (coverError) {
      setError(
        coverError?.message || "Не вдалося обробити обкладинку.",
      );
    } finally {
      setCoverLoading(false);
    }
  }

  function handlePickLogo(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setError("");

    if (!file.type?.startsWith("image/")) {
      setError("Оберіть файл зображення для логотипа.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Максимальний розмір логотипа — 10 MB.");
      return;
    }

    setCrop({
      x: 0,
      y: 0,
    });

    setZoom(1);
    setCroppedAreaPixels(null);

    setCropModal({
      open: true,
      imageUrl: URL.createObjectURL(file),
    });
  }

  async function handleConfirmCrop() {
    if (!cropModal.imageUrl || cropLoading) return;

    setError("");

    try {
      setCropLoading(true);

      const croppedFile = await getCroppedImage(
        cropModal.imageUrl,
        croppedAreaPixels,
      );

      setLogoFile(croppedFile);
      closeCropModal();
    } catch (cropError) {
      setError(
        cropError?.message || "Не вдалося обробити логотип.",
      );
    } finally {
      setCropLoading(false);
    }
  }

  function continueFromBasics() {
    setError("");

    if (name.trim().length < 2) {
      setError("Введіть назву студії.");
      return;
    }

    goToStep(2);
  }

  function handleContinueFromBasics(event) {
    event.preventDefault();
    continueFromBasics();
  }

  function handleContinueFromDetails(event) {
    event.preventDefault();
    setError("");

    if (!category.trim()) {
      setError("Оберіть категорію студії.");
      return;
    }

    if (description.length > MAX_DESCRIPTION_LENGTH) {
      setError(
        `Опис не може містити більше ${MAX_DESCRIPTION_LENGTH} символів.`,
      );
      return;
    }

    goToStep(3);
  }

  function handleContinueFromPhone(event) {
    event.preventDefault();
    setError("");

    const phoneError = getPhoneValidationError(phone);

    if (phoneError) {
      setError(phoneError);
      return;
    }

    setPhone(normalizePhone(phone));
    goToStep(4);
  }

  function handleContinueFromAddress(event) {
    event.preventDefault();
    setError("");

    const hasAnyAddress = Boolean(
      city.trim() ||
        street.trim() ||
        building.trim() ||
        apartment.trim(),
    );

    if (hasAnyAddress) {
      if (!citySelectionValid) {
        setError("Оберіть населений пункт зі списку.");
        return;
      }

      if (!street.trim()) {
        setError("Введіть вулицю.");
        return;
      }

      if (!building.trim()) {
        setError("Введіть номер будинку.");
        return;
      }
    }

    goToStep(5);
  }

  async function handleCreateStudio(event) {
    event?.preventDefault();
    setError("");

    const normalizedName = name.trim();
    const normalizedCategory = category.trim();
    const normalizedDescription = description.trim();
    const normalizedPhone = normalizePhone(phone);
    const phoneError = getPhoneValidationError(phone);

    if (normalizedName.length < 2) {
      setError("Введіть назву студії.");
      setStep(1);
      return;
    }

    if (!normalizedCategory) {
      setError("Оберіть категорію студії.");
      setStep(2);
      return;
    }

    if (phoneError) {
      setError(phoneError);
      setStep(3);
      return;
    }


    if (normalizedDescription.length > MAX_DESCRIPTION_LENGTH) {
      setError(
        `Опис не може містити більше ${MAX_DESCRIPTION_LENGTH} символів.`,
      );
      setStep(2);
      return;
    }

    const hasAnyAddress = Boolean(
      city.trim() ||
        street.trim() ||
        building.trim() ||
        apartment.trim(),
    );

    if (hasAnyAddress) {
      if (!citySelectionValid) {
        setError("Оберіть населений пункт зі списку.");
        setStep(4);
        return;
      }

      if (!street.trim()) {
        setError("Введіть вулицю.");
        setStep(4);
        return;
      }

      if (!building.trim()) {
        setError("Введіть номер будинку.");
        setStep(4);
        return;
      }
    }

    if (!validateSchedule()) {
      setStep(5);
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login-owner", {
        replace: true,
      });
      return;
    }

    try {
      setLoading(true);

      const studios = await api("/owner", {
        token,
      });

      let studio =
        Array.isArray(studios) && studios.length > 0
          ? studios[0]
          : null;

      if (!studio) {
        studio = await api("/owner", {
          method: "POST",
          token,
          body: {
            name: normalizedName,
            phone: normalizedPhone,
          },
        });
      }

      const uploadJobs = [];

      if (coverFile) {
        uploadJobs.push(
          uploadStudioImage(
            studio.id,
            coverFile,
            "cover",
            token,
          ).then((key) => ["coverUrl", key]),
        );
      }

      if (logoFile) {
        uploadJobs.push(
          uploadStudioImage(
            studio.id,
            logoFile,
            "logo",
            token,
          ).then((key) => ["logoUrl", key]),
        );
      }

      const uploadedEntries = await Promise.all(uploadJobs);
      const uploadedFields = Object.fromEntries(uploadedEntries);

      const body = {
        name: normalizedName,
        category: normalizedCategory,
        phone: normalizedPhone,
        ...uploadedFields,
      };

      if (normalizedDescription) {
        body.description = normalizedDescription;
      }


      if (hasAnyAddress) {
        body.city = city.trim();
        body.street = street.trim();
        body.building = building.trim();

        if (apartment.trim()) {
          body.apartment = apartment.trim();
        }
      }

      const updatedStudio = await api(`/owner/${studio.id}`, {
        method: "PATCH",
        token,
        body,
      });

      await api(`/studio/${updatedStudio.id}/schedule`, {
        method: "PATCH",
        token,
        body: {
          schedule,
          slotDuration: DEFAULT_SLOT_DURATION,
        },
      });

      localStorage.setItem("studioId", updatedStudio.id);

      window.dispatchEvent(new Event("auth-changed"));
      window.dispatchEvent(new Event("studio-changed"));

      setCreatedStudio(updatedStudio);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (submitError) {
      setError(
        submitError?.message || "Не вдалося створити студію.",
      );
    } finally {
      setLoading(false);
    }
  }

  const currentStep = STEP_CONTENT[step];
  const StepIcon = currentStep.icon;

  return (
    <>
      <main className="flex min-h-[100dvh] items-center justify-center px-2 py-2 lg:py-10">
        <section
          className={cn(
            "w-full overflow-hidden rounded-[28px] border border-[#eadfce] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.10)] sm:rounded-[36px]",
            "max-w-[620px]",
          )}
        >
          <div className="h-[4px] bg-[#ff6200]" />

          <div className="p-6 sm:p-9">
            {createdStudio ? (
              <div className="py-2 text-center sm:py-4">
                <div className="relative mx-auto grid h-24 w-24 place-items-center rounded-[30px] bg-[#fff1e8] text-[#ff6200] shadow-[0_18px_45px_rgba(255,98,0,0.18)]">
                  <span className="absolute inset-2 rounded-[24px] border border-[#ff6200]/20" />
                  <Check className="relative h-12 w-12 stroke-[3]" />
                </div>

                <span className="mt-5 inline-flex items-center rounded-full bg-[#edf9f0] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#218358]">
                  Створення завершено
                </span>

                <h1 className="mx-auto mt-3 max-w-[480px] text-[27px] font-black tracking-[-0.04em] text-[#202020] sm:text-[36px]">
                  Студію успішно створено!
                </h1>

                <p className="mx-auto mt-2 max-w-[470px] text-[13px] font-medium leading-6 text-[#77716b] sm:text-[15px]">
                  <span className="font-black text-[#202020]">
                    {createdStudio.name || name.trim()}
                  </span>{" "}
                  вже додано до Aveliio. Щоб клієнти могли записуватися,
                  підготуйте команду та перелік доступних послуг.
                </p>

                <div className="mt-7 rounded-[22px] border border-[#eadfce] bg-[#fcfaf7] p-4 text-left sm:p-5">
                  <p className="text-[12px] font-black uppercase tracking-[0.12em] text-[#9a928a]">
                    Що потрібно зробити далі
                  </p>

                  <div className="mt-3 space-y-3">
                    <div className="flex items-center gap-3 rounded-[17px] border border-[#eee7de] bg-white p-3.5">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-[#fff1e8] text-[#ff6200]">
                        <Scissors className="h-5 w-5" />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-black text-[#202020] sm:text-[14px]">
                          Створіть послуги
                        </span>
                        <span className="mt-0.5 block text-[11px] font-medium leading-5 text-[#77716b] sm:text-[12px]">
                          Додайте назву, тривалість і вартість кожної послуги.
                        </span>
                      </span>

                      <ArrowRight className="h-4 w-4 shrink-0 text-[#d3ccc4]" />
                    </div>

                    <div className="flex items-center gap-3 rounded-[17px] border border-[#eee7de] bg-white p-3.5">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-[#fff1e8] text-[#ff6200]">
                        <Users className="h-5 w-5" />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-black text-[#202020] sm:text-[14px]">
                          Додайте майстрів
                        </span>
                        <span className="mt-0.5 block text-[11px] font-medium leading-5 text-[#77716b] sm:text-[12px]">
                          Створіть профілі майстрів і призначте їм послуги.
                        </span>
                      </span>

                      <ArrowRight className="h-4 w-4 shrink-0 text-[#d3ccc4]" />
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/dashboard/services", { replace: true })
                    }
                    className="group inline-flex h-[52px] items-center justify-center gap-2 rounded-[15px] bg-[#ff6200] px-4 text-[13px] font-black text-white transition-all duration-300 hover:scale-[1.015] hover:bg-[#ef5700] active:scale-[0.98]"
                  >
                    <Scissors className="h-4 w-4" />
                    Додати послуги
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      navigate("/dashboard/masters", { replace: true })
                    }
                    className="group inline-flex h-[52px] items-center justify-center gap-2 rounded-[15px] border border-[#eadfce] bg-white px-4 text-[13px] font-black text-[#202020] transition-all duration-300 hover:border-[#ff6200] hover:text-[#ff6200] active:scale-[0.98]"
                  >
                    <Users className="h-4 w-4" />
                    Додати майстрів
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/dashboard/studio", { replace: true })
                  }
                  className="mt-3 inline-flex h-11 items-center justify-center gap-2 rounded-[14px] px-4 text-[12px] font-black text-[#77716b] transition-colors hover:bg-[#f7f3ee] hover:text-[#202020]"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Перейти до панелі студії
                </button>
              </div>
            ) : (
              <>
                <div className="text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-[18px] bg-[#fff1e8] text-[#ff6200]">
                <StepIcon className="h-9 w-9" />
              </div>

              <h1 className="mt-2 lg:mt-5 sm:mt-5 text-[25px] font-black tracking-[-0.04em] text-[#202020] sm:text-[34px]">
                {currentStep.title}
              </h1>

              <p className="mx-auto lg:mt-2 sm:mt-2 max-w-[440px] text-[13px] font-medium leading-5 text-[#77716b] sm:text-[15px] sm:leading-6">
                {currentStep.description}
              </p>
            </div>

            <div className="mt-5 flex items-center justify-center gap-2">
              {Array.from({ length: TOTAL_STEPS }, (_, index) => {
                const item = index + 1;

                return (
                  <span
                    key={item}
                    className={cn(
                      "h-2.5 rounded-full transition-all duration-300",
                      step === item
                        ? "w-8 bg-[#ff6200]"
                        : item < step
                          ? "w-2.5 bg-[#ffb489]"
                          : "w-2.5 bg-[#e8e1da]",
                    )}
                  />
                );
              })}
            </div>

            <p className="mt-2 text-center text-[10px] font-black uppercase tracking-[0.15em] text-[#9a928a]">
              Крок {step} з {TOTAL_STEPS}
            </p>

            {step === 1 && (
              <form
                onSubmit={handleContinueFromBasics}
                className="mt-6 space-y-6"
              >
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-[13px] font-black text-[#202020]">
                      Фото студії
                    </span>

                    <span className="text-[10px] font-bold text-[#9a928a]">
                      Необов’язково
                    </span>
                  </div>

                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePickCover}
                    className="hidden"
                  />

                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePickLogo}
                    className="hidden"
                  />

                  <div className="relative pb-12 sm:pb-14">
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={coverLoading}
                      className="group relative flex aspect-[16/7] w-full items-center justify-center overflow-hidden rounded-[22px] border-2 border-dashed border-[#dcd4cc] bg-[#faf8f5] transition-all duration-300 hover:border-[#ff6200] hover:bg-[#fff7f1] disabled:pointer-events-none disabled:opacity-60"
                    >
                      {coverPreviewUrl ? (
                        <>
                          <img
                            src={coverPreviewUrl}
                            alt="Обкладинка студії"
                            className="h-full w-full object-cover"
                          />

                          <span className="absolute inset-0 grid place-items-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/45 group-hover:opacity-100">
                            <span className="flex items-center gap-2 text-[13px] font-black">
                              <Camera className="h-5 w-5" />
                              Змінити обкладинку
                            </span>
                          </span>
                        </>
                      ) : (
                        <span className="flex flex-col items-center gap-2 text-[#8a847d] transition group-hover:text-[#ff6200]">
                          {coverLoading ? (
                            <span className="h-7 w-7 animate-spin rounded-full border-2 border-[#ffd6bd] border-t-[#ff6200]" />
                          ) : (
                            <Images className="h-8 w-8" />
                          )}

                          <span className="text-[12px] font-black">
                            {coverLoading
                              ? "Обробка..."
                              : "Додати обкладинку"}
                          </span>

                          <span className="text-[10px] font-semibold text-[#aaa19a]">
                            Рекомендований формат 16:9
                          </span>
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="group absolute bottom-0 left-4 grid h-24 w-24 place-items-center overflow-hidden rounded-full border-[4px] border-white bg-[#faf8f5] shadow-[0_12px_30px_rgba(15,23,42,0.18)] transition-all duration-300 hover:scale-[1.035] sm:left-6 sm:h-28 sm:w-28"
                      aria-label={logoPreviewUrl ? "Змінити логотип" : "Додати логотип"}
                    >
                      {logoPreviewUrl ? (
                        <>
                          <img
                            src={logoPreviewUrl}
                            alt="Логотип студії"
                            className="h-full w-full object-cover"
                          />

                          <span className="absolute inset-0 grid place-items-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/45 group-hover:opacity-100">
                            <Camera className="h-6 w-6" />
                          </span>
                        </>
                      ) : (
                        <span className="flex flex-col items-center gap-1 text-[#8a847d] transition group-hover:text-[#ff6200]">
                          <ImagePlus className="h-6 w-6" />
                          <span className="text-[10px] font-black">
                            Логотип
                          </span>
                        </span>
                      )}
                    </button>

                    <div className="absolute bottom-1 left-[7.5rem] right-1 hidden items-center justify-between gap-3 sm:flex sm:left-[9rem]">
                      <p className="shrink-0 text-[10px] font-bold text-[#b0a79f]">
                        JPG, PNG або WEBP · до 10 MB
                      </p>
                    </div>
                  </div>

                </div>

                <label className="block">
                  <span className="mb-2 flex items-center justify-between gap-3 text-[13px] font-black text-[#202020]">
                    <span>Назва студії</span>

                    <span className="text-[10px] text-[#ff6200]">
                      Обов’язково
                    </span>
                  </span>

                  <div className="flex h-14 items-center gap-3 rounded-[17px] border border-[#eadfce] bg-white px-4 transition-all focus-within:border-[#ff6200] focus-within:ring-4 focus-within:ring-[#ff6200]/10">
                    <Building2 className="h-5 w-5 shrink-0 text-[#8a847d]" />

                    <input
                      value={name}
                      onChange={(event) => {
                        setName(event.target.value);
                        clearError();
                      }}
                      placeholder="Наприклад, Aurora Beauty Space"
                      maxLength={80}
                      autoComplete="organization"
                      autoFocus
                      className="min-w-0 flex-1 bg-transparent text-[14px] font-bold text-[#202020] outline-none placeholder:text-[#b8afa5]"
                    />
                  </div>
                </label>

                <ErrorMessage>{error}</ErrorMessage>

                <ContinueButton disabled={coverLoading} />
              </form>
            )}

            {step === 2 && (
              <form
                onSubmit={handleContinueFromDetails}
                className="mt-6 space-y-6"
              >
                <div className="block">
                  <span className="mb-2 flex items-center justify-between gap-3 text-[13px] font-black text-[#202020]">
                    <span>Категорія</span>

                    <span className="text-[10px] text-[#ff6200]">
                      Обов’язково
                    </span>
                  </span>

                  <CategorySelect
                    value={category}
                    onChange={(nextValue) => {
                      setCategory(nextValue);
                      clearError();
                    }}
                  />
                </div>

                <label className="block">
                  <span className="mb-2 flex items-center justify-between gap-3 text-[13px] font-black text-[#202020]">
                    <span>Опис студії</span>

                    <span
                      className={cn(
                        "text-[10px]",
                        description.length > MAX_DESCRIPTION_LENGTH
                          ? "text-[#ef4444]"
                          : "text-[#9a928a]",
                      )}
                    >
                      Необов’язково · {description.length}/
                      {MAX_DESCRIPTION_LENGTH}
                    </span>
                  </span>

                  <textarea
                    value={description}
                    onChange={(event) => {
                      setDescription(event.target.value);
                      clearError();
                    }}
                    placeholder="Коротко розкажіть про вашу студію, атмосферу та послуги"
                    rows={6}
                    className="w-full resize-none rounded-[17px] border border-[#eadfce] bg-white px-4 py-3 text-[14px] font-bold leading-6 text-[#202020] outline-none transition placeholder:text-[#b8afa5] focus:border-[#ff6200] focus:ring-4 focus:ring-[#ff6200]/10"
                  />
                </label>

                <ErrorMessage>{error}</ErrorMessage>

                <div className="grid grid-cols-[auto_1fr] gap-3">
                  <BackButton onClick={() => goToStep(1)} />

                  <ContinueButton />
                </div>
              </form>
            )}

            {step === 3 && (
              <form
                onSubmit={handleContinueFromPhone}
                className="mt-6 space-y-6"
              >
                <label className="block">
                  <span className="mb-2 flex items-center justify-between gap-3 text-[13px] font-black text-[#202020]">
                    <span>Телефон студії</span>

                    <span className="text-[10px] text-[#ff6200]">
                      Обов’язково
                    </span>
                  </span>

                  <div className="flex h-14 items-center gap-3 rounded-[17px] border border-[#eadfce] bg-white px-4 transition-all focus-within:border-[#ff6200] focus-within:ring-4 focus-within:ring-[#ff6200]/10">
                    <Phone className="h-5 w-5 shrink-0 text-[#8a847d]" />

<input
  type="tel"
  value={phone}
  onChange={(event) => {
    setPhone(sanitizePhoneInput(event.target.value));
    clearError();
  }}
  maxLength={20}
  placeholder="+380 67 123 45 67"
  autoComplete="tel"
  inputMode="tel"
  className="min-w-0 flex-1 bg-transparent text-[14px] font-bold text-[#202020] outline-none placeholder:text-[#b8afa5]"
/>
                  </div>

                  <p className="mt-2 text-[11px] font-medium leading-4 text-[#9a928a]">
                    Введіть український номер у форматі +380 XX XXX XX XX.
                  </p>
                </label>

                <ErrorMessage>{error}</ErrorMessage>

                <div className="grid grid-cols-[auto_1fr] gap-3">
                  <BackButton onClick={() => goToStep(2)} />

                  <ContinueButton />
                </div>
              </form>
            )}

            {step === 4 && (
              <form
                onSubmit={handleContinueFromAddress}
                className="mt-6 space-y-5"
              >
                <label className="block">
                  <span className="mb-2 flex items-center justify-between gap-3 text-[13px] font-black text-[#202020]">
                    <span>Місце розташування</span>

                    <span className="text-[10px] text-[#9a928a]">
                      Необов’язково
                    </span>
                  </span>

                  <CityAutocomplete
                    value={city}
                    selectionValid={citySelectionValid}
                    onChange={(nextValue, nextSelection) => {
                      setCity(nextValue);
                      setSelectedCity(nextSelection);
                      setStreet("");
                      setBuilding("");
                      setApartment("");
                      clearError();
                    }}
                    className={inputClassName}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[13px] font-black text-[#202020]">
                    Вулиця
                  </span>

                  <StreetAutocomplete
                    value={street}
                    city={city}
                    citySelection={selectedCity}
                    onChange={(nextValue) => {
                      setStreet(nextValue);
                      clearError();
                    }}
                    className={inputClassName}
                  />
                </label>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <label className="block">
                    <span className="mb-2 block text-[13px] font-black text-[#202020]">
                      Будинок
                    </span>

                    <div className="relative">
                      <House className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8a847d]" />

                      <input
                        value={building}
                        disabled={!citySelectionValid}
                        onChange={(event) => {
                          setBuilding(event.target.value);
                          clearError();
                        }}
                        placeholder="Наприклад, 12А"
                        className={cn(
                          inputClassName,
                          "pl-12",
                          !citySelectionValid &&
                            "cursor-not-allowed bg-[#f4f1ed]",
                        )}
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[13px] font-black text-[#202020]">
                      Квартира / Офіс
                    </span>

                    <div className="relative">
                      <DoorOpen className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8a847d]" />

                      <input
                        value={apartment}
                        disabled={!citySelectionValid}
                        onChange={(event) => {
                          setApartment(event.target.value);
                          clearError();
                        }}
                        placeholder="Необов’язково"
                        className={cn(
                          inputClassName,
                          "pl-12",
                          !citySelectionValid &&
                            "cursor-not-allowed bg-[#f4f1ed]",
                        )}
                      />
                    </div>
                  </label>
                </div>

                <ErrorMessage>{error}</ErrorMessage>

                <div className="grid grid-cols-[auto_1fr] gap-3">
                  <BackButton onClick={() => goToStep(3)} />

                  <ContinueButton />
                </div>
              </form>
            )}

            {step === 5 && (
              <form
                onSubmit={handleCreateStudio}
                className="mt-6 space-y-5"
              >
                <div className="overflow-hidden rounded-[20px] border border-[#ebe7df] bg-white">
                  {DAYS.map((day, index) => {
                    const config = schedule[day.key];
                    const enabled = config.enabled;
                    const breakStart = getBreakStart(config);
                    const breakEnd = getBreakEnd(config);
                    const hasBreak = Boolean(breakStart && breakEnd);
                    const isOpen = openScheduleDay === day.key;
                    const hasDayError = Object.keys(scheduleFieldErrors).some(
                      (key) => key.startsWith(`${day.key}.`),
                    );

                    return (
                      <div
                        key={day.key}
                        className={cn(
                          index !== DAYS.length - 1 &&
                            "border-b border-[#eeeae4]",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenScheduleDay((current) =>
                              current === day.key ? null : day.key,
                            )
                          }
                          disabled={loading}
                          aria-expanded={isOpen}
                          className={cn(
                            "group flex min-h-[68px] w-full items-center gap-3 px-4 text-left transition-colors duration-200 disabled:opacity-60 sm:min-h-[74px] sm:px-5",
                            isOpen ? "bg-[#fffaf6]" : "bg-white hover:bg-[#fcfaf7]",
                          )}
                        >
                          <span className="min-w-0 flex-1 text-[14px] font-black text-[#202020] sm:text-[15px]">
                            {day.full}
                          </span>

                          <span
                            className={cn(
                              "shrink-0 text-right text-[13px] font-semibold sm:text-[14px]",
                              enabled ? "text-[#77716b]" : "text-[#aaa39b]",
                            )}
                          >
                            {enabled
                              ? `${config.start} – ${config.end}`
                              : "Вихідний"}
                          </span>

                          <ChevronDown
                            className={cn(
                              "h-5 w-5 shrink-0 text-[#c2bbb3] transition-transform duration-200 group-hover:text-[#ff6200]",
                              isOpen && "rotate-180 text-[#ff6200]",
                            )}
                          />
                        </button>

                        {isOpen && (
                          <div className="border-t border-[#f0ebe5] bg-[#faf8f5] px-4 py-4 sm:px-5 sm:py-5">
                            <button
                              type="button"
                              onClick={() => toggleScheduleDay(day.key)}
                              disabled={loading}
                              className="flex h-[52px] w-full items-center justify-between gap-3 rounded-[16px] border border-[#e7e0d8] bg-white px-4 text-left transition-all hover:border-[#ffd6bd] disabled:opacity-60"
                            >
                              <span>
                                <span className="block text-[13px] font-black text-[#202020]">
                                  Робочий день
                                </span>
                                <span className="mt-0.5 block text-[11px] font-medium text-[#8a847d]">
                                  {enabled
                                    ? "Студія приймає клієнтів"
                                    : "Студія цього дня не працює"}
                                </span>
                              </span>

                              <Toggle checked={enabled} />
                            </button>

                            {enabled && (
                              <div className="mt-4 space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                  {[
                                    ["start", "Початок", Clock],
                                    ["end", "Кінець", Timer],
                                  ].map(([field, label, Icon]) => (
                                    <div key={field} className="min-w-0">
                                      <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#77716b]">
                                        <Icon className="h-3.5 w-3.5 text-[#ff6200]" />
                                        {label}
                                      </label>

                                      <TimeField
                                        className={cn(
                                          "flex h-[50px] items-center overflow-hidden rounded-[16px] border bg-white transition-all duration-200 focus-within:ring-4",
                                          hasScheduleFieldError(day.key, field)
                                            ? "border-[#ef4444] bg-[#fff5f5] focus-within:ring-[#ef4444]/10"
                                            : "border-[#e7e0d8] hover:border-[#ffd6bd] focus-within:ring-[#ff6200]/10",
                                        )}
                                      >
                                        <TimeSelect
                                          value={config[field]}
                                          label={label}
                                          dayLabel={day.full}
                                          onChange={(value) =>
                                            updateScheduleTime(
                                              day.key,
                                              field,
                                              value,
                                            )
                                          }
                                          onCommit={(value) =>
                                            updateScheduleTime(
                                              day.key,
                                              field,
                                              value,
                                            )
                                          }
                                          className="h-full w-full justify-center text-[15px]"
                                        />
                                      </TimeField>
                                    </div>
                                  ))}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => toggleScheduleBreak(day.key)}
                                  disabled={loading}
                                  className="flex h-[52px] w-full items-center justify-between gap-3 rounded-[16px] border border-[#e7e0d8] bg-white px-4 text-left transition-all hover:border-[#ffd6bd] disabled:opacity-60"
                                >
                                  <span className="flex min-w-0 items-center gap-3">
                                    <span
                                      className={cn(
                                        "grid h-8 w-8 shrink-0 place-items-center rounded-[10px]",
                                        hasBreak
                                          ? "bg-[#edf9f0] text-[#2f9e55]"
                                          : "bg-[#f4f1ed] text-[#8a847d]",
                                      )}
                                    >
                                      <Coffee className="h-4 w-4" />
                                    </span>

                                    <span>
                                      <span className="block text-[13px] font-black text-[#202020]">
                                        Перерва
                                      </span>
                                      <span className="mt-0.5 block text-[11px] font-medium text-[#8a847d]">
                                        {hasBreak
                                          ? `${breakStart} – ${breakEnd}`
                                          : "Без перерви"}
                                      </span>
                                    </span>
                                  </span>

                                  <Toggle checked={hasBreak} />
                                </button>

                                {hasBreak && (
                                  <div className="grid grid-cols-2 gap-3">
                                    {[
                                      ["breakStart", "Перерва з"],
                                      ["breakEnd", "Перерва до"],
                                    ].map(([field, label]) => (
                                      <div key={field} className="min-w-0">
                                        <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#77716b]">
                                          <Coffee className="h-3.5 w-3.5 text-[#ff6200]" />
                                          {label}
                                        </label>

                                        <TimeField
                                          className={cn(
                                            "flex h-[50px] items-center overflow-hidden rounded-[16px] border bg-white transition-all duration-200 focus-within:ring-4",
                                            hasScheduleFieldError(
                                              day.key,
                                              field,
                                            )
                                              ? "border-[#ef4444] bg-[#fff5f5] focus-within:ring-[#ef4444]/10"
                                              : "border-[#e7e0d8] hover:border-[#ffd6bd] focus-within:ring-[#ff6200]/10",
                                          )}
                                        >
                                          <TimeSelect
                                            value={config[field]}
                                            label={label}
                                            dayLabel={day.full}
                                            onChange={(value) =>
                                              updateScheduleTime(
                                                day.key,
                                                field,
                                                value,
                                              )
                                            }
                                            onCommit={(value) =>
                                              updateScheduleTime(
                                                day.key,
                                                field,
                                                value,
                                              )
                                            }
                                            className="h-full w-full justify-center text-[15px]"
                                          />
                                        </TimeField>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {hasDayError && (
                              <p className="mt-3 rounded-[14px] border border-[#fecaca] bg-[#fff5f5] px-3 py-2 text-xs font-bold leading-5 text-[#dc2626]">
                                Завершення має бути пізніше початку, а
                                перерва — всередині робочого часу.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <ErrorMessage>{error}</ErrorMessage>

                <div className="grid grid-cols-[auto_1fr] gap-3">
                  <BackButton
                    onClick={() => goToStep(4)}
                    disabled={loading}
                  />

                  <ContinueButton disabled={loading}>
                    {loading ? "Створення..." : "Створити студію"}
                  </ContinueButton>
                </div>
              </form>
            )}
              </>
            )}
          </div>
        </section>
      </main>

      {cropModal.open && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[560px] overflow-hidden rounded-[26px] border border-white/10 bg-white shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between border-b border-[#eadfce] px-5 py-4">
              <div>
                <h2 className="text-[17px] font-black text-[#202020]">
                  Налаштуйте логотип
                </h2>

                <p className="mt-0.5 text-[12px] font-medium text-[#77716b]">
                  Перемістіть і збільшіть зображення
                </p>
              </div>

              <button
                type="button"
                onClick={closeCropModal}
                disabled={cropLoading}
                className="grid h-10 w-10 place-items-center rounded-full bg-[#f5f1ec] text-[#77716b] transition hover:bg-[#202020] hover:text-white disabled:pointer-events-none disabled:opacity-50"
                aria-label="Закрити"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative h-[360px] bg-[#151515] sm:h-[440px]">
              <Cropper
                image={cropModal.imageUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, pixels) =>
                  setCroppedAreaPixels(pixels)
                }
              />
            </div>

            <div className="space-y-4 p-5">
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="w-full accent-[#ff6200]"
              />

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={closeCropModal}
                  disabled={cropLoading}
                  className="h-12 rounded-[14px] border border-[#eadfce] bg-white text-[13px] font-black text-[#202020] transition hover:border-[#ff6200] hover:text-[#ff6200] disabled:pointer-events-none disabled:opacity-50"
                >
                  Скасувати
                </button>

                <button
                  type="button"
                  onClick={handleConfirmCrop}
                  disabled={cropLoading}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[14px] bg-[#202020] text-[13px] font-black text-white transition hover:bg-[#ff6200] disabled:pointer-events-none disabled:bg-[#d8d2cc]"
                >
                  <Check className="h-4 w-4" />

                  {cropLoading ? "Обробка..." : "Використати"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}