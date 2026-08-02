// CreateStudio.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cropper from "react-easy-crop";
import {
  ArrowRight,
  Banknote,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  Sparkles,
  ChevronLeft,
  Clock,
  Coffee,
  DoorOpen,
  FilePenLine,
  House,
  ImagePlus,
  Images,
  LayoutDashboard,
  MapPin,
  MapPinned,
  Phone,
  Plus,
  Scissors,
  Signpost,
  Tags,
  Timer,
  Trash2,
  Users,
  X,
} from "lucide-react";

import TimeSelect from "../components/TimeSelect";
import { api } from "../api/http";

const TOTAL_STEPS = 7;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_DESCRIPTION_LENGTH = 400;
const UNCATEGORIZED_SERVICE_ID = "__uncategorized__";

const PUBLIC_MEDIA_BASE_URL = String(
  import.meta.env.VITE_R2_PUBLIC_BASE_URL || "",
).replace(/\/$/, "");

function toPublicImageUrl(value) {
  const source = String(value || "").trim();

  if (!source) return "";
  if (/^(https?:|blob:|data:)/i.test(source)) return source;
  if (!PUBLIC_MEDIA_BASE_URL) return source;

  return `${PUBLIC_MEDIA_BASE_URL}/${source.replace(/^\/+/, "")}`;
}

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
  6: {
    title: "Майстри студії",
    description: "Додайте майстрів, які прийматимуть записи клієнтів",
    icon: Users,
  },
  7: {
    title: "Послуги студії",
    description: "Додайте послуги, вартість, тривалість і виконавців",
    icon: Scissors,
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

async function getCroppedImage(imageSrc, cropPixels, fileName = "studio-logo.jpg") {
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
          new File([blob], fileName, {
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

async function uploadMasterPhoto(studioId, file, token) {
  const formData = new FormData();
  formData.append("file", file);

  const apiBaseUrl = String(import.meta.env.VITE_API_URL || "").replace(
    /\/$/,
    "",
  );

  const response = await fetch(
    `${apiBaseUrl}/media/studio/${studioId}/master-photo`,
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
      data?.message || `Не вдалося завантажити фото майстра (${response.status}).`,
    );
  }

  if (!data?.key) {
    throw new Error("Сервер не повернув адресу фото майстра.");
  }

  return data;
}

async function deleteMasterPhoto(studioId, key, token) {
  if (!studioId || !key) return;

  const apiBaseUrl = String(import.meta.env.VITE_API_URL || "").replace(
    /\/$/,
    "",
  );

  const response = await fetch(
    `${apiBaseUrl}/media/studio/${studioId}/master-photo`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ key }),
    },
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message || `Не вдалося видалити фото майстра (${response.status}).`,
    );
  }
}

function getMasterInitials(name) {
  const value = String(name || "").trim();

  if (!value) return "М";

  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "М"
  );
}

function MasterAvatar({ name, photoUrl, className = "" }) {
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-[22px] border-2 border-white bg-[#f4f1ed] shadow-[0_12px_30px_rgba(15,23,42,0.10)]",
        className || "h-20 w-20",
      )}
    >
      {photoUrl ? (
        <img
          src={toPublicImageUrl(photoUrl)}
          alt={name || "Майстер"}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-[24px] font-black tracking-[-0.05em] text-[#756d66]">
          {getMasterInitials(name)}
        </span>
      )}
    </div>
  );
}


function formatServiceDuration(minutes) {
  const normalized = Math.max(5, Number(minutes || 0));
  const hours = Math.floor(normalized / 60);
  const restMinutes = normalized % 60;

  if (hours === 0) return `${restMinutes} хв`;
  if (restMinutes === 0) return `${hours} год`;

  return `${hours} год ${restMinutes} хв`;
}

