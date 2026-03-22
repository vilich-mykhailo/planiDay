// Masters.jsx
import { useEffect, useState } from "react";
import {
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Camera,
} from "lucide-react";
import { useStudio } from "../../context/studio/useStudio";

async function uploadMasterPhoto(studioId, file) {
  const token = localStorage.getItem("token");
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/media/studio/${studioId}/master-photo`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    },
  );

  const data = await res.json().catch(() => null);
  if (!res.ok)
    throw new Error(data?.message || `Upload failed (${res.status})`);
  return data;
}

function initialsFromName(name) {
  const s = String(name || "").trim();
  if (!s) return "M";

  return (
    s
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "M"
  );
}

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function SectionCard({
  title,
  subtitle,
  badge,
  actions,
  children,
  className = "",
}) {
  return (
    <section
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-stone-200/60 bg-white",
        "shadow-[0_4px_24px_-4px_rgba(120,90,60,0.08)] hover:shadow-[0_8px_32px_-4px_rgba(120,90,60,0.12)]",
        "transition-all duration-300",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-60" />

      <div className="flex flex-col gap-3 border-b border-stone-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-stone-800">
              {title}
            </h2>

            {badge && (
              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                {badge}
              </span>
            )}
          </div>

          {subtitle && (
            <p className="mt-0.5 text-sm text-stone-500">{subtitle}</p>
          )}
        </div>

        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}

function Button({
  variant = "secondary",
  size = "md",
  className = "",
  children,
  ...props
}) {
  const variants = {
    primary:
      "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 hover:from-emerald-700 hover:to-emerald-800",
    secondary:
      "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 hover:border-stone-300",
    danger:
      "bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 text-red-600 hover:from-red-100 hover:to-rose-100",
    ghost: "text-stone-600 hover:bg-stone-100",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-xl",
    md: "px-4 py-2.5 text-sm rounded-2xl",
    lg: "px-6 py-3 text-sm rounded-2xl",
  };

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200",
        "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function IconButton({ variant = "secondary", className = "", children, ...props }) {
  const variants = {
    secondary:
      "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-800",
    danger: "bg-red-50 border border-red-200 text-red-500 hover:bg-red-100",
  };

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center rounded-xl p-2.5 transition-all duration-200 active:scale-95",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function Modal({ open, onClose, title, subtitle, children, footer, size = "md" }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";

      const handleEscape = (e) => {
        if (e.key === "Escape") onClose?.();
      };

      document.addEventListener("keydown", handleEscape);

      return () => {
        document.body.style.overflow = "";
        document.removeEventListener("keydown", handleEscape);
      };
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
  };

  return (
<div
  className="fixed inset-0 z-[9999] flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-sm sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-3xl bg-white shadow-2xl",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          sizeClasses[size],
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-amber-50/80 to-transparent" />

        <div className="relative border-b border-stone-100 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-amber-600">
                {title}
              </p>
              {subtitle && <p className="mt-1 text-sm text-stone-500">{subtitle}</p>}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
              aria-label="Закрити"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(100vh-220px)] overflow-y-auto px-6 py-6">
          {children}
        </div>

        {footer && (
          <div className="border-t border-stone-100 bg-stone-50/50 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function Avatar({ name, photoUrl, size = "md", className = "" }) {
  const initials = initialsFromName(name);

  const sizes = {
    sm: "h-12 w-12 rounded-2xl text-xs",
    md: "h-20 w-20 rounded-[22px] text-sm",
  };

  return (
<div
  className={cn(
    "flex shrink-0 items-center justify-center overflow-hidden border-2 border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm",
    sizes[size],
    className,
  )}
>
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={name}
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
       <Camera className="h-6 w-6 text-amber-500" />
      )}
    </div>
  );
}

function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-stone-200/60", className)}
      aria-hidden="true"
    />
  );
}

function MasterSkeletonRow() {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="h-12 w-12 animate-pulse rounded-2xl bg-stone-200" />
          <div className="w-full min-w-0">
            <div className="h-4 w-40 animate-pulse rounded bg-stone-200" />
            <div className="mt-2 h-3 w-52 animate-pulse rounded bg-stone-200" />
            <div className="mt-2 h-3 w-64 animate-pulse rounded bg-stone-200" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex">
          <div className="h-10 w-28 animate-pulse rounded-2xl bg-stone-200" />
          <div className="h-10 w-28 animate-pulse rounded-2xl bg-stone-200" />
        </div>
      </div>
    </div>
  );
}

function MastersSkeleton() {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <SkeletonBlock className="mb-3 h-8 w-40" />
        <SkeletonBlock className="mb-2 h-12 w-48" />
        <SkeletonBlock className="h-5 w-96 max-w-full" />
      </div>

      <div className="rounded-3xl border border-stone-200 bg-white p-5">
        <div className="mb-4 flex justify-between">
          <div className="space-y-2">
            <SkeletonBlock className="h-6 w-40" />
            <SkeletonBlock className="h-4 w-80 max-w-full" />
          </div>
        </div>

        <div className="space-y-4">
          <SkeletonBlock className="h-24 w-full rounded-3xl" />
          <SkeletonBlock className="h-12 w-full rounded-2xl" />
          <SkeletonBlock className="h-12 w-full rounded-2xl" />
          <SkeletonBlock className="h-28 w-full rounded-2xl" />
          <SkeletonBlock className="h-12 w-40 rounded-2xl" />
        </div>
      </div>

      <div className="rounded-3xl border border-stone-200 bg-white p-5">
        <div className="mb-4 space-y-2">
          <SkeletonBlock className="h-6 w-40" />
          <SkeletonBlock className="h-4 w-72 max-w-full" />
        </div>

        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <MasterSkeletonRow key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Masters() {
  const { studio } = useStudio();

  const [mastersLocal, setMastersLocal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  async function refreshMasters() {
    if (!studio?.id) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/studio/${studio.id}/masters`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || `Load masters failed (${res.status})`);
      }

      setMastersLocal(Array.isArray(data?.masters) ? data.masters : []);
    } finally {
      setLoading(false);
    }
  }

  async function deleteMasterPhoto(studioId, key) {
    if (!key) return;
    const token = localStorage.getItem("token");

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/media/studio/${studioId}/master-photo`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ key }),
      },
    );

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.message || `Delete failed (${res.status})`);
    }
    return data;
  }

  const [editOriginal, setEditOriginal] = useState({
    photoKey: null,
    photoUrl: "",
  });

  useEffect(() => {
    refreshMasters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studio?.id]);

  const masters = mastersLocal;

  const [form, setForm] = useState({
    name: "",
    role: "",
    bio: "",
    photoUrl: "",
    photoKey: null,
    photoFile: null,
  });

  const [editMaster, setEditMaster] = useState(null);
  const [editDraft, setEditDraft] = useState({
    id: "",
    name: "",
    role: "",
    bio: "",
    photoUrl: "",
    photoKey: null,
    photoFile: null,
  });

  function handleChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handlePickPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);

    setForm((p) => ({
      ...p,
      photoUrl: localUrl,
      photoFile: file,
      photoKey: null,
    }));

    setPhotoBroken(false);
    e.target.value = "";
  }

  function removePhoto() {
    setPhotoBroken(false);

    setForm((p) => {
      if (p.photoUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(p.photoUrl);
      }
      return { ...p, photoUrl: "", photoKey: null, photoFile: null };
    });
  }

  async function addMaster(e) {
    e.preventDefault();
    const name = String(form.name || "").trim();
    if (!name || !studio?.id || adding) return;

    setAdding(true);
    try {
      let photoKey = null;
      let photoUrl = "";

      if (form.photoFile) {
        const uploaded = await uploadMasterPhoto(studio.id, form.photoFile);
        photoKey = uploaded.key;
        photoUrl = uploaded.url;
      }

      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/studio/${studio.id}/masters`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            role: form.role,
            bio: form.bio,
            photoUrl,
            photoKey,
          }),
        },
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("Add master failed:", res.status, data);

        if (photoKey) {
          try {
            await deleteMasterPhoto(studio.id, photoKey);
          } catch (e) {
            console.warn("Rollback delete failed:", e);
          }
        }

        alert(data?.message || `Add master failed (${res.status})`);
        return;
      }

      if (data?.master) setMastersLocal((prev) => [data.master, ...prev]);
      else await refreshMasters();

      if (form.photoUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(form.photoUrl);
      }

      setForm({
        name: "",
        role: "",
        bio: "",
        photoUrl: "",
        photoKey: null,
        photoFile: null,
      });
      setPhotoBroken(false);
    } finally {
      setAdding(false);
    }
  }

  async function deleteMaster(master) {
    if (!studio?.id) return;

    const token = localStorage.getItem("token");
    const id = master?.id;
    const key = master?.photoKey;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/studio/masters/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        alert(data?.message || `Delete master failed (${res.status})`);
        return;
      }

      if (key) {
        try {
          await deleteMasterPhoto(studio.id, key);
        } catch (e) {
          console.warn("Photo delete from R2 failed:", e);
        }
      }

      setMastersLocal((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      console.error(e);
      alert("Помилка при видаленні майстра");
    }
  }

  function openEdit(master) {
    setEditMaster(master);

    setEditOriginal({
      photoKey: master.photoKey ?? null,
      photoUrl: master.photoUrl || "",
    });

    setEditDraft({
      id: master.id,
      name: master.name || "",
      role: master.role || "",
      bio: master.bio || "",
      photoUrl: master.photoUrl || "",
      photoKey: master.photoKey ?? null,
      photoFile: null,
    });
  }

  async function closeEdit() {
    const prevKey = editOriginal.photoKey;
    const draftKey = editDraft.photoKey;

    const uploadedNewButCancelled = Boolean(draftKey) && draftKey !== prevKey;

    if (uploadedNewButCancelled) {
      try {
        await deleteMasterPhoto(studio.id, draftKey);
      } catch (e) {
        console.warn("Cancel cleanup delete failed:", e);
      }
    }

    setEditMaster(null);
    setEditDraft({
      id: "",
      name: "",
      role: "",
      bio: "",
      photoUrl: "",
      photoKey: null,
      photoFile: null,
    });
    setEditOriginal({ photoKey: null, photoUrl: "" });
  }

  async function editPickPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);

    setEditDraft((p) => {
      if (p.photoUrl?.startsWith("blob:")) URL.revokeObjectURL(p.photoUrl);

      return {
        ...p,
        photoUrl: localUrl,
        photoFile: file,
      };
    });

    e.target.value = "";
  }

  const inputBaseClass =
    "w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 " +
    "text-sm font-medium text-stone-700 outline-none transition-all " +
    "placeholder:text-stone-400 " +
    "hover:bg-stone-50 hover:border-stone-300 " +
    "focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 focus:text-stone-800";

  async function saveEdit() {
    const name = String(editDraft.name || "").trim();
    if (!name || !studio?.id) return;

    const token = localStorage.getItem("token");

    const prevKey = editOriginal.photoKey;

    let nextKey = editDraft.photoKey ?? null;
    let nextUrl = editDraft.photoUrl || "";

    if (editDraft.photoFile) {
      const uploaded = await uploadMasterPhoto(studio.id, editDraft.photoFile);
      nextKey = uploaded.key;
      nextUrl = uploaded.url;
    }

    if (!nextUrl) nextUrl = "";
    if (!nextKey) nextKey = null;

    const shouldDeletePrev = Boolean(prevKey) && prevKey !== nextKey;

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/studio/masters/${editDraft.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          role: editDraft.role,
          bio: editDraft.bio,
          photoUrl: nextUrl,
          photoKey: nextKey,
        }),
      },
    );

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      if (editDraft.photoFile && nextKey) {
        try {
          await deleteMasterPhoto(studio.id, nextKey);
        } catch (e) {
          console.warn("Rollback delete failed:", e);
        }
      }
      alert(data?.message || `Update failed (${res.status})`);
      return;
    }

    if (shouldDeletePrev) {
      try {
        await deleteMasterPhoto(studio.id, prevKey);
      } catch (e) {
        console.warn("Old photo delete failed:", e);
      }
    }

    if (editDraft.photoUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(editDraft.photoUrl);
    }

    closeEdit();
    await refreshMasters();
  }

  const total = masters.length;
  const [photoBroken, setPhotoBroken] = useState(false);

  if (loading) {
    return <MastersSkeleton />;
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="mb-2">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-4 py-1.5">
            <Sparkles className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Команда студії
            </span>
          </div>

          <h1 className="text-4xl font-black tracking-tight text-stone-800 sm:text-5xl">
            Майстри
          </h1>

          <p className="mt-3 max-w-2xl text-stone-600">
            Додай майстрів, щоб привʼязувати їх до послуг, графіка та записів
            клієнтів.
          </p>
        </div>

        {/* Add master */}
        <SectionCard
          title="Новий майстер"
          subtitle="Фото, імʼя та короткий опис — як у професійних профілях."
          badge={`${total} всього`}
        >
          <form onSubmit={addMaster} className="space-y-5">
           <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 sm:gap-4">
                <div className="relative">
<Avatar
  name={form.name || "Фото"}
  photoUrl={!photoBroken ? form.photoUrl : ""}
  size="md"
  className="h-16 w-16 rounded-2xl sm:h-20 sm:w-20 sm:rounded-[22px]"
 />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-700 hover:to-emerald-800">
                      <Plus className="h-4 w-4" />
                      Додати фото
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePickPhoto}
                      className="hidden"
                    />
                  </label>

                  {form.photoUrl && (
                    <Button variant="danger" onClick={removePhoto}>
                      <Trash2 className="h-4 w-4" />
                      Видалити
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Імʼя
              </label>
              <input
                name="name"
                placeholder="Напр. Олена Коваль"
                value={form.name}
                onChange={handleChange}
                className={inputBaseClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Посада / Спеціалізація
              </label>
              <input
                name="role"
                value={form.role}
                onChange={handleChange}
                className={inputBaseClass}
                placeholder="Напр. Майстер манікюру / Brow artist"
              />
              <p className="mt-1 text-xs text-stone-500">
                Коротко: роль + напрям (манікюр, брови, вії…).
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Опис
              </label>
              <textarea
                name="bio"
                placeholder="Напр. 6 років досвіду, спеціалізація: фарбування, укладки..."
                value={form.bio}
                onChange={handleChange}
                rows={4}
                className={cn(inputBaseClass, "resize-none")}
              />
              <p className="mt-1 text-xs text-stone-500">
                Коротко і по суті (2–4 речення).
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                type="submit"
                variant="primary"
                disabled={adding || !String(form.name || "").trim()}
              >
                <Check className="h-4 w-4" />
                {adding ? "Додаємо..." : "Додати майстра"}
              </Button>

              <p className="text-sm text-stone-500">
                Усього: <span className="font-bold text-stone-800">{total}</span>
              </p>
            </div>
          </form>
        </SectionCard>

        {/* List */}
        <SectionCard
          title="Список майстрів"
          subtitle={
            total
              ? "Клікни “Редагувати”, щоб оновити профіль."
              : "Додай першого майстра вище."
          }
        >
          {total === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/50 p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100">
                <Plus className="h-6 w-6 text-stone-400" />
              </div>
              <p className="text-sm text-stone-500">Поки що немає майстрів</p>
              <p className="mt-1 text-xs text-stone-400">
                Додай першого майстра зверху
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {masters.map((m) => (
                <div
                  key={m.id}
                  className="group rounded-2xl border border-stone-200 bg-white p-4 transition-all hover:border-amber-200 hover:shadow-md hover:shadow-amber-500/5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                                            <Avatar name={m.name} photoUrl={m.photoUrl} size="sm" />

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-stone-800">
                          {m.name}
                        </p>

                        {m.role ? (
                          <p className="mt-1 truncate text-sm font-medium text-stone-600">
                            {m.role}
                          </p>
                        ) : (
                          <p className="mt-1 text-sm text-stone-400">
                            Спеціалізація не вказана
                          </p>
                        )}

                        {m.bio ? (
                          <p className="mt-1 line-clamp-2 text-sm text-stone-500">
                            {m.bio}
                          </p>
                        ) : (
                          <p className="mt-1 text-sm text-stone-400">Без опису</p>
                        )}
                      </div>
                    </div>

<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">          
            <IconButton  className="flex-1 sm:flex-none" onClick={() => openEdit(m)} title="Редагувати">
                        <Pencil className="h-4 w-4" />
                      </IconButton>

                      <IconButton
                      className="flex-1 sm:flex-none"
                        variant="danger"
                        onClick={() => deleteMaster(m)}
                        title="Видалити"
                      >
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Edit modal */}
        <Modal
          open={Boolean(editMaster)}
          onClose={closeEdit}
          title="Редагування майстра"
          subtitle="Онови фото, імʼя або опис і збережи зміни."
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                onClick={closeEdit}
              >
                Скасувати
              </Button>

              <Button
                variant="primary"
                onClick={saveEdit}
                disabled={!String(editDraft.name || "").trim()}
              >
                <Check className="h-4 w-4" />
                Зберегти
              </Button>
            </div>
          }
        >
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar
                  name={editDraft.name || "Майстер"}
                  photoUrl={editDraft.photoUrl}
                  size="md"
                />
                <div className="absolute -bottom-2 -right-2 rounded-xl border border-amber-200 bg-white p-2 shadow-sm">
                  <Camera className="h-4 w-4 text-amber-600" />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="cursor-pointer">
                  <span className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50">
                    <Pencil className="h-4 w-4" />
                    Змінити фото
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={editPickPhoto}
                  />
                </label>

                {editDraft.photoUrl && (
                  <Button
                    variant="danger"
                    onClick={() =>
                      setEditDraft((p) => {
                        if (p.photoUrl?.startsWith("blob:")) {
                          URL.revokeObjectURL(p.photoUrl);
                        }
                        return {
                          ...p,
                          photoUrl: "",
                          photoKey: null,
                          photoFile: null,
                        };
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                    Прибрати
                  </Button>
                )}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Імʼя
              </label>
              <input
                value={editDraft.name}
                onChange={(e) =>
                  setEditDraft((p) => ({ ...p, name: e.target.value }))
                }
                className={inputBaseClass}
                placeholder="Напр. Олена Коваль"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Посада / Спеціалізація
              </label>
              <input
                value={editDraft.role || ""}
                onChange={(e) =>
                  setEditDraft((p) => ({ ...p, role: e.target.value }))
                }
                className={inputBaseClass}
                placeholder="Напр. Майстер манікюру / Brow artist"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Опис
              </label>
              <textarea
                value={editDraft.bio}
                onChange={(e) =>
                  setEditDraft((p) => ({ ...p, bio: e.target.value }))
                }
                rows={4}
                className={cn(inputBaseClass, "resize-none")}
                placeholder="Коротко про досвід та спеціалізацію…"
              />
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}