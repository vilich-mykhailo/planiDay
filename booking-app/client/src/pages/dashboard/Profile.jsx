// Profile.jsx
import React, { useMemo, useRef, useState } from "react";
import {
  Sparkles,
  User,
  Phone,
  Mail,
  CalendarDays,
  VenusAndMars,
  Camera,
  CheckCircle2,
  ShieldCheck,
  X,
} from "lucide-react";
import { api } from "../../api/http";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const PUBLIC = import.meta.env.VITE_R2_PUBLIC_BASE_URL;

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function toPublicUrl(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return PUBLIC ? `${PUBLIC}/${s}` : s;
}

function Field({ label, hint, icon, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-end justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {icon ? (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              {icon}
            </span>
          ) : null}

          <p className="truncate text-[13px] font-semibold text-stone-900 sm:text-sm">
            {label}
          </p>
        </div>

        {hint ? (
          <p className="shrink-0 text-[11px] text-stone-500 sm:text-xs">
            {hint}
          </p>
        ) : null}
      </div>

      {children}
    </div>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className={cx(
        "w-full rounded-2xl border border-stone-200 bg-white px-3.5 py-3 text-[14px] text-stone-800",
        "outline-none transition-all duration-200",
        "placeholder:text-stone-400",
        "focus:border-amber-300 focus:ring-4 focus:ring-amber-100",
        "sm:px-4 sm:text-sm",
        props.disabled &&
          "cursor-not-allowed bg-stone-100 text-stone-500 placeholder:text-stone-400",
        props.className,
      )}
    />
  );
}

function Select(props) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative">
      <select
        {...props}
        onFocus={(e) => {
          setOpen(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setOpen(false);
          props.onBlur?.(e);
        }}
        onChange={(e) => {
          props.onChange?.(e);
          setOpen(false);
        }}
        className={cx(
          "w-full appearance-none rounded-2xl border border-stone-200 bg-white px-3.5 py-3 pr-11 text-[14px] text-stone-800",
          "outline-none transition-all duration-200",
          "focus:border-amber-300 focus:ring-4 focus:ring-amber-100",
          "sm:px-4 sm:pr-12 sm:text-sm",
          props.className,
        )}
      >
        {props.children}
      </select>

      <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center sm:right-4">
        <svg
          className={cx(
            "h-4 w-4 text-stone-500 transition-transform duration-200 ease-out",
            open ? "rotate-180" : "rotate-0",
          )}
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M6 8l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

function Card({ title, subtitle, right, children }) {
  return (
    <section className="overflow-hidden rounded-[22px] border border-stone-200/60 bg-white shadow-[0_4px_20px_-6px_rgba(120,90,60,0.08)] sm:rounded-3xl">
      <div className="h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-70" />

      <div className="flex flex-col gap-3 border-b border-stone-100 px-3.5 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-6 sm:py-5 lg:px-8">
        <div className="min-w-0">
          <h2 className="text-[15px] font-black tracking-[-0.02em] text-stone-800 sm:text-lg">
            {title}
          </h2>

          {subtitle ? (
            <p className="mt-1 text-[13px] leading-5 text-stone-600 sm:text-sm sm:leading-6">
              {subtitle}
            </p>
          ) : null}
        </div>

        {right ? <div className="w-full shrink-0 sm:w-auto">{right}</div> : null}
      </div>

      <div className="px-3.5 py-4 sm:px-6 sm:py-6 lg:px-8">{children}</div>
    </section>
  );
}

function PrimaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[18px] px-4 py-3",
        "text-sm font-bold transition-all duration-200 active:scale-[0.98]",
        props.disabled
          ? "cursor-not-allowed border border-stone-200 bg-stone-100 text-stone-400 shadow-none"
          : "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-[0_10px_24px_rgba(74,93,78,0.22)] hover:from-emerald-700 hover:to-emerald-800 hover:shadow-md",
        props.className,
      )}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[18px] border px-4 py-3",
        "text-sm font-bold transition-all duration-200 active:scale-[0.98]",
        props.disabled
          ? "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400"
          : "border-stone-200 bg-white text-stone-700 hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-sm",
        props.className,
      )}
    >
      {children}
    </button>
  );
}