function ServiceCategorySelect({
  value,
  categories,
  onChange,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const options = [
    { id: UNCATEGORIZED_SERVICE_ID, name: "Без категорії" },
    ...categories,
  ];
  const selected = options.find(
    (item) => String(item.id) === String(value),
  );

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen((current) => !current)}
        disabled={disabled}
        className={cn(
          "flex h-14 w-full items-center justify-between gap-3 rounded-[17px] border bg-white px-4 text-left transition-all",
          open
            ? "border-[#ff6200] ring-4 ring-[#ff6200]/10"
            : "border-[#eadfce] hover:border-[#ffd6bd]",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <span className="min-w-0 truncate text-[13px] font-bold text-[#202020]">
          {selected?.name || "Без категорії"}
        </span>

        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[#ff6200] transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[240px] overflow-y-auto rounded-[18px] border border-[#eadfce] bg-white p-1.5 shadow-[0_20px_55px_rgba(17,17,17,0.14)]">
          {options.map((item) => {
            const active = String(item.id) === String(value);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onChange(item.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-[12px] px-3 py-2.5 text-left text-[13px] font-bold transition-colors",
                  active
                    ? "bg-[#fff1e8] text-[#ff6200]"
                    : "text-[#202020] hover:bg-[#fff7f1]",
                )}
              >
                <span className="truncate">{item.name}</span>
                {active && <Check className="h-4 w-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
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
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [masterAdding, setMasterAdding] = useState(false);
  const [createdMasters, setCreatedMasters] = useState([]);
  const [masterForm, setMasterForm] = useState({
    name: "",
    role: "",
    photoFile: null,
  });
  const [masterPhotoPreviewUrl, setMasterPhotoPreviewUrl] = useState("");

  const [serviceAdding, setServiceAdding] = useState(false);
  const [serviceCategoryAdding, setServiceCategoryAdding] = useState(false);
  const [createdServiceCategories, setCreatedServiceCategories] = useState([]);
  const [createdServices, setCreatedServices] = useState([]);
  const [newServiceCategoryName, setNewServiceCategoryName] = useState("");
  const [serviceForm, setServiceForm] = useState({
    categoryId: UNCATEGORIZED_SERVICE_ID,
    name: "",
    duration: 60,
    price: "",
    allMasters: true,
    masters: [],
  });

  const [coverLoading, setCoverLoading] = useState(false);
  const [cropLoading, setCropLoading] = useState(false);
  const [error, setError] = useState("");

  const [cropModal, setCropModal] = useState({
    open: false,
    imageUrl: "",
    target: "logo",
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

  useEffect(() => {
    if (!masterForm.photoFile) {
      setMasterPhotoPreviewUrl("");
      return undefined;
    }

    const url = URL.createObjectURL(masterForm.photoFile);
    setMasterPhotoPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [masterForm.photoFile]);

  useEffect(() => {
    if (!setupCompleted) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [setupCompleted]);

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
      target: "logo",
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
      target: "logo",
    });
  }

  function handlePickMasterPhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setError("");

    if (!file.type?.startsWith("image/")) {
      setError("Оберіть файл зображення для фото майстра.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Максимальний розмір фото майстра — 10 MB.");
      return;
    }

    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);

    setCropModal({
      open: true,
      imageUrl: URL.createObjectURL(file),
      target: "master",
    });
  }

  function clearMasterPhoto() {
    setMasterForm((current) => ({
      ...current,
      photoFile: null,
    }));
    clearError();
  }

  async function handleConfirmCrop() {
    if (!cropModal.imageUrl || cropLoading) return;

    setError("");

    try {
      setCropLoading(true);

      const isMasterPhoto = cropModal.target === "master";
      const croppedFile = await getCroppedImage(
        cropModal.imageUrl,
        croppedAreaPixels,
        isMasterPhoto ? "master-photo.jpg" : "studio-logo.jpg",
      );

      if (isMasterPhoto) {
        setMasterForm((current) => ({
          ...current,
          photoFile: croppedFile,
        }));
      } else {
        setLogoFile(croppedFile);
      }

      closeCropModal();
    } catch (cropError) {
      setError(
        cropError?.message ||
          (cropModal.target === "master"
            ? "Не вдалося обробити фото майстра."
            : "Не вдалося обробити логотип."),
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
      setStep(6);

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

  function updateMasterForm(field, value) {
    setMasterForm((current) => ({
      ...current,
      [field]: value,
    }));
    clearError();
  }

  async function handleAddMaster(event) {
    event.preventDefault();
    setError("");

    const studioId = createdStudio?.id;
    const masterName = String(masterForm.name || "").trim();
    const masterRole = String(masterForm.role || "").trim();

    if (!studioId) {
      setError("Спочатку потрібно зберегти студію.");
      return;
    }

    if (!masterName) {
      setError("Введіть імʼя майстра.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login-owner", { replace: true });
      return;
    }

    let uploadedPhotoKey = null;

    try {
      setMasterAdding(true);

      let photoUrl = "";

      if (masterForm.photoFile) {
        const uploadedPhoto = await uploadMasterPhoto(
          studioId,
          masterForm.photoFile,
          token,
        );

        uploadedPhotoKey = uploadedPhoto.key;
        photoUrl = uploadedPhoto.url || "";
      }

      const apiBaseUrl = String(import.meta.env.VITE_API_URL || "").replace(
        /\/$/,
        "",
      );
      const response = await fetch(
        `${apiBaseUrl}/studio/${studioId}/masters`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: masterName,
            role: masterRole,
            photoUrl,
            photoKey: uploadedPhotoKey,
          }),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || `Не вдалося додати майстра (${response.status}).`,
        );
      }

      const createdMaster = data?.master || {
        id: `local-${Date.now()}`,
        name: masterName,
        role: masterRole,
        photoUrl,
        photoKey: uploadedPhotoKey,
      };

      setCreatedMasters((current) => [createdMaster, ...current]);
      setMasterForm({
        name: "",
        role: "",
        photoFile: null,
      });

      window.dispatchEvent(new Event("studio-changed"));
    } catch (masterError) {
      if (uploadedPhotoKey) {
        try {
          await deleteMasterPhoto(studioId, uploadedPhotoKey, token);
        } catch (rollbackError) {
          console.warn("Не вдалося видалити завантажене фото:", rollbackError);
        }
      }

      setError(masterError?.message || "Не вдалося додати майстра.");
    } finally {
      setMasterAdding(false);
    }
  }

  function updateServiceForm(field, value) {
    setServiceForm((current) => ({
      ...current,
      [field]: value,
    }));
    clearError();
  }

  function toggleServiceMaster(masterId) {
    const normalizedId = String(masterId);

    setServiceForm((current) => {
      const selectedMasters = Array.isArray(current.masters)
        ? current.masters.map(String)
        : [];
      const alreadySelected = selectedMasters.includes(normalizedId);

      return {
        ...current,
        allMasters: false,
        masters: alreadySelected
          ? selectedMasters.filter((id) => id !== normalizedId)
          : [...selectedMasters, normalizedId],
      };
    });

    clearError();
  }

  async function handleAddServiceCategory(event) {
    event.preventDefault();
    setError("");

    const studioId = createdStudio?.id;
    const categoryName = String(newServiceCategoryName || "").trim();

    if (!studioId) {
      setError("Спочатку потрібно зберегти студію.");
      return;
    }

    if (!categoryName) {
      setError("Введіть назву категорії послуг.");
      return;
    }

    const duplicate = createdServiceCategories.some(
      (item) =>
        String(item.name || "").trim().toLocaleLowerCase("uk") ===
        categoryName.toLocaleLowerCase("uk"),
    );

    if (duplicate) {
      setError("Категорія з такою назвою вже додана.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login-owner", { replace: true });
      return;
    }

    try {
      setServiceCategoryAdding(true);

      const response = await api(`/studio/${studioId}/categories`, {
        method: "POST",
        token,
        body: { name: categoryName },
      });
      const createdCategory = response?.category || response;

      if (!createdCategory?.id) {
        throw new Error("Сервер не повернув створену категорію.");
      }

      setCreatedServiceCategories((current) => [
        ...current,
        createdCategory,
      ]);
      setServiceForm((current) => ({
        ...current,
        categoryId: createdCategory.id,
      }));
      setNewServiceCategoryName("");

      window.dispatchEvent(new Event("studio-changed"));
    } catch (categoryError) {
      setError(categoryError?.message || "Не вдалося додати категорію.");
    } finally {
      setServiceCategoryAdding(false);
    }
  }

  async function handleAddService(event) {
    event.preventDefault();
    setError("");

    const studioId = createdStudio?.id;
    const serviceName = String(serviceForm.name || "").trim();
    const rawPrice = String(serviceForm.price ?? "").trim();
    const price = Number(rawPrice);
    const duration = Number(serviceForm.duration || 60);
    const selectedMasters = Array.isArray(serviceForm.masters)
      ? serviceForm.masters.map(String)
      : [];

    if (!studioId) {
      setError("Спочатку потрібно зберегти студію.");
      return;
    }

    if (!serviceName) {
      setError("Введіть назву послуги.");
      return;
    }

    if (!rawPrice || !Number.isFinite(price) || price < 0) {
      setError("Введіть коректну вартість послуги.");
      return;
    }

    if (!Number.isFinite(duration) || duration < 5 || duration > 240) {
      setError("Тривалість послуги має бути від 5 хвилин до 4 годин.");
      return;
    }

    if (!serviceForm.allMasters && selectedMasters.length === 0) {
      setError("Оберіть хоча б одного майстра.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login-owner", { replace: true });
      return;
    }

    const payload = {
      categoryId:
        serviceForm.categoryId === UNCATEGORIZED_SERVICE_ID
          ? null
          : serviceForm.categoryId,
      name: serviceName,
      duration,
      price,
      allMasters: Boolean(serviceForm.allMasters),
      masters: serviceForm.allMasters ? [] : selectedMasters,
    };

    try {
      setServiceAdding(true);

      const response = await api(`/studio/${studioId}/services`, {
        method: "POST",
        token,
        body: { service: payload },
      });
      const createdService = response?.service || response;
      const selectedCategory = createdServiceCategories.find(
        (item) => String(item.id) === String(serviceForm.categoryId),
      );

      setCreatedServices((current) => [
        {
          ...createdService,
          id: createdService?.id || `local-service-${Date.now()}`,
          name: createdService?.name || serviceName,
          duration: Number(createdService?.duration || duration),
          price: Number(createdService?.price ?? price),
          categoryId: payload.categoryId,
          categoryName: selectedCategory?.name || "Без категорії",
          allMasters: payload.allMasters,
          masters: payload.masters,
        },
        ...current,
      ]);

      setServiceForm((current) => ({
        categoryId: current.categoryId,
        name: "",
        duration: 60,
        price: "",
        allMasters: true,
        masters: [],
      }));

      window.dispatchEvent(new Event("studio-changed"));
    } catch (serviceError) {
      setError(serviceError?.message || "Не вдалося додати послугу.");
    } finally {
      setServiceAdding(false);
    }
  }

  function finishStudioSetup() {
    setError("");
    setSetupCompleted(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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
{setupCompleted ? (
  <div
    className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#202020]/50 p-4 backdrop-blur-[7px]"
    role="presentation"
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="studio-created-title"
      className="relative w-full max-w-[620px] overflow-hidden rounded-[30px] border border-[#eadfce] bg-white px-5 pb-8 pt-14 text-center shadow-[0_35px_110px_rgba(15,23,42,0.30)] sm:rounded-[34px] sm:px-10 sm:pb-10 sm:pt-16"
    >
      {/* Помаранчева лінія зверху */}
      <div className="absolute inset-x-0 top-0 h-[3px] bg-[#ff6200]" />

      {/* Закрити */}
      <button
        type="button"
        onClick={() =>
          navigate("/dashboard/studio", { replace: true })
        }
        aria-label="Закрити"
        className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-[#e9e4de] bg-white text-[#202020] transition-all duration-300 hover:border-[#ff6200] hover:text-[#ff6200] active:scale-[0.95] sm:right-5 sm:top-5"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Іконка успіху */}
      <div className="relative mx-auto flex w-fit items-center justify-center">
        <span className="absolute -left-12 top-8 text-[#ffc79f]">
          <Sparkles className="h-6 w-6 stroke-[1.8]" />
        </span>

        <div className="grid h-[108px] w-[108px] place-items-center rounded-[28px] bg-[#fff0e7] text-[#ff6200]">
          <div className="grid h-12 w-12 place-items-center rounded-full border-2 border-[#ff6200]">
            <Check className="h-7 w-7 stroke-[2.8]" />
          </div>
        </div>

        <span className="absolute -right-12 top-1 text-[#ffc79f]">
          <Sparkles className="h-6 w-6 stroke-[1.8]" />
        </span>
      </div>

      <h1
        id="studio-created-title"
        className="mx-auto mt-8 max-w-[500px] text-[27px] font-black tracking-[-0.04em] text-[#111111] sm:text-[34px]"
      >
        Студію успішно створено!
      </h1>

      <p className="mx-auto mt-4 max-w-[470px] text-[13px] font-medium leading-6 text-[#77716b] sm:text-[15px] sm:leading-7">
        Вітаємо! Ваша студія вже створена. Далі рекомендуємо додати
        майстрів і послуги, щоб клієнти могли почати запис онлайн.
      </p>

      <button
        type="button"
        onClick={() =>
          navigate("/dashboard/studio", { replace: true })
        }
        className="group mx-auto mt-10 inline-flex h-[54px] w-full max-w-[430px] items-center justify-center gap-3 rounded-[15px] bg-[#faf9f7] px-5 text-[14px] font-black text-[#5f5a55] transition-all duration-300 hover:bg-[#fff2e9] hover:text-[#ff6200] active:scale-[0.98]"
      >
        <LayoutDashboard className="h-5 w-5" />
        Перейти до панелі студії
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </button>
    </div>
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
                    {loading ? "Збереження..." : "Зберегти та продовжити"}
                  </ContinueButton>
                </div>
              </form>
            )}

            {step === 6 && (
              <div className="mt-6 space-y-5">
                <form
                  onSubmit={handleAddMaster}
                  className="space-y-5 rounded-[22px] border border-[#ebe7df] bg-[#fcfaf7] p-4 sm:p-5"
                >
                  <div className="flex items-center gap-4">
                    <MasterAvatar
                      name={masterForm.name || "Майстер"}
                      photoUrl={masterPhotoPreviewUrl}
                    />

                    <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                      <label className="cursor-pointer">
                        <span className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-[#eadfce] bg-white px-4 text-[12px] font-black text-[#202020] transition hover:border-[#ff6200] hover:text-[#ff6200]">
                          <Camera className="h-4 w-4" />
                          Додати фото
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePickMasterPhoto}
                          disabled={masterAdding}
                          className="hidden"
                        />
                      </label>

                      {masterForm.photoFile && (
                        <button
                          type="button"
                          onClick={clearMasterPhoto}
                          disabled={masterAdding}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-[#ffd6bd] bg-[#fff1e8] px-4 text-[12px] font-black text-[#ff5a00] transition hover:border-[#ff5a00] disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Прибрати
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-[12px] font-black text-[#202020]">
                      Імʼя майстра
                    </label>
                    <input
                      value={masterForm.name}
                      onChange={(event) =>
                        updateMasterForm("name", event.target.value)
                      }
                      disabled={masterAdding}
                      placeholder="Напр. Наталія Коваль"
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[12px] font-black text-[#202020]">
                      Посада / спеціалізація
                    </label>
                    <input
                      value={masterForm.role}
                      onChange={(event) =>
                        updateMasterForm("role", event.target.value)
                      }
                      disabled={masterAdding}
                      placeholder="Напр. Стиліст або барбер"
                      className={inputClassName}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={
                      masterAdding || !String(masterForm.name || "").trim()
                    }
                    className="group inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[15px] bg-[#202020] px-4 text-[14px] font-black text-white transition-all duration-300 hover:scale-[1.01] hover:bg-[#ff6200] active:scale-[0.98] disabled:pointer-events-none disabled:bg-[#f1ebe4] disabled:text-[#aaa19a]"
                  >
                    <Plus className="h-4 w-4" />
                    {masterAdding ? "Додаємо..." : "Додати майстра"}
                  </button>
                </form>

                {createdMasters.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[12px] font-black uppercase tracking-[0.12em] text-[#9a928a]">
                        Додані майстри
                      </p>
                      <span className="rounded-full bg-[#fff1e8] px-2.5 py-1 text-[11px] font-black text-[#ff6200]">
                        {createdMasters.length}
                      </span>
                    </div>

                    {createdMasters.map((master) => (
                      <div
                        key={master.id}
                        className="flex items-center gap-3 rounded-[18px] border border-[#ebe7df] bg-white p-3.5"
                      >
                        <MasterAvatar
                          name={master.name}
                          photoUrl={master.photoUrl}
                          className="h-14 w-14 rounded-[17px]"
                        />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-black text-[#202020]">
                            {master.name}
                          </p>
                          <p className="mt-0.5 truncate text-[12px] font-medium text-[#77716b]">
                            {master.role || "Спеціалізацію не вказано"}
                          </p>
                        </div>

                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#edf9f0] text-[#2f9e55]">
                          <Check className="h-4 w-4" />
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <ErrorMessage>{error}</ErrorMessage>

                <div className="grid grid-cols-[auto_1fr] gap-3">
                  <BackButton
                    onClick={() => goToStep(5)}
                    disabled={masterAdding}
                  />

<button
  type="button"
  onClick={() => goToStep(7)}
  disabled={masterAdding}
  className="
    group inline-flex h-[52px] w-full
    items-center justify-center gap-2
    rounded-[15px]
    bg-[#202020] px-4
    text-[14px] font-black text-white
    transition-all duration-300
    hover:scale-[1.015]
    hover:bg-[#ff6200]
    active:scale-[0.98]
    disabled:pointer-events-none
    disabled:bg-[#f1ebe4]
    disabled:text-[#aaa19a]
    disabled:shadow-none
  "
>
  {createdMasters.length > 0 ? "Продовжити" : "Пропустити"}

  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
</button>
                </div>
              </div>
            )}

            {step === 7 && (
              <div className="mt-6 space-y-5">
                <form
                  onSubmit={handleAddServiceCategory}
                  className="rounded-[22px] border border-[#ebe7df] bg-[#fcfaf7] p-4 sm:p-5"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-[#fff1e8] text-[#ff6200]">
                      <Tags className="h-5 w-5" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-black text-[#202020]">
                        Категорії послуг
                      </p>
                      <p className="mt-0.5 text-[11px] font-medium leading-5 text-[#77716b]">
                        Необов’язково. Наприклад: Волосся, Манікюр або Масаж.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                    <input
                      value={newServiceCategoryName}
                      onChange={(event) => {
                        setNewServiceCategoryName(event.target.value);
                        clearError();
                      }}
                      disabled={serviceCategoryAdding || serviceAdding}
                      placeholder="Назва категорії"
                      className={inputClassName}
                    />

                    <button
                      type="submit"
                      disabled={
                        serviceCategoryAdding ||
                        serviceAdding ||
                        !String(newServiceCategoryName || "").trim()
                      }
                      className="grid h-14 w-14 place-items-center rounded-[17px] bg-[#202020] text-white transition hover:bg-[#ff6200] active:scale-[0.98] disabled:pointer-events-none disabled:bg-[#e4ddd6] disabled:text-[#aaa19a]"
                      aria-label="Додати категорію"
                    >
                      {serviceCategoryAdding ? (
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      ) : (
                        <Plus className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  {createdServiceCategories.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {createdServiceCategories.map((serviceCategory) => (
                        <button
                          key={serviceCategory.id}
                          type="button"
                          onClick={() =>
                            updateServiceForm("categoryId", serviceCategory.id)
                          }
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-[11px] font-black transition-colors",
                            String(serviceForm.categoryId) ===
                              String(serviceCategory.id)
                              ? "border-[#ff6200] bg-[#ff6200] text-white"
                              : "border-[#eadfce] bg-white text-[#77716b] hover:border-[#ff6200] hover:text-[#ff6200]",
                          )}
                        >
                          {serviceCategory.name}
                        </button>
                      ))}
                    </div>
                  )}
                </form>

                <form
                  onSubmit={handleAddService}
                  className="space-y-5 rounded-[22px] border border-[#ebe7df] bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.04)] sm:p-5"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-[#fff1e8] text-[#ff6200]">
                      <Scissors className="h-5 w-5" />
                    </span>

                    <div className="min-w-0">
                      <p className="text-[14px] font-black text-[#202020]">
                        Нова послуга
                      </p>
                      <p className="mt-0.5 text-[11px] font-medium text-[#77716b]">
                        Заповніть основні дані для онлайн-запису.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 flex items-center gap-2 text-[12px] font-black text-[#202020]">
                      <FilePenLine className="h-4 w-4 text-[#ff6200]" />
                      Назва послуги
                    </label>
                    <input
                      value={serviceForm.name}
                      onChange={(event) =>
                        updateServiceForm("name", event.target.value)
                      }
                      disabled={serviceAdding || serviceCategoryAdding}
                      placeholder="Напр. Жіноча стрижка"
                      className={inputClassName}
                    />
                  </div>

                  <div className="grid grid-cols-[minmax(0,1fr)_130px] gap-3 sm:grid-cols-2">
                    <div className="min-w-0">
                      <label className="mb-2 flex items-center gap-2 text-[12px] font-black text-[#202020]">
                        <BriefcaseBusiness className="h-4 w-4 text-[#ff6200]" />
                        Категорія
                      </label>
                      <ServiceCategorySelect
                        value={serviceForm.categoryId}
                        categories={createdServiceCategories}
                        onChange={(value) =>
                          updateServiceForm("categoryId", value)
                        }
                        disabled={serviceAdding || serviceCategoryAdding}
                      />
                    </div>

                    <div className="min-w-0">
                      <label className="mb-2 flex items-center gap-2 text-[12px] font-black text-[#202020]">
                        <Banknote className="h-4 w-4 text-[#ff6200]" />
                        Ціна (грн)
                      </label>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="1"
                        value={serviceForm.price}
                        onChange={(event) =>
                          updateServiceForm("price", event.target.value)
                        }
                        disabled={serviceAdding || serviceCategoryAdding}
                        placeholder="0"
                        className={inputClassName}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-3 flex items-center gap-2 text-[12px] font-black text-[#202020]">
                      <Clock className="h-4 w-4 text-[#ff6200]" />
                      Тривалість
                    </label>

                    <div className="grid grid-cols-[1fr_auto] gap-3">
                      <div className="flex h-14 items-center justify-center rounded-[17px] border border-[#eadfce] bg-[#fff1e8] px-4 text-center">
                        <span className="text-[16px] font-black text-[#202020]">
                          {formatServiceDuration(serviceForm.duration)}
                        </span>
                      </div>

                      <div className="flex h-14 items-center gap-2 rounded-[17px] border border-[#eadfce] bg-white px-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateServiceForm(
                              "duration",
                              Math.max(5, serviceForm.duration - 5),
                            )
                          }
                          disabled={serviceAdding || serviceForm.duration <= 5}
                          className="grid h-10 w-10 place-items-center rounded-[13px] bg-[#fff1e8] text-[20px] font-black text-[#ff6200] transition hover:bg-[#ff6200] hover:text-white disabled:pointer-events-none disabled:opacity-35"
                          aria-label="Зменшити тривалість"
                        >
                          −
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            updateServiceForm(
                              "duration",
                              Math.min(240, serviceForm.duration + 5),
                            )
                          }
                          disabled={serviceAdding || serviceForm.duration >= 240}
                          className="grid h-10 w-10 place-items-center rounded-[13px] bg-[#fff1e8] text-[20px] font-black text-[#ff6200] transition hover:bg-[#ff6200] hover:text-white disabled:pointer-events-none disabled:opacity-35"
                          aria-label="Збільшити тривалість"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {[30, 45, 60, 90, 120, 180].map((duration) => (
                        <button
                          key={duration}
                          type="button"
                          onClick={() => updateServiceForm("duration", duration)}
                          disabled={serviceAdding}
                          className={cn(
                            "rounded-full px-3 py-1.5 text-[11px] font-black transition-colors",
                            serviceForm.duration === duration
                              ? "bg-[#ff6200] text-white"
                              : "bg-[#f7f3ee] text-[#77716b] hover:bg-[#fff1e8] hover:text-[#ff6200]",
                          )}
                        >
                          {formatServiceDuration(duration)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[18px] border border-[#eadfce] bg-[#fcfaf7] p-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#ff6200]" />
                      <p className="text-[12px] font-black text-[#202020]">
                        Виконавці
                      </p>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setServiceForm((current) => ({
                            ...current,
                            allMasters: true,
                            masters: [],
                          }))
                        }
                        disabled={serviceAdding}
                        className={cn(
                          "h-11 rounded-[14px] border text-[11px] font-black transition-colors",
                          serviceForm.allMasters
                            ? "border-[#ff6200] bg-[#ff6200] text-white"
                            : "border-[#eadfce] bg-white text-[#77716b] hover:border-[#ff6200] hover:text-[#ff6200]",
                        )}
                      >
                        Всі майстри
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          createdMasters.length > 0 &&
                          setServiceForm((current) => ({
                            ...current,
                            allMasters: false,
                            masters: current.masters || [],
                          }))
                        }
                        disabled={serviceAdding || createdMasters.length === 0}
                        className={cn(
                          "h-11 rounded-[14px] border text-[11px] font-black transition-colors disabled:pointer-events-none disabled:opacity-45",
                          !serviceForm.allMasters
                            ? "border-[#ff6200] bg-[#ff6200] text-white"
                            : "border-[#eadfce] bg-white text-[#77716b] hover:border-[#ff6200] hover:text-[#ff6200]",
                        )}
                      >
                        Обрати майстрів
                      </button>
                    </div>

                    {createdMasters.length === 0 && (
                      <p className="mt-3 text-[11px] font-medium leading-5 text-[#9a928a]">
                        Майстрів не додано. Послуга буде доступна для всіх майстрів,
                        яких ви створите пізніше.
                      </p>
                    )}

                    {!serviceForm.allMasters && createdMasters.length > 0 && (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {createdMasters.map((master) => {
                          const masterId = String(master.id ?? master.name);
                          const checked = serviceForm.masters
                            .map(String)
                            .includes(masterId);

                          return (
                            <button
                              key={masterId}
                              type="button"
                              onClick={() => toggleServiceMaster(masterId)}
                              disabled={serviceAdding}
                              className={cn(
                                "flex min-w-0 items-center gap-3 rounded-[15px] border p-2.5 text-left transition-colors",
                                checked
                                  ? "border-[#ff6200] bg-[#fff1e8]"
                                  : "border-[#eadfce] bg-white hover:border-[#ffd6bd]",
                              )}
                            >
                              <MasterAvatar
                                name={master.name}
                                photoUrl={master.photoUrl}
                                className="h-10 w-10 rounded-[13px]"
                              />

                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[12px] font-black text-[#202020]">
                                  {master.name}
                                </span>
                                <span className="mt-0.5 block truncate text-[10px] font-medium text-[#77716b]">
                                  {master.role || "Майстер"}
                                </span>
                              </span>

                              <span
                                className={cn(
                                  "grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                                  checked
                                    ? "border-[#ff6200] bg-[#ff6200] text-white"
                                    : "border-[#d8d2ca] bg-white text-transparent",
                                )}
                              >
                                <Check className="h-3.5 w-3.5 stroke-[3]" />
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={
                      serviceAdding ||
                      serviceCategoryAdding ||
                      !String(serviceForm.name || "").trim() ||
                      !String(serviceForm.price ?? "").trim() ||
                      (!serviceForm.allMasters &&
                        serviceForm.masters.length === 0)
                    }
                    className="group inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[15px] bg-[#202020] px-4 text-[14px] font-black text-white transition-all duration-300 hover:scale-[1.01] hover:bg-[#ff6200] active:scale-[0.98] disabled:pointer-events-none disabled:bg-[#f1ebe4] disabled:text-[#aaa19a]"
                  >
                    <Plus className="h-4 w-4" />
                    {serviceAdding ? "Додаємо..." : "Додати послугу"}
                  </button>
                </form>

                {createdServices.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[12px] font-black uppercase tracking-[0.12em] text-[#9a928a]">
                        Додані послуги
                      </p>
                      <span className="rounded-full bg-[#fff1e8] px-2.5 py-1 text-[11px] font-black text-[#ff6200]">
                        {createdServices.length}
                      </span>
                    </div>

                    {createdServices.map((service) => {
                      const mastersCount = Array.isArray(service.masters)
                        ? service.masters.length
                        : 0;

                      return (
                        <div
                          key={service.id}
                          className="flex items-center gap-3 rounded-[18px] border border-[#ebe7df] bg-white p-3.5"
                        >
                          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[15px] bg-[#fff1e8] text-[#ff6200]">
                            <Scissors className="h-5 w-5" />
                          </span>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[14px] font-black text-[#202020]">
                              {service.name}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] font-medium text-[#77716b]">
                              {service.categoryName || "Без категорії"} ·{" "}
                              {formatServiceDuration(service.duration)} ·{" "}
                              {service.allMasters
                                ? "всі майстри"
                                : `${mastersCount} майстр.`}
                            </p>
                          </div>

                          <span className="shrink-0 text-[14px] font-black text-[#202020]">
                            {Number(service.price || 0).toLocaleString("uk-UA")} грн
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <ErrorMessage>{error}</ErrorMessage>

                <div className="grid grid-cols-[auto_1fr] gap-3">
                  <BackButton
                    onClick={() => goToStep(6)}
                    disabled={serviceAdding || serviceCategoryAdding}
                  />

<button
  type="button"
  onClick={finishStudioSetup}
  disabled={serviceAdding || serviceCategoryAdding}
  className="
    group inline-flex h-[52px] w-full
    items-center justify-center gap-2
    rounded-[15px]
    bg-[#202020] px-4
    text-[14px] font-black text-white
    transition-all duration-300
    hover:scale-[1.015]
    hover:bg-[#ff6200]
    active:scale-[0.98]
    disabled:pointer-events-none
    disabled:bg-[#f1ebe4]
    disabled:text-[#aaa19a]
    disabled:shadow-none
  "
>
  {createdServices.length > 0 ? "Завершити" : "Пропустити"}

  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
</button>
                </div>
              </div>
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
                  {cropModal.target === "master"
                    ? "Налаштуйте фото майстра"
                    : "Налаштуйте логотип"}
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