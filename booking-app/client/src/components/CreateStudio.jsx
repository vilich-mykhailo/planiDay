// CreateStudio.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cropper from "react-easy-crop";
import {
  ArrowRight,
  Building2,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  DoorOpen,
  House,
  ImagePlus,
  Images,
  MapPin,
  MapPinned,
  Phone,
  Signpost,
  Tags,
  X,
} from "lucide-react";

import { api } from "../api/http";

const TOTAL_STEPS = 4;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_DESCRIPTION_LENGTH = 400;

const PHONE_REGEX = /^\+?\d[\d\s()-]{8,}$/;

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
    title: "Розкажіть про студію",
    description: "Оберіть категорію та додайте короткий опис",
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
      className="group inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[15px] bg-[#202020] px-4 text-[14px] font-black text-white shadow-[0_12px_26px_rgba(15,15,15,0.18)] transition-all duration-300 hover:scale-[1.015] hover:bg-[#ff6200] active:scale-[0.98] disabled:pointer-events-none disabled:bg-[#f1ebe4] disabled:text-[#aaa19a] disabled:shadow-none"
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
          placeholder="Почніть вводити місто або село"
          className={cn(className, "pl-11 pr-11")}
          autoComplete="off"
          autoCapitalize="words"
          spellCheck
          autoFocus
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
          Виберіть місто або село зі списку — введений вручну текст зберегти
          не можна.
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
              : "Спочатку виберіть місто або село"
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
          autoFocus
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

  const [coverFile, setCoverFile] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("");
  const [logoPreviewUrl, setLogoPreviewUrl] = useState("");

  const [loading, setLoading] = useState(false);
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

    const normalizedPhone = phone.trim();

    if (!normalizedPhone) {
      setError("Введіть номер телефону.");
      return;
    }

    if (!PHONE_REGEX.test(normalizedPhone)) {
      setError(
        "Введіть коректний номер телефону разом із кодом країни.",
      );
      return;
    }

    goToStep(4);
  }

  async function handleCreateStudio(event) {
    event?.preventDefault();
    setError("");

    const normalizedName = name.trim();
    const normalizedCategory = category.trim();
    const normalizedDescription = description.trim();
    const normalizedPhone = phone.trim();

    if (normalizedName.length < 2) {
      setError("Введіть назву студії.");
      setStep(1);
      return;
    }

    if (!normalizedPhone) {
      setError("Введіть номер телефону.");
      setStep(3);
      return;
    }

    if (!PHONE_REGEX.test(normalizedPhone)) {
      setError(
        "Введіть коректний номер телефону разом із кодом країни.",
      );
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
        setError("Оберіть місто або село зі списку.");
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
        phone: normalizedPhone,
        ...uploadedFields,
      };

      if (normalizedCategory) {
        body.category = normalizedCategory;
      }

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

      localStorage.setItem("studioId", updatedStudio.id);

      window.dispatchEvent(new Event("auth-changed"));
      window.dispatchEvent(new Event("studio-changed"));

      window.location.replace("/dashboard/studio");
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
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#faf8f5] px-4 py-8">
        <section className="w-full max-w-[620px] overflow-hidden rounded-[28px] border border-[#eadfce] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.10)] sm:rounded-[36px]">
          <div className="h-[4px] bg-[#ff6200]" />

          <div className="p-5 sm:p-9">
            <div className="text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-[18px] bg-[#fff1e8] text-[#ff6200]">
                <StepIcon className="h-7 w-7" />
              </div>

              <h1 className="mt-5 text-[25px] font-black tracking-[-0.04em] text-[#202020] sm:text-[34px]">
                {currentStep.title}
              </h1>

              <p className="mx-auto mt-2 max-w-[440px] text-[13px] font-medium leading-5 text-[#77716b] sm:text-[15px] sm:leading-6">
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
                      Логотип студії
                    </span>

                    <span className="text-[10px] font-bold text-[#9a928a]">
                      Необов’язково
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePickLogo}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="group relative grid h-28 w-28 place-items-center overflow-hidden rounded-full border-2 border-dashed border-[#dcd4cc] bg-[#faf8f5] transition-all duration-300 hover:scale-[1.025] hover:border-[#ff6200] hover:bg-[#fff7f1] sm:h-36 sm:w-36"
                    >
                      {logoPreviewUrl ? (
                        <>
                          <img
                            src={logoPreviewUrl}
                            alt="Логотип студії"
                            className="h-full w-full object-cover"
                          />

                          <span className="absolute inset-0 grid place-items-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/45 group-hover:opacity-100">
                            <Camera className="h-7 w-7" />
                          </span>
                        </>
                      ) : (
                        <span className="flex flex-col items-center gap-2 text-[#8a847d] transition group-hover:text-[#ff6200]">
                          <ImagePlus className="h-8 w-8" />

                          <span className="text-[12px] font-black">
                            Додати логотип
                          </span>
                        </span>
                      )}
                    </button>

                    <p className="mt-3 text-center text-[11px] font-medium text-[#9a928a]">
                      JPG, PNG або WEBP · до 10 MB
                    </p>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-[13px] font-black text-[#202020]">
                      Обкладинка студії
                    </span>

                    <span className="text-[10px] font-bold text-[#9a928a]">
                      Необов’язково · 16:9
                    </span>
                  </div>

                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePickCover}
                    className="hidden"
                  />

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
                      </span>
                    )}
                  </button>
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
                <label className="block">
                  <span className="mb-2 flex items-center justify-between gap-3 text-[13px] font-black text-[#202020]">
                    <span>Категорія</span>

                    <span className="text-[10px] text-[#9a928a]">
                      Необов’язково
                    </span>
                  </span>

                  <div className="relative flex h-14 items-center gap-3 rounded-[17px] border border-[#eadfce] bg-white px-4 transition-all focus-within:border-[#ff6200] focus-within:ring-4 focus-within:ring-[#ff6200]/10">
                    <Tags className="h-5 w-5 shrink-0 text-[#8a847d]" />

                    <select
                      value={category}
                      onChange={(event) => {
                        setCategory(event.target.value);
                        clearError();
                      }}
                      className={cn(
                        "min-w-0 flex-1 appearance-none bg-transparent pr-8 text-[14px] font-bold outline-none",
                        category ? "text-[#202020]" : "text-[#9a928a]",
                      )}
                    >
                      <option value="">Оберіть категорію</option>

                      {CATEGORIES.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#ff6200]" />
                  </div>
                </label>

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
                    autoFocus
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
                        setPhone(event.target.value);
                        clearError();
                      }}
                      placeholder="+48 123 456 789"
                      autoComplete="tel"
                      inputMode="tel"
                      autoFocus
                      className="min-w-0 flex-1 bg-transparent text-[14px] font-bold text-[#202020] outline-none placeholder:text-[#b8afa5]"
                    />
                  </div>

                  <p className="mt-2 text-[11px] font-medium leading-4 text-[#9a928a]">
                    Введіть номер разом із кодом країни.
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
                onSubmit={handleCreateStudio}
                className="mt-6 space-y-5"
              >
                <label className="block">
                  <span className="mb-2 flex items-center justify-between gap-3 text-[13px] font-black text-[#202020]">
                    <span>Місто або село</span>

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

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  <BackButton
                    onClick={() => goToStep(3)}
                    disabled={loading}
                  />

                  <ContinueButton disabled={loading}>
                    {loading ? "Створення..." : "Створити студію"}
                  </ContinueButton>
                </div>
              </form>
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