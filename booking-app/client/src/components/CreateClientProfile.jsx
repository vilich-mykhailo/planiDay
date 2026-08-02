// CreateClientProfile.jsx
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import Cropper from "react-easy-crop";
import {
  ArrowRight,
  Camera,
  Check,
  ChevronLeft,
  ImagePlus,
  LoaderCircle,
  Phone,
  UserRound,
  X,
} from "lucide-react";

import { api } from "../api/http";

const TOTAL_STEPS = 2;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

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

  if (!source || source === "+380") {
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

const PUBLIC_R2_URL = String(
  import.meta.env.VITE_R2_PUBLIC_BASE_URL || "",
).replace(/\/+$/, "");

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function toPublicUrl(value) {
  const source = String(value || "").trim();

  if (!source) return "";
  if (/^https?:\/\//i.test(source)) return source;

  return PUBLIC_R2_URL
    ? `${PUBLIC_R2_URL}/${source.replace(/^\/+/, "")}`
    : source;
}

function splitFullName(value) {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

function getInitials(firstName, lastName) {
  const first = String(firstName || "")
    .trim()
    .slice(0, 1)
    .toUpperCase();

  const last = String(lastName || "")
    .trim()
    .slice(0, 1)
    .toUpperCase();

  return `${first}${last}` || "U";
}

async function getCroppedImage(imageUrl, cropPixels) {
  const image = new window.Image();
  image.src = imageUrl;

  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => {
      reject(new Error("Не вдалося прочитати фотографію."));
    };
  });

  const canvas = document.createElement("canvas");

  canvas.width = 900;
  canvas.height = 900;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Не вдалося обробити фотографію.");
  }

  context.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    900,
    900,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(
            new Error("Не вдалося створити обрізану фотографію."),
          );
          return;
        }

        resolve(
          new File([blob], "client-avatar.jpg", {
            type: "image/jpeg",
            lastModified: Date.now(),
          }),
        );
      },
      "image/jpeg",
      0.84,
    );
  });
}

async function uploadClientPhoto(file, token) {
  const formData = new FormData();

  formData.append("file", file);

  const apiBaseUrl = String(
    import.meta.env.VITE_API_URL || "",
  ).replace(/\/+$/, "");

  const response = await fetch(
    `${apiBaseUrl}/media/client`,
    {
      method: "POST",
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
      body: formData,
    },
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "Не вдалося завантажити фотографію.",
    );
  }

  if (!data?.key && !data?.url) {
    throw new Error(
      "Сервер не повернув адресу завантаженої фотографії.",
    );
  }

  return data;
}