function SkeletonBlock({ className }) {
  return (
    <div className={cx("animate-pulse rounded-2xl bg-stone-100", className)} />
  );
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-2.5 pb-4 pt-18 sm:px-4 sm:pb-8 sm:pt-14 lg:pt-16">
        <div className="space-y-3 px-0 pt-2 sm:space-y-5 sm:pt-8 lg:pt-6">
          <section className="overflow-hidden rounded-[22px] border border-stone-200/60 bg-white shadow-[0_4px_20px_-6px_rgba(120,90,60,0.08)] sm:rounded-3xl">
            <div className="h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-70" />
            <div className="space-y-5 px-3.5 py-5 sm:space-y-6 sm:px-6 sm:py-6 lg:px-8">
              <div className="flex items-center gap-3.5 sm:gap-4">
                <SkeletonBlock className="h-18 w-18 rounded-[22px] sm:h-20 sm:w-20 sm:rounded-[24px]" />
                <div className="w-full max-w-xs space-y-2">
                  <SkeletonBlock className="h-5 w-36 sm:w-40" />
                  <SkeletonBlock className="h-4 w-24 sm:w-28" />
                </div>
              </div>

              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                <SkeletonBlock className="h-12 w-full" />
                <SkeletonBlock className="h-12 w-full" />
                <SkeletonBlock className="h-12 w-full" />
                <SkeletonBlock className="h-12 w-full" />
                <SkeletonBlock className="h-12 w-full" />
                <SkeletonBlock className="h-12 w-full" />
              </div>

              <SkeletonBlock className="h-12 w-full sm:w-44" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    birthDate: "",
    gender: "unknown",
    photoUrl: "",
  });

  const [initialProfile, setInitialProfile] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    birthDate: "",
    gender: "unknown",
    photoUrl: "",
  });

  const [changePhone, setChangePhone] = useState({
    newPhone: "",
    code: "",
  });

  const [changeEmail, setChangeEmail] = useState({
    newEmail: "",
    code: "",
  });

  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [pendingDeletePhotoKey, setPendingDeletePhotoKey] = useState("");

  const [errorModal, setErrorModal] = useState({
    open: false,
    title: "",
    message: "",
  });

  const fileRef = useRef(null);

  const initials = useMemo(() => {
    const a = (profile.firstName || "").trim().slice(0, 1).toUpperCase();
    const b = (profile.lastName || "").trim().slice(0, 1).toUpperCase();
    return (a + b).trim() || "U";
  }, [profile.firstName, profile.lastName]);

  const photoSrc = photoPreviewUrl || toPublicUrl(profile.photoUrl);

  const isDirty = useMemo(() => {
    return (
      initialProfile.firstName !== profile.firstName ||
      initialProfile.lastName !== profile.lastName ||
      initialProfile.birthDate !== profile.birthDate ||
      initialProfile.gender !== profile.gender ||
      initialProfile.photoUrl !== profile.photoUrl ||
      Boolean(photoFile)
    );
  }, [initialProfile, profile, photoFile]);

  React.useEffect(() => {
    if (!photoFile) {
      setPhotoPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(photoFile);
    setPhotoPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const updateProfile = (patch) => {
    setProfile((p) => ({ ...p, ...patch }));
    setIsSaved(false);
  };

  function stageDeletePhoto(key) {
    const k = String(key || "").trim();
    if (!k) return;
    if (/^https?:\/\//i.test(k)) return;
    setPendingDeletePhotoKey(k);
  }

  function onPickPhoto(file) {
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE) {
      setErrorModal({
        open: true,
        title: "Файл завеликий",
        message: "Оберіть фото до 5 MB.",
      });
      return;
    }

    if (!file.type?.startsWith("image/")) {
      setErrorModal({
        open: true,
        title: "Невірний формат",
        message: "Оберіть файл зображення.",
      });
      return;
    }

    setPhotoFile(file);
    setIsSaved(false);
  }

  function removePhoto() {
    if (profile.photoUrl) {
      stageDeletePhoto(profile.photoUrl);
    }

    setPhotoFile(null);
    setProfile((p) => ({ ...p, photoUrl: "" }));
    setIsSaved(false);
  }

  async function uploadClientPhoto(file, token) {
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch(`${import.meta.env.VITE_API_URL}/media/client`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.message || "Upload failed");
    }

    return data;
  }

  async function deleteFromR2(key) {
    const token = localStorage.getItem("token");

    const res = await fetch(`${import.meta.env.VITE_API_URL}/media/delete`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ key }),
    });

    if (!res.ok) {
      throw new Error("Delete failed");
    }
  }

  async function saveProfile(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setApiError("");

      const token = localStorage.getItem("token");

      let nextPhotoKey = profile.photoUrl || "";
      const deletesAfterSave = [];

      if (photoFile) {
        const out = await uploadClientPhoto(photoFile, token);
        nextPhotoKey = out.key;

        if (profile.photoUrl && profile.photoUrl !== out.key) {
          deletesAfterSave.push(profile.photoUrl);
        }
      }

      if (pendingDeletePhotoKey) {
        deletesAfterSave.push(pendingDeletePhotoKey);
      }

      await api("/client/me", {
        method: "PATCH",
        token,
        body: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          birthDate: profile.birthDate || null,
          gender: profile.gender,
          photoUrl: nextPhotoKey || null,
        },
      });

      const nextState = {
        ...profile,
        photoUrl: nextPhotoKey,
      };

      setProfile(nextState);
      setInitialProfile(nextState);
      setPhotoFile(null);
      setPendingDeletePhotoKey("");
      setIsSaved(true);

      const uniqDeletes = Array.from(new Set(deletesAfterSave))
        .filter(Boolean)
        .filter((k) => !/^https?:\/\//i.test(k));

      for (const key of uniqDeletes) {
        try {
          await deleteFromR2(key);
        } catch (err) {
          console.error(err);
        }
      }
    } catch (e) {
      setApiError(e.message || "Не вдалося зберегти профіль");
    } finally {
      setSaving(false);
    }
  }

  function requestPhoneChange(e) {
    e.preventDefault();
    console.log("REQUEST PHONE CHANGE", changePhone.newPhone);
  }

  function confirmPhoneChange(e) {
    e.preventDefault();
    console.log("CONFIRM PHONE CHANGE", changePhone);
  }

  function requestEmailChange(e) {
    e.preventDefault();
    console.log("REQUEST EMAIL CHANGE", changeEmail.newEmail);
  }

  function confirmEmailChange(e) {
    e.preventDefault();
    console.log("CONFIRM EMAIL CHANGE", changeEmail);
  }

  function resetProfileFields() {
    setProfile((p) => ({
      ...p,
      firstName: "",
      lastName: "",
      birthDate: "",
      gender: "unknown",
    }));
    setIsSaved(false);
  }

  React.useEffect(() => {
    let isMounted = true;
    const start = Date.now();

    (async () => {
      try {
        setLoading(true);
        setApiError("");

        const token = localStorage.getItem("token");
        const data = await api("/client/me", { token });

        if (!isMounted) return;

        const next = {
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          phone: data.phone || "",
          email: data.email || "",
          birthDate: data.birthDate ? String(data.birthDate).slice(0, 10) : "",
          gender: data.gender || "unknown",
          photoUrl: data.photoUrl || "",
        };

        setProfile(next);
        setInitialProfile(next);
        setIsSaved(true);

        const elapsed = Date.now() - start;
        const delay = Math.max(300 - elapsed, 0);

        setTimeout(() => {
          if (isMounted) setLoading(false);
        }, delay);
      } catch (e) {
        if (!isMounted) return;
        setApiError(e.message || "Не вдалося завантажити профіль");
        setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-2.5 pb-4 pt-18 sm:px-4 sm:pb-8 sm:pt-14 lg:pt-16">
        <div className="space-y-3 px-0 pt-2 sm:space-y-5 sm:pt-8 lg:pt-6">
          <section className="overflow-hidden rounded-[22px] border border-stone-200/60 bg-white shadow-[0_4px_20px_-6px_rgba(120,90,60,0.08)] sm:rounded-3xl">
            <div className="h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-70" />

            <div className="px-3.5 pb-5 pt-5 sm:px-6 sm:pb-4 sm:pt-5 lg:px-8 lg:pt-6">
              <div className="mb-4 space-y-2.5 sm:mb-4 sm:space-y-2 lg:mb-5">
                <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-3 py-1 sm:px-4 sm:py-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600 sm:h-4 sm:w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700 sm:text-xs sm:tracking-[0.22em]">
                    Особистий кабінет
                  </span>
                </div>

                <h1 className="max-w-full text-[28px] font-black leading-[1.02] tracking-[-0.035em] text-stone-800 sm:max-w-none sm:!text-5xl lg:!text-5xl">
                  Керуйте своїм <span className="text-amber-600">профілем</span>
                </h1>

                <p className="max-w-2xl text-[13px] leading-5 text-stone-600 sm:text-base sm:leading-7">
                  Оновлюй особисті дані, номер телефону та пошту, щоб бронювання
                  проходили швидко і без зайвих кроків.
                </p>
              </div>

            </div>
          </section>

          <Card
            title="Профіль"
            subtitle="Основні дані, які будуть підставлятися у форму бронювання."
            right={
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <SecondaryButton
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full sm:w-auto"
                >
                  <Camera className="h-4 w-4" />
                  Змінити фото
                </SecondaryButton>

                {(profile.photoUrl || photoFile) && (
                  <SecondaryButton
                    type="button"
                    onClick={removePhoto}
                    className="w-full sm:w-auto"
                  >
                    <X className="h-4 w-4" />
                    Видалити фото
                  </SecondaryButton>
                )}
              </div>
            }
          >
            <form onSubmit={saveProfile} className="space-y-5 sm:space-y-6">
              <div className="flex flex-col gap-3.5 rounded-[22px] border border-stone-200/80 bg-stone-50/70 p-3.5 sm:flex-row sm:items-center sm:gap-4 sm:rounded-[24px] sm:p-5">
                <div className="relative mx-auto sm:mx-0">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="relative grid h-18 w-18 place-items-center overflow-hidden rounded-[22px] border border-stone-200 bg-white shadow-sm transition hover:border-amber-300 sm:h-20 sm:w-20 sm:rounded-[24px]"
                  >
                    {photoSrc ? (
                      <img
                        src={photoSrc}
                        alt="avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-base font-black text-stone-700 sm:text-lg">
                        {initials}
                      </span>
                    )}
                  </button>

                  <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-xl border border-white bg-amber-500 text-white shadow-md">
                    <Camera className="h-4 w-4" />
                  </div>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      onPickPhoto(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </div>

                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <p className="truncate text-[15px] font-black tracking-[-0.02em] text-stone-900 sm:text-lg">
                    {profile.firstName || profile.lastName
                      ? `${profile.firstName} ${profile.lastName}`.trim()
                      : "Ваше ім’я"}
                  </p>

                  <p className="mt-1 text-[13px] leading-5 text-stone-600 sm:text-sm">
                    Фото профілю для майбутнього відображення в акаунті.
                  </p>
                </div>
              </div>

              <div className="grid gap-3.5 sm:gap-4 sm:grid-cols-2">
                <Field label="Ім’я" icon={<User className="h-4 w-4" />}>
                  <Input
                    value={profile.firstName}
                    onChange={(e) =>
                      updateProfile({ firstName: e.target.value })
                    }
                    placeholder="Наприклад, Іван"
                  />
                </Field>

                <Field label="Прізвище" icon={<User className="h-4 w-4" />}>
                  <Input
                    value={profile.lastName}
                    onChange={(e) =>
                      updateProfile({ lastName: e.target.value })
                    }
                    placeholder="Наприклад, Петренко"
                  />
                </Field>

                <Field
                  label="Номер телефону"
                  hint="Редагується нижче"
                  icon={<Phone className="h-4 w-4" />}
                >
                  <Input value={profile.phone} disabled placeholder="+380..." />
                </Field>

                <Field
                  label="Пошта"
                  hint="Редагується нижче"
                  icon={<Mail className="h-4 w-4" />}
                >
                  <Input
                    value={profile.email}
                    disabled
                    placeholder="email@domain.com"
                  />
                </Field>

                <Field
                  label="Дата народження"
                  icon={<CalendarDays className="h-4 w-4" />}
                >
                  <Input
                    type="date"
                    value={profile.birthDate}
                    onChange={(e) =>
                      updateProfile({ birthDate: e.target.value })
                    }
                  />
                </Field>

                <Field
                  label="Стать"
                  icon={<VenusAndMars className="h-4 w-4" />}
                >
                  <Select
                    value={profile.gender}
                    onChange={(e) => updateProfile({ gender: e.target.value })}
                  >
                    <option value="unknown">Не вказано</option>
                    <option value="female">Жіноча</option>
                    <option value="male">Чоловіча</option>
                    <option value="other">Інше</option>
                  </Select>
                </Field>
              </div>

              <div className="flex flex-col gap-2.5 sm:flex-row">
                <PrimaryButton
                  type="submit"
                  disabled={saving || !isDirty}
                  className="w-full sm:w-auto"
                >
                  {saving ? (
                    <>Збереження...</>
                  ) : isSaved && !isDirty ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Збережено
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      Зберегти зміни
                    </>
                  )}
                </PrimaryButton>

                <SecondaryButton
                  type="button"
                  className="w-full sm:w-auto"
                  onClick={resetProfileFields}
                >
                  Очистити поля
                </SecondaryButton>
              </div>
            </form>
          </Card>

          <Card
            title="Зміна номера телефону"
            subtitle="Спочатку запит коду, потім підтвердження нового номера."
          >
            <div className="grid gap-3.5 sm:gap-4 sm:grid-cols-2">
              <Field label="Новий номер" icon={<Phone className="h-4 w-4" />}>
                <Input
                  value={changePhone.newPhone}
                  onChange={(e) => {
                    setChangePhone((p) => ({
                      ...p,
                      newPhone: e.target.value,
                    }));
                  }}
                  placeholder="+380..."
                />
              </Field>

              <div className="flex items-end">
                <PrimaryButton
                  type="button"
                  onClick={requestPhoneChange}
                  className="w-full"
                  disabled={!changePhone.newPhone}
                >
                  Надіслати код
                </PrimaryButton>
              </div>

              <Field label="Код підтвердження" hint="SMS код">
                <Input
                  value={changePhone.code}
                  onChange={(e) => {
                    setChangePhone((p) => ({ ...p, code: e.target.value }));
                  }}
                  placeholder="1234"
                />
              </Field>

              <div className="flex items-end">
                <SecondaryButton
                  type="button"
                  onClick={confirmPhoneChange}
                  className="w-full"
                  disabled={!changePhone.newPhone || !changePhone.code}
                >
                  Підтвердити зміну
                </SecondaryButton>
              </div>
            </div>
          </Card>

          <Card
            title="Зміна пошти"
            subtitle="Можна зробити підтвердження кодом або посиланням на email."
          >
            <div className="grid gap-3.5 sm:gap-4 sm:grid-cols-2">
              <Field label="Нова пошта" icon={<Mail className="h-4 w-4" />}>
                <Input
                  value={changeEmail.newEmail}
                  onChange={(e) => {
                    setChangeEmail((p) => ({
                      ...p,
                      newEmail: e.target.value,
                    }));
                  }}
                  placeholder="email@domain.com"
                />
              </Field>

              <div className="flex items-end">
                <PrimaryButton
                  type="button"
                  onClick={requestEmailChange}
                  className="w-full"
                  disabled={!changeEmail.newEmail}
                >
                  Надіслати підтвердження
                </PrimaryButton>
              </div>

              <Field label="Код підтвердження" hint="або код з листа">
                <Input
                  value={changeEmail.code}
                  onChange={(e) => {
                    setChangeEmail((p) => ({ ...p, code: e.target.value }));
                  }}
                  placeholder="123456"
                />
              </Field>

              <div className="flex items-end">
                <SecondaryButton
                  type="button"
                  onClick={confirmEmailChange}
                  className="w-full"
                  disabled={!changeEmail.newEmail || !changeEmail.code}
                >
                  Підтвердити зміну
                </SecondaryButton>
              </div>
            </div>
          </Card>

          {apiError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 shadow-sm">
              {apiError}
            </div>
          ) : null}
        </div>
      </div>

      {errorModal.open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-stone-900/40 px-4">
          <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_24px_80px_rgba(93,64,55,0.18)]">
            <h3 className="text-lg font-bold text-stone-800">
              {errorModal.title}
            </h3>
            <p className="mt-2 text-sm text-stone-600">
              {errorModal.message}
            </p>
            <div className="mt-5 flex justify-end">
              <PrimaryButton
                type="button"
                onClick={() =>
                  setErrorModal({ open: false, title: "", message: "" })
                }
              >
                Зрозуміло
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}