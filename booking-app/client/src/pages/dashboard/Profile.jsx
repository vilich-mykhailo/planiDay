// Profile.jsx //
import React, { useMemo, useRef, useState } from "react";
import { api } from "../../api/http";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-end justify-between gap-3">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        {hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
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
        "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm",
        "outline-none transition",
        "focus:border-gray-300 focus:ring-4 focus:ring-gray-100",
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
          // після вибору часто хочеться зразу "закрити" анімацію
          setOpen(false);
        }}
        className={cx(
          "w-full appearance-none rounded-2xl border border-gray-200 bg-white",
          "px-4 pr-12 py-3 text-sm",
          "outline-none transition",
          "focus:border-gray-300 focus:ring-4 focus:ring-gray-100",
          props.className,
        )}
      >
        {props.children}
      </select>

      {/* Custom arrow (animated) */}
      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
        <svg
          className={cx(
            "h-4 w-4 text-gray-500",
            "transition-transform duration-200 ease-out",
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

function Segmented({ value, onChange, options }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-2xl bg-gray-50 p-2 border border-gray-200">
      {options.map((opt) => {
        const active = value === opt.value;

        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cx(
              "rounded-xl px-3 py-2 text-sm font-extrabold transition",
              "focus:outline-none focus:ring-4 focus:ring-gray-100",
              active
                ? "bg-black text-white shadow-sm"
                : "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
function Card({ title, subtitle, right, children }) {
  return (
    <section className="rounded-[28px] border border-gray-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 sm:px-7 py-5">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-extrabold text-gray-900">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
          ) : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      <div className="px-5 sm:px-7 py-6">{children}</div>
    </section>
  );
}

function PrimaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex items-center justify-center rounded-2xl px-4 py-3",
        "text-sm font-extrabold transition active:scale-[0.99]",
        props.disabled
          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
          : "bg-black text-white hover:bg-gray-900",
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
        "inline-flex items-center justify-center rounded-2xl px-4 py-3",
        "text-sm font-extrabold transition active:scale-[0.99]",
        props.disabled
          ? "bg-white text-gray-300 border border-gray-100 cursor-not-allowed"
          : "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50",
        props.className,
      )}
    >
      {children}
    </button>
  );
}

function SkeletonBlock({ className }) {
  return (
    <div className={`animate-pulse rounded-2xl bg-gray-100 ${className}`} />
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 pt-8 pb-10 space-y-5">
      <section className="rounded-[28px] border border-gray-200 bg-white shadow-sm px-5 sm:px-7 py-6 space-y-6">
        {/* Avatar row */}
        <div className="flex items-center gap-4">
          <SkeletonBlock className="h-16 w-16 rounded-3xl" />
          <div className="space-y-2 w-full max-w-xs">
            <SkeletonBlock className="h-4 w-40" />
            <SkeletonBlock className="h-3 w-28" />
          </div>
        </div>

        {/* Fields grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          <SkeletonBlock className="h-12 w-full" />
          <SkeletonBlock className="h-12 w-full" />
          <SkeletonBlock className="h-12 w-full" />
          <SkeletonBlock className="h-12 w-full" />
          <SkeletonBlock className="h-12 w-full" />
          <SkeletonBlock className="h-12 w-full" />
        </div>

        <SkeletonBlock className="h-12 w-40" />
      </section>
    </div>
  );
}

export default function Profile() {
  // TODO: потім заміниш на дані з API/контексту
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    birthDate: "",
    gender: "unknown", // male/female/other/unknown
    photoUrl: "", // для preview
  });

  // окремі блоки на майбутнє
  const [changePhone, setChangePhone] = useState({
    newPhone: "",
    code: "",
  });

  const [changeEmail, setChangeEmail] = useState({
    newEmail: "",
    code: "",
  });
  const [isSaved, setIsSaved] = useState(false);
  const fileRef = useRef(null);

  const initials = useMemo(() => {
    const a = (profile.firstName || "").trim().slice(0, 1).toUpperCase();
    const b = (profile.lastName || "").trim().slice(0, 1).toUpperCase();
    return (a + b).trim() || "U";
  }, [profile.firstName, profile.lastName]);

function onPickPhoto(file) {
  if (!file) return;

  const url = URL.createObjectURL(file);

  setProfile((p) => {
    if (p.photoUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(p.photoUrl);
    }
    return { ...p, photoUrl: url };
  });

  setIsSaved(false);
}

  async function saveProfile(e) {
    e.preventDefault();

    try {
      setApiError("");
      const token = localStorage.getItem("token");

      await api("/client/me", {
        method: "PATCH",
        token,
        body: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          birthDate: profile.birthDate || null,
          gender: profile.gender,
          // photoUrl поки не чіпаємо (бо preview url локальний)
        },
      });

      setIsSaved(true);
    } catch (e) {
      setApiError(e.message || "Не вдалося зберегти профіль");
    }
  }

  function requestPhoneChange(e) {
    e.preventDefault();
    // TODO: API: надіслати код на newPhone
    console.log("REQUEST PHONE CHANGE", changePhone.newPhone);
  }

  function confirmPhoneChange(e) {
    e.preventDefault();
    // TODO: API: підтвердити код
    console.log("CONFIRM PHONE CHANGE", changePhone);
  }

  function requestEmailChange(e) {
    e.preventDefault();
    // TODO: API: надіслати код/лінк на newEmail
    console.log("REQUEST EMAIL CHANGE", changeEmail.newEmail);
  }

  function confirmEmailChange(e) {
    e.preventDefault();
    // TODO: API: підтвердити код
    console.log("CONFIRM EMAIL CHANGE", changeEmail);
  }

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const updateProfile = (patch) => {
    setProfile((p) => ({ ...p, ...patch }));
    setIsSaved(false);
  };
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

        setProfile((p) => ({
          ...p,
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          phone: data.phone || "",
          email: data.email || "",
          birthDate: data.birthDate ? String(data.birthDate).slice(0, 10) : "",
          gender: data.gender || "unknown",
          photoUrl: data.photoUrl || "",
        }));

        setIsSaved(true);

        // 🔥 Мінімальний час skeleton = 300мс
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
  console.log("TOKEN:", localStorage.getItem("token"));
  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="pt-6 px-4 sm:pt-8 sm:px-6 lg:pt-6 lg:px-8 space-y-6">
      {/* Main profile */}
      <Card
        title="Профіль"
        subtitle="Основні дані, які будуть підставлятися у форму бронювання."
        right={
          <SecondaryButton
            type="button"
            onClick={() => fileRef.current?.click()}
          >
            Змінити фото
          </SecondaryButton>
        }
      >
        <form onSubmit={saveProfile} className="space-y-6">
          {/* Avatar row */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-3xl border border-gray-200 bg-gray-50 overflow-hidden grid place-items-center">
                {profile.photoUrl ? (
                  <img
                    src={profile.photoUrl}
                    alt="avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-extrabold text-gray-700">
                    {initials}
                  </span>
                )}
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickPhoto(e.target.files?.[0])}
              />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-extrabold text-gray-900 truncate">
                {profile.firstName || profile.lastName
                  ? `${profile.firstName} ${profile.lastName}`.trim()
                  : "Ваше ім’я"}
              </p>
              <p className="mt-0.5 text-xs text-gray-600">JPG/PNG.</p>
            </div>
          </div>

          {/* Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ім’я">
              <Input
                value={profile.firstName}
                onChange={(e) => updateProfile({ firstName: e.target.value })}
                placeholder="Наприклад, Іван"
              />
            </Field>

            <Field label="Прізвище">
              <Input
                value={profile.lastName}
                onChange={(e) => updateProfile({ lastName: e.target.value })}
              />
            </Field>

            <Field label="Номер телефону" hint="Редагується у блоці нижче">
              <Input value={profile.phone} disabled placeholder="+380..." />
            </Field>

            <Field label="Пошта" hint="Редагується у блоці нижче">
              <Input value={profile.email} disabled placeholder="email@..." />
            </Field>

            <Field label="Дата народження">
              <Input
                type="date"
                value={profile.birthDate}
                onChange={(e) => updateProfile({ birthDate: e.target.value })}
              />
            </Field>

            <Field label="Стать">
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

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="submit"
              disabled={isSaved}
              className={`
    inline-flex items-center justify-center
    rounded-2xl px-4 py-3
    text-sm font-extrabold transition
    active:scale-[0.99]
    ${
      isSaved
        ? "bg-gray-100 text-gray-500 cursor-default"
        : "bg-black text-white hover:bg-gray-900"
    }
  `}
            >
              {isSaved ? "Збережено" : "Зберегти зміни"}
            </button>
            <SecondaryButton
              type="button"
              onClick={() =>
                setProfile((p) => ({
                  ...p,
                  firstName: "",
                  lastName: "",
                  birthDate: "",
                  gender: "unknown",
                  photoUrl: p.photoUrl, // фото не скидаю спеціально
                }))
              }
            >
              Очистити поля
            </SecondaryButton>
          </div>
        </form>
      </Card>

      {/* Change phone */}
      <Card
        title="Зміна номера телефону"
        subtitle="Окремий блок на майбутнє: спочатку запит коду, потім підтвердження."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Новий номер">
            <Input
              value={changePhone.newPhone}
              onChange={(e) => {
                setChangePhone((p) => ({ ...p, newPhone: e.target.value }));
              }}
              placeholder="+380..."
            />
          </Field>

          <div className="flex items-end gap-2">
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

          <div className="flex items-end gap-2">
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

      {/* Change email */}
      <Card
        title="Зміна пошти"
        subtitle="Окремий блок на майбутнє: можна зробити підтвердження кодом або посиланням."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Нова пошта">
            <Input
              value={changeEmail.newEmail}
              onChange={(e) => {
                setChangeEmail((p) => ({ ...p, newEmail: e.target.value }));
              }}
              placeholder="email@domain.com"
            />
          </Field>

          <div className="flex items-end gap-2">
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

          <div className="flex items-end gap-2">
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
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {apiError}
        </div>
      ) : null}
    </div>
  );
}