function FormField({
  label,
  optional = false,
  error = false,
  ...inputProps
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-[13px] font-black text-[#202020] sm:text-[14px]">
          {label}
        </span>

        {optional && (
          <span className="text-[10px] font-bold text-[#aaa19a] sm:text-[11px]">
            Необов’язково
          </span>
        )}
      </div>

      <input
        {...inputProps}
        className={cn(
          "h-[50px] w-full rounded-[15px] border bg-white px-4",
          "text-[14px] font-bold text-[#202020] outline-none",
          "placeholder:text-[#b8afa5]",
          "transition-all duration-200",
          error
            ? "border-[#ef4444] ring-4 ring-[#ef4444]/10"
            : "border-[#eadfce] focus:border-[#ff6200] focus:ring-4 focus:ring-[#ff6200]/10",
        )}
      />
    </label>
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

export default function CreateClientProfile() {
  const navigate = useNavigate();
  const photoInputRef = useRef(null);
const [step, setStep] = useState(1);
const [form, setForm] = useState({
  firstName: "",
  lastName: "",
  phone: "+380",
});

  const [existingPhotoKey, setExistingPhotoKey] =
    useState("");

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] =
    useState("");

  const [initialLoading, setInitialLoading] =
    useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [profileCreated, setProfileCreated] = useState(false);

  const [cropModal, setCropModal] = useState({
    open: false,
    imageUrl: "",
  });

  const [crop, setCrop] = useState({
    x: 0,
    y: 0,
  });

  const [zoom, setZoom] = useState(1);

  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState(null);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(photoFile);

    setPhotoPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [photoFile]);

  useEffect(() => {
    let cancelled = false;

    async function loadClientProfile() {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login", {
          replace: true,
        });

        return;
      }

      try {
        setInitialLoading(true);

        const data = await api("/client/me", {
          token,
        });

        if (cancelled) return;

        const nameFromAccount = splitFullName(data?.name);

setForm({
  firstName:
    data?.firstName ||
    nameFromAccount.firstName ||
    "",
  lastName:
    data?.lastName ||
    nameFromAccount.lastName ||
    "",
  phone: data?.phone || "+380",
});

        setExistingPhotoKey(data?.photoUrl || "");
      } catch (loadError) {
        if (cancelled) return;

        setError(
          loadError?.message ||
            "Не вдалося завантажити дані профілю.",
        );
      } finally {
        if (!cancelled) {
          setInitialLoading(false);
        }
      }
    }

    loadClientProfile();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const closeCropModal = useCallback(() => {
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
}, [cropModal.imageUrl]);

  useEffect(() => {
    if (!cropModal.open) return undefined;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleEscape(event) {
      if (event.key === "Escape" && !saving) {
        closeCropModal();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
}, [cropModal.open, saving, closeCropModal]);

  useEffect(() => {
    if (!profileCreated) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [profileCreated]);

  const photoSrc =
    photoPreviewUrl ||
    toPublicUrl(existingPhotoKey);

  const initials = useMemo(
    () =>
      getInitials(
        form.firstName,
        form.lastName,
      ),
    [form.firstName, form.lastName],
  );


  function handlePhotoChange(event) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    setError("");

    if (file.size > MAX_IMAGE_SIZE) {
      setError(
        "Фотографія повинна бути не більше 5 MB.",
      );
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setError(
        "Дозволені формати фотографій: JPG, PNG або WEBP.",
      );
      return;
    }

    if (cropModal.imageUrl) {
      URL.revokeObjectURL(cropModal.imageUrl);
    }

    const imageUrl = URL.createObjectURL(file);

    setCrop({
      x: 0,
      y: 0,
    });

    setZoom(1);
    setCroppedAreaPixels(null);

    setCropModal({
      open: true,
      imageUrl,
    });
  }

  async function confirmCrop() {
    if (
      !cropModal.imageUrl ||
      !croppedAreaPixels
    ) {
      setError(
        "Не вдалося визначити область фотографії.",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const croppedFile =
        await getCroppedImage(
          cropModal.imageUrl,
          croppedAreaPixels,
        );

      setPhotoFile(croppedFile);
      closeCropModal();
    } catch (cropError) {
      setError(
        cropError?.message ||
          "Не вдалося обрізати фотографію.",
      );
    } finally {
      setSaving(false);
    }
  }

function validateFirstStep() {
  const firstName = form.firstName.trim();
  const lastName = form.lastName.trim();

  if (!firstName) {
    return "Введіть ваше ім’я.";
  }

  if (firstName.length < 2) {
    return "Ім’я повинно містити щонайменше 2 символи.";
  }

  if (firstName.length > 50) {
    return "Ім’я не може містити більше 50 символів.";
  }

  if (lastName.length > 50) {
    return "Прізвище не може містити більше 50 символів.";
  }

  return "";
}

function handleFirstStepSubmit(event) {
  event.preventDefault();

  setError("");

  const validationError = validateFirstStep();

  if (validationError) {
    setError(validationError);
    return;
  }

  setStep(2);
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

async function handleFinalSubmit(event) {
  event.preventDefault();

  setError("");

  const identityError = validateFirstStep();

  if (identityError) {
    setError(identityError);
    setStep(1);
    return;
  }

  const phoneError = getPhoneValidationError(form.phone);

  if (phoneError) {
    setError(phoneError);
    return;
  }

  const token = localStorage.getItem("token");

  if (!token) {
    navigate("/login", {
      replace: true,
    });

    return;
  }

  try {
    setSaving(true);

    let nextPhotoKey = existingPhotoKey || null;

    if (photoFile) {
      const uploaded = await uploadClientPhoto(
        photoFile,
        token,
      );

      nextPhotoKey =
        uploaded.key ||
        uploaded.url ||
        null;
    }

    await api("/client/me", {
      method: "PATCH",
      token,
      body: {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim() || null,
        phone: normalizePhone(form.phone),
        photoUrl: nextPhotoKey,
      },
    });

    window.dispatchEvent(
      new Event("auth-changed"),
    );

    setExistingPhotoKey(nextPhotoKey || "");
    setProfileCreated(true);
  } catch (submitError) {
    setError(
      submitError?.message ||
        "Не вдалося зберегти дані профілю.",
    );
  } finally {
    setSaving(false);
  }
}

const currentStepContent =
  step === 1
    ? {
        label: "Реєстрація профілю",
        title: "Розкажіть про себе",
        description:
          "Додайте фотографію та вкажіть ваше ім’я. Так студіям буде простіше впізнати вас.",
        icon: UserRound,
      }
    : {
        label: "Контактні дані",
        title: "Номер телефону",
        description:
          "Вкажіть номер телефону для зв’язку зі студіями та отримання інформації про записи.",
        icon: Phone,
      };

const CurrentStepIcon = currentStepContent.icon;

  if (initialLoading) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center px-3 py-8">
        <div className="flex items-center gap-3 rounded-[20px] border border-[#eadfce] bg-white px-6 py-5 text-[#77716b] shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <LoaderCircle className="h-5 w-5 animate-spin text-[#ff6200]" />

          <span className="text-[13px] font-black">
            Завантаження профілю…
          </span>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="flex min-h-[100dvh] items-center justify-center px-2 py-2 lg:py-10">
        <section
          className={cn(
            "w-full max-w-[620px] overflow-hidden rounded-[28px] border border-[#eadfce] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.10)]",
            "sm:rounded-[36px]",
          )}
        >
          <div className="h-[4px] bg-[#ff6200]" />

          <div className="p-6 sm:p-9">
            <div className="text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-[18px] bg-[#fff1e8] text-[#ff6200]">
                <CurrentStepIcon className="h-9 w-9" />
              </div>

              <h1 className="mt-2 text-[25px] font-black tracking-[-0.04em] text-[#202020] sm:mt-5 sm:text-[34px] lg:mt-5">
                {currentStepContent.title}
              </h1>

              <p className="mx-auto max-w-[440px] text-[13px] font-medium leading-5 text-[#77716b] sm:mt-2 sm:text-[15px] sm:leading-6 lg:mt-2">
                {currentStepContent.description}
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
                onSubmit={handleFirstStepSubmit}
                className="mt-6 space-y-6"
              >
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-[13px] font-black text-[#202020]">
                      Фото профілю
                    </span>

                    <span className="text-[10px] font-bold text-[#9a928a]">
                      Необов’язково
                    </span>
                  </div>

                  <div className="rounded-[22px] border border-[#eadfce] bg-[#fcfaf7] p-4 sm:p-5">
                    <div className="flex flex-col items-center text-center">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => photoInputRef.current?.click()}
                          className="group relative grid h-28 w-28 place-items-center overflow-hidden rounded-full border-[4px] border-white bg-[#f1ede8] shadow-[0_14px_34px_rgba(15,23,42,0.12)] transition-all duration-300 hover:scale-[1.035] active:scale-[0.98] sm:h-32 sm:w-32"
                          aria-label={
                            photoSrc
                              ? "Змінити фото профілю"
                              : "Додати фото профілю"
                          }
                        >
                          {photoSrc ? (
                            <>
                              <img
                                src={photoSrc}
                                alt="Фото профілю"
                                className="h-full w-full object-cover"
                              />

                              <span className="absolute inset-0 grid place-items-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/45 group-hover:opacity-100">
                                <Camera className="h-6 w-6" />
                              </span>
                            </>
                          ) : (
                            <>
                              <div className="absolute inset-0 bg-[linear-gradient(135deg,#fbfaf8_0%,#f2ede7_45%,#e7ddd3_100%)]" />

                              <span className="relative text-[34px] font-black tracking-[-0.06em] text-[#77716b]">
                                {initials}
                              </span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => photoInputRef.current?.click()}
                          className="absolute bottom-0 right-0 grid h-10 w-10 place-items-center rounded-full border-[4px] border-[#fcfaf7] bg-[#ff6200] text-white shadow-[0_8px_22px_rgba(255,98,0,0.24)] transition hover:scale-110 hover:bg-[#202020] active:scale-[0.96]"
                          aria-label="Вибрати фото"
                        >
                          <Camera className="h-4 w-4" />
                        </button>
                      </div>

                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="mt-4 inline-flex items-center gap-2 text-[12px] font-black text-[#ff6200] transition hover:text-[#202020]"
                      >
                        <ImagePlus className="h-4 w-4" />

                        {photoSrc ? "Змінити фото" : "Додати фото"}
                      </button>

                      <p className="mt-1.5 text-[10px] font-semibold text-[#aaa19a]">
                        JPG, PNG або WEBP · до 5 MB
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 flex items-center justify-between gap-3 text-[13px] font-black text-[#202020]">
                      <span>Ім’я</span>

                      <span className="text-[10px] text-[#ff6200]">
                        Обов’язково
                      </span>
                    </span>

                    <div
                      className={cn(
                        "flex h-14 items-center gap-3 rounded-[17px] border bg-white px-4 transition-all",
                        error && !form.firstName.trim()
                          ? "border-[#ef4444] ring-4 ring-[#ef4444]/10"
                          : "border-[#eadfce] hover:border-[#ffd6bd] focus-within:border-[#ff6200] focus-within:ring-4 focus-within:ring-[#ff6200]/10",
                      )}
                    >
                      <UserRound className="h-5 w-5 shrink-0 text-[#8a847d]" />

                      <input
                        value={form.firstName}
                        onChange={(event) => {
                          setError("");

                          setForm((current) => ({
                            ...current,
                            firstName: event.target.value,
                          }));
                        }}
                        maxLength={50}
                        placeholder="Наталія"
                        autoComplete="given-name"
                        className="min-w-0 flex-1 bg-transparent text-[14px] font-bold text-[#202020] outline-none placeholder:text-[#b8afa5]"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 flex items-center justify-between gap-3 text-[13px] font-black text-[#202020]">
                      <span>Прізвище</span>

                      <span className="text-[10px] text-[#9a928a]">
                        Необов’язково
                      </span>
                    </span>

                    <div className="flex h-14 items-center gap-3 rounded-[17px] border border-[#eadfce] bg-white px-4 transition-all hover:border-[#ffd6bd] focus-within:border-[#ff6200] focus-within:ring-4 focus-within:ring-[#ff6200]/10">
                      <UserRound className="h-5 w-5 shrink-0 text-[#8a847d]" />

                      <input
                        value={form.lastName}
                        onChange={(event) => {
                          setError("");

                          setForm((current) => ({
                            ...current,
                            lastName: event.target.value,
                          }));
                        }}
                        maxLength={50}
                        placeholder="Ковальчук"
                        autoComplete="family-name"
                        className="min-w-0 flex-1 bg-transparent text-[14px] font-bold text-[#202020] outline-none placeholder:text-[#b8afa5]"
                      />
                    </div>
                  </label>
                </div>

                <ErrorMessage>{error}</ErrorMessage>

                <button
                  type="submit"
                  disabled={!form.firstName.trim()}
                  className="group inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[15px] bg-[#202020] px-4 text-[14px] font-black text-white transition-all duration-300 hover:scale-[1.015] hover:bg-[#ff6200] active:scale-[0.98] disabled:pointer-events-none disabled:bg-[#f1ebe4] disabled:text-[#aaa19a] disabled:shadow-none"
                >
                  Продовжити

                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </form>
            )}

            {step === 2 && (
              <form
                onSubmit={handleFinalSubmit}
                className="mt-6 space-y-6"
              >
                <label className="block">
                  <span className="mb-2 flex items-center justify-between gap-3 text-[13px] font-black text-[#202020]">
                    <span>Номер телефону</span>

                    <span className="text-[10px] text-[#ff6200]">
                      Обов’язково
                    </span>
                  </span>

                  <div
                    className={cn(
                      "flex h-14 items-center gap-3 rounded-[17px] border bg-white px-4 transition-all",
                      error
                        ? "border-[#ef4444] ring-4 ring-[#ef4444]/10"
                        : "border-[#eadfce] hover:border-[#ffd6bd] focus-within:border-[#ff6200] focus-within:ring-4 focus-within:ring-[#ff6200]/10",
                    )}
                  >
                    <Phone className="h-5 w-5 shrink-0 text-[#8a847d]" />

                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(event) => {
                        setError("");

                        setForm((current) => ({
                          ...current,
                          phone: sanitizePhoneInput(event.target.value),
                        }));
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
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setStep(1);

                      window.scrollTo({
                        top: 0,
                        behavior: "smooth",
                      });
                    }}
                    disabled={saving}
                    className="inline-flex h-[52px] items-center justify-center gap-2 rounded-[15px] border border-[#eadfce] bg-white px-5 text-[13px] font-black text-[#202020] transition-all duration-300 hover:border-[#ff6200] hover:text-[#ff6200] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Назад
                  </button>

                  <button
                    type="submit"
                    disabled={
                      saving ||
                      !form.phone.trim() ||
                      form.phone.trim() === "+380"
                    }
                    className="group inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[15px] bg-[#202020] px-4 text-[14px] font-black text-white transition-all duration-300 hover:scale-[1.015] hover:bg-[#ff6200] active:scale-[0.98] disabled:pointer-events-none disabled:bg-[#f1ebe4] disabled:text-[#aaa19a] disabled:shadow-none"
                  >
                    {saving ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Збереження…
                      </>
                    ) : (
                      <>
                        Завершити

                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </main>
      {profileCreated && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#202020]/50 p-4 backdrop-blur-[7px] sm:p-6"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-created-title"
            className="relative w-full max-w-[520px] overflow-hidden rounded-[30px] border border-[#eadfce] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.26)] sm:rounded-[34px]"
          >
            <div className="h-[4px] bg-[#ff6200]" />

            <div className="relative overflow-hidden px-6 py-8 text-center sm:px-9 sm:py-10">
              <div className="pointer-events-none absolute right-[-70px] top-[-85px] h-[210px] w-[210px] rounded-full bg-[#ff6200]/10 blur-3xl" />
              <div className="pointer-events-none absolute bottom-[-100px] left-[-80px] h-[220px] w-[220px] rounded-full bg-[#ffb489]/15 blur-3xl" />

              <div className="relative">
                <div className="mx-auto grid h-[76px] w-[76px] place-items-center rounded-full bg-[#fff1e8] text-[#ff6200] shadow-[0_14px_34px_rgba(255,98,0,0.16)]">
                  <Check className="h-9 w-9 stroke-[3]" />
                </div>

                <p className="mt-5 text-[11px] font-black uppercase tracking-[0.16em] text-[#ff6200]">
                  Реєстрацію завершено
                </p>

                <h2
                  id="profile-created-title"
                  className="mt-2 text-[28px] font-black leading-[1.05] tracking-[-0.05em] text-[#202020] sm:text-[36px]"
                >
                  Профіль успішно створено!
                </h2>

                <p className="mx-auto mt-3 max-w-[390px] text-[13px] font-medium leading-6 text-[#77716b] sm:text-[15px]">
                  Ваші дані збережено. Тепер ви можете знаходити студії, бронювати послуги та керувати своїми записами.
                </p>

                <div className="mt-6 rounded-[20px] border border-[#eadfce] bg-[#fcfaf7] px-4 py-4">
                  <div className="flex items-center justify-center gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-white bg-[#f1ede8] shadow-[0_8px_22px_rgba(15,23,42,0.10)]">
                      {photoSrc ? (
                        <img
                          src={photoSrc}
                          alt="Фото профілю"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-[16px] font-black text-[#77716b]">
                          {initials}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 text-left">
                      <p className="truncate text-[15px] font-black text-[#202020]">
                        {[form.firstName.trim(), form.lastName.trim()]
                          .filter(Boolean)
                          .join(" ")}
                      </p>
                      <p className="mt-0.5 text-[11px] font-semibold text-[#9a928a]">
                        {normalizePhone(form.phone)}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/", {
                      replace: true,
                    })
                  }
                  className="group mt-6 inline-flex h-[54px] w-full items-center justify-center gap-2 rounded-[16px] bg-[#202020] px-5 text-[14px] font-black text-white transition-all duration-300 hover:scale-[1.015] hover:bg-[#ff6200] active:scale-[0.98]"
                >
                  Перейти на головну
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {cropModal.open && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-[#202020]/50 px-3 pb-3 backdrop-blur-[6px] sm:items-center sm:p-6">
          <div className="w-full max-w-[520px] overflow-hidden rounded-[28px] border border-[#eadfce] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.25)]">
            <div className="flex items-start justify-between gap-4 px-5 py-5 sm:px-6">
              <div>
                <h2 className="text-[24px] font-black tracking-[-0.04em] text-[#202020]">
                  Обрізати фотографію
                </h2>

                <p className="mt-1 text-[13px] font-medium text-[#77716b]">
                  Виберіть область, яка буде видима у профілі.
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={closeCropModal}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f6f3ef] text-[#77716b] transition hover:bg-[#202020] hover:text-white disabled:pointer-events-none disabled:opacity-50"
                aria-label="Закрити"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mx-4 h-[330px] overflow-hidden rounded-[24px] bg-black sm:mx-6 sm:h-[360px]">
              <div className="relative h-full w-full">
                <Cropper
                  image={cropModal.imageUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(
                    _,
                    croppedPixels,
                  ) => {
                    setCroppedAreaPixels(
                      croppedPixels,
                    );
                  }}
                />
              </div>
            </div>

            <div className="px-5 py-5 sm:px-6">
              <label className="block">
                <span className="text-[12px] font-black text-[#202020]">
                  Масштаб
                </span>

                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(event) =>
                    setZoom(
                      Number(event.target.value),
                    )
                  }
                  className="mt-3 w-full accent-[#ff6200]"
                />
              </label>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={closeCropModal}
                  className="h-[50px] rounded-[15px] border border-[#eadfce] bg-white text-[13px] font-black text-[#202020] transition hover:border-[#ff6200] hover:text-[#ff6200] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                >
                  Скасувати
                </button>

                <button
                  type="button"
                  disabled={
                    saving ||
                    !croppedAreaPixels
                  }
                  onClick={confirmCrop}
                  className="inline-flex h-[50px] items-center justify-center gap-2 rounded-[15px] bg-[#202020] text-[13px] font-black text-white transition hover:bg-[#ff6200] active:scale-[0.98] disabled:pointer-events-none disabled:bg-[#f1ebe4] disabled:text-[#aaa19a]"
                >
                  {saving ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Обробка…
                    </>
                  ) : (
                    "Застосувати"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}