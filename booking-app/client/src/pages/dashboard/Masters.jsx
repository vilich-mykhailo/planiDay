// Masters.jsx //
import { useEffect, useState } from "react";
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
  return data; // { key, url }
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

function SectionCard({ title, subtitle, right, children }) {
  return (
    <section className="overflow-hidden rounded-[26px] border border-[#E9DED2] bg-[#FFFCF8] shadow-[0_10px_30px_rgba(93,64,55,0.06)] sm:rounded-[30px]">
      <div className="flex flex-col gap-3 border-b border-[#F1E7DE] px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <div className="min-w-0">
          <h2 className="text-[18px] font-extrabold tracking-[-0.02em] text-[#1F2A22]">
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-sm text-[#857A70]">{subtitle}</p>}
        </div>
        {right && <div className="w-full sm:w-auto">{right}</div>}
      </div>
      <div className="px-4 py-4 sm:px-5 sm:py-5">{children}</div>
    </section>
  );
}

function Button({ variant = "default", className = "", children, ...props }) {
  const base =
    "inline-flex items-center justify-center rounded-[16px] px-4 py-2.5 text-sm font-extrabold transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed";

  const styles = {
    default:
      "border border-[#E7DED6] bg-white text-[#6B625A] hover:bg-[#FAF7F4] hover:text-[#1F2A22]",
    primary:
      "bg-[#4A5D4E] text-white shadow-[0_10px_24px_rgba(74,93,78,0.22)] hover:bg-[#3F5143]",
    danger:
      "border border-[#F0D6D1] bg-[#FFF3F1] text-[#B2504A] hover:bg-[#FDE8E4]",
    ghost:
      "bg-transparent text-[#6B625A] hover:bg-[#FAF7F4] hover:text-[#1F2A22]",
  };

  return (
    <button
      type="button"
      className={`${base} ${styles[variant] || styles.default} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function Modal({ open, onClose, title, subtitle, children, footer }) {
  useEffect(() => {
    if (!open) return;
    document.body.classList.add("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-[rgba(32,24,18,0.38)] p-0 backdrop-blur-[3px] sm:items-center sm:px-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[28px] border border-[#E9DED2] bg-[#FFFCF8] shadow-[0_24px_80px_rgba(93,64,55,0.18)] sm:max-h-[85vh] sm:max-w-md sm:rounded-[30px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 border-b border-[#F1E7DE] px-4 py-4 sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C89D72]">
            {title}
          </p>
          {subtitle && <p className="mt-1 text-sm text-[#857A70]">{subtitle}</p>}
        </div>

        <div className="space-y-4 overflow-auto p-4 sm:p-5">{children}</div>

        {footer && (
          <div className="flex-shrink-0 border-t border-[#F1E7DE] px-4 py-4 sm:px-5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function Avatar({ name, photoUrl }) {
  const initials = initialsFromName(name);
  return (
    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-[#E9DED2] bg-[#F8F4EF]">
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={name}
          className="h-full w-full object-cover"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      ) : (
        <span className="text-xs font-extrabold text-[#7B6D61]">{initials}</span>
      )}
    </div>
  );
}

function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-[#EFE6DD] ${className}`}
      aria-hidden="true"
    />
  );
}

function MasterSkeletonRow() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-12 w-12 rounded-2xl bg-gray-200 animate-pulse" />
          <div className="min-w-0 w-full">
            <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="mt-2 h-3 w-52 bg-gray-200 rounded animate-pulse" />
            <div className="mt-2 h-3 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex gap-2">
          <div className="h-10 w-28 rounded-2xl bg-gray-200 animate-pulse" />
          <div className="h-10 w-28 rounded-2xl bg-gray-200 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function MastersSkeleton() {
  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <SkeletonBlock className="h-9 w-40 rounded-2xl sm:h-10 sm:w-48" />
          <SkeletonBlock className="h-4 w-80 max-w-full" />
        </div>

        <SkeletonBlock className="h-8 w-20 rounded-full" />
      </div>

      {/* add master */}
      <section className="overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06)] sm:rounded-[28px]">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
          <div className="space-y-2">
            <SkeletonBlock className="h-5 w-32" />
            <SkeletonBlock className="h-4 w-72 max-w-full" />
          </div>

          <SkeletonBlock className="hidden sm:block h-8 w-32 rounded-full" />
        </div>

        <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <SkeletonBlock className="h-20 w-20 rounded-[22px]" />
              <div className="flex flex-wrap items-center gap-2">
                <SkeletonBlock className="h-11 w-32 rounded-2xl" />
                <SkeletonBlock className="h-11 w-28 rounded-2xl" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-12" />
            <SkeletonBlock className="h-12 w-full rounded-2xl" />
          </div>

          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-40" />
            <SkeletonBlock className="h-12 w-full rounded-2xl" />
            <SkeletonBlock className="h-3 w-44" />
          </div>

          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-12" />
            <SkeletonBlock className="h-28 w-full rounded-2xl" />
            <SkeletonBlock className="h-3 w-36" />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SkeletonBlock className="h-11 w-40 rounded-2xl" />
            <SkeletonBlock className="h-4 w-20" />
          </div>
        </div>
      </section>

      {/* list */}
      <section className="overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06)] sm:rounded-[28px]">
        <div className="border-b border-gray-100 px-4 py-4 sm:px-5">
          <SkeletonBlock className="h-5 w-36" />
          <SkeletonBlock className="mt-2 h-4 w-64 max-w-full" />
        </div>

        <div className="space-y-3 px-4 py-4 sm:px-5 sm:py-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <MasterSkeletonRow key={i} />
          ))}
        </div>
      </section>
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
      if (!res.ok)
        throw new Error(data?.message || `Load masters failed (${res.status})`);

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

  // add form
  const [form, setForm] = useState({
    name: "",
    role: "",
    bio: "",
    photoUrl: "",
    photoKey: null,
    photoFile: null, // ✅ нове
  });

  // edit modal
  const [editMaster, setEditMaster] = useState(null); // master object
const [editDraft, setEditDraft] = useState({
  id: "",
  name: "",
  role: "",
  bio: "",
  photoUrl: "",
  photoKey: null,
  photoFile: null, // ✅ додали
});

  function handleChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handlePickPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // локальне превʼю
    const localUrl = URL.createObjectURL(file);

    setForm((p) => ({
      ...p,
      photoUrl: localUrl, // ✅ показуємо картинку в UI
      photoFile: file, // ✅ зберігаємо сам файл для аплоаду пізніше
      photoKey: null, // ще нема
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

      // ✅ аплоад тільки тут
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
            photoUrl, // ✅ вже з Cloudflare
            photoKey, // ✅ key з R2
          }),
        },
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("Add master failed:", res.status, data);

        // ⚠️ якщо майстер НЕ створився, а фото вже залилось в R2 — треба прибрати
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

      // ✅ скидаємо форму (і ревокнемо blob)
      if (form.photoUrl?.startsWith("blob:"))
        URL.revokeObjectURL(form.photoUrl);

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
      // 1) спочатку видаляємо майстра з БД
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

      // 2) після успіху — видаляємо фото з Cloudflare (якщо є key)
      if (key) {
        try {
          await deleteMasterPhoto(studio.id, key);
        } catch (e) {
          console.warn("Photo delete from R2 failed:", e);
          // можна показати toast, але майстра вже видалено — не блокуємо
        }
        
      }

      // локально прибираємо майстра (або refreshMasters)
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
  photoFile: null, // ✅
});
  }

async function closeEdit() {
  // якщо в цьому редагуванні ми встигли залити НОВЕ фото — прибираємо його при Cancel
  const prevKey = editOriginal.photoKey;
  const draftKey = editDraft.photoKey;

  const uploadedNewButCancelled =
    Boolean(draftKey) && draftKey !== prevKey;

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
    // прибираємо попередній blob, якщо був
    if (p.photoUrl?.startsWith("blob:")) URL.revokeObjectURL(p.photoUrl);

    return {
      ...p,
      photoUrl: localUrl, // ✅ показуємо в UI
      photoFile: file,    // ✅ файл для аплоаду на Save
      // photoKey поки не чіпаємо — він оновиться після upload на Save
    };
  });

  e.target.value = "";
}

async function saveEdit() {
  const name = String(editDraft.name || "").trim();
  if (!name || !studio?.id) return;

  const token = localStorage.getItem("token");

  const prevKey = editOriginal.photoKey; // що було ДО редагування

  let nextKey = editDraft.photoKey ?? null;
  let nextUrl = editDraft.photoUrl || "";

  // ✅ якщо користувач вибрав новий файл — аплоадимо в R2 зараз
  if (editDraft.photoFile) {
    const uploaded = await uploadMasterPhoto(studio.id, editDraft.photoFile);
    nextKey = uploaded.key;
    nextUrl = uploaded.url;
  }

  // якщо фото прибрали -> nextKey буде null, nextUrl ""
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
    }
  );

  const data = await res.json().catch(() => null);

  // ❌ якщо PATCH не вдався — видаляємо щойно залите фото (ролбек)
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

  // ✅ після успішного PATCH — видаляємо старе фото
  if (shouldDeletePrev) {
    try {
      await deleteMasterPhoto(studio.id, prevKey);
    } catch (e) {
      console.warn("Old photo delete failed:", e);
    }
  }

  // прибираємо blob якщо був
  if (editDraft.photoUrl?.startsWith("blob:")) URL.revokeObjectURL(editDraft.photoUrl);

  closeEdit();
  await refreshMasters();
}

  const total = masters.length;

  const [photoBroken, setPhotoBroken] = useState(false);

if (loading) {
  return <MastersSkeleton />;
}
  
  return (
    <div className="space-y-6">
      {/* header */}
<div className="flex items-start justify-between gap-3">
  <div className="min-w-0">
    <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#C89D72]">
      команда студії
    </p>
    <h1 className="mt-2 text-3xl font-black tracking-[-0.03em] text-[#1F2A22] sm:text-4xl">
      Майстри
    </h1>
    <p className="mt-2 text-sm leading-6 text-[#857A70]">
      Додай майстрів, щоб привʼязувати їх до послуг, графіка та записів клієнтів.
    </p>
  </div>
</div>

      {/* add master */}
      <SectionCard
        title="Новий майстер"
        subtitle="Фото, імʼя та короткий опис — як у професійних профілях."
      >
        <form onSubmit={addMaster} className="space-y-4">
          {/* photo row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4">
<div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[22px] border border-[#E9DED2] bg-[#F8F4EF]">                {form.photoUrl && !photoBroken ? (
                  <img
                    src={form.photoUrl}
                    alt="Фото майстра"
                    className="h-full w-full object-cover"
                    onError={() => setPhotoBroken(true)}
                  />
                ) : (
                  <span className="text-xs font-semibold text-[#8B7F73]">
                    Фото
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="cursor-pointer">
                 <span className="inline-flex items-center justify-center rounded-[16px] bg-[#4A5D4E] px-4 py-2.5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(74,93,78,0.22)] transition hover:bg-[#3F5143]">
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
                    Видалити
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* name */}
          <div>
            <label className="block text-sm font-semibold text-[#1F2A22] mb-1">
              Імʼя
            </label>
            <input
              name="name"
              placeholder="Напр. Олена Коваль"
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-[#1F2A22] outline-none transition focus:border-black focus:ring-2 focus:ring-black/15"
            />
          </div>
          {/* role */}
          <div>
            <label className="block text-sm font-semibold text-[#1F2A22] mb-1">
              Посада / Спеціалізація
            </label>
            <input
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-[#1F2A22] outline-none transition focus:border-black focus:ring-2 focus:ring-black/15"
              placeholder="Напр. Майстер манікюру / Brow artist"
            />
            <p className="mt-1 text-xs text-[#8B7F73]">
              Коротко: роль + напрям (манікюр, брови, вії…).
            </p>
          </div>

          {/* bio */}
          <div>
            <label className="block text-sm font-semibold text-[#1F2A22] mb-1">
              Опис
            </label>
            <textarea
              name="bio"
              placeholder="Напр. 6 років досвіду, спеціалізація: фарбування, укладки..."
              value={form.bio}
              onChange={handleChange}
              rows={4}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-[#1F2A22] outline-none transition focus:border-black focus:ring-2 focus:ring-black/15 resize-none"
            />
            <p className="mt-1 text-xs text-[#8B7F73]">
              Коротко і по суті (2–4 речення).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <button
              type="submit"
              disabled={adding || !String(form.name || "").trim()}
              className="inline-flex items-center justify-center rounded-[18px] bg-[#4A5D4E] px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(74,93,78,0.22)] transition hover:bg-[#3F5143] disabled:cursor-not-allowed disabled:bg-[#BFC8C0]"
            >
              {adding ? "Додаємо..." : "Додати майстра"}
            </button>

            <p className="text-sm text-[#857A70]">
              Усього:{" "}
              <span className="font-extrabold text-[#1F2A22]">{total}</span>
            </p>
          </div>
        </form>
      </SectionCard>

      {/* list */}
      <SectionCard
        title="Список майстрів"
        subtitle={
          total
            ? "Клікни “Редагувати”, щоб оновити профіль."
            : "Додай першого майстра вище."
        }
      >
{total === 0 ? (
  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-[#857A70]">
    Поки що немає майстрів. Додай першого майстра зверху.
  </div>
) : (
          <div className="space-y-3">
            {masters.map((m) => (
              <div
                key={m.id}
className="rounded-[24px] border border-[#E9DED2] bg-white p-4 transition "              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <Avatar name={m.name} photoUrl={m.photoUrl} />

                    <div className="min-w-0">
                      <p className="font-extrabold text-[#1F2A22] truncate">
                        {m.name}
                      </p>

                      {m.role ? (
                        <p className="mt-1 text-sm font-semibold text-[#6F655C] truncate">
                          {m.role}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-[#B1A59A]">
                          Спеціалізація не вказана
                        </p>
                      )}

                      {m.bio ? (
                        <p className="mt-1 text-sm text-[#857A70] line-clamp-2">
                          {m.bio}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-[#B1A59A]">Без опису</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:flex gap-2 sm:shrink-0">
<Button
  onClick={() => openEdit(m)}
>
                      Редагувати
                    </Button>
<Button
  variant="danger"
  onClick={() => deleteMaster(m)}
>
                      Видалити
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* edit modal */}
      <Modal
        open={Boolean(editMaster)}
        onClose={closeEdit}
        title="Редагування майстра"
        subtitle="Онови фото, імʼя або опис і збережи зміни."
        footer={
          <div className="flex items-center justify-end gap-2">
<Button
  variant="primary"
  onClick={saveEdit}
  disabled={!String(editDraft.name || "").trim()}
>
              Зберегти
            </Button>
            <Button onClick={closeEdit}>
              Скасувати
            </Button>
          </div>
        }
      >
        {/* photo */}
        <div className="flex items-center gap-4">
<div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[22px] border border-[#E9DED2] bg-[#F8F4EF]">            {editDraft.photoUrl ? (
              <img
                src={editDraft.photoUrl}
                alt="Фото майстра"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs font-semibold text-[#8B7F73]">
                {initialsFromName(editDraft.name)}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="cursor-pointer">
              <span className="inline-flex items-center justify-center rounded-[16px] border border-[#E7DED6] bg-white px-4 py-2.5 text-sm font-extrabold text-[#6B625A] transition hover:bg-[#FAF7F4] hover:text-[#1F2A22]">
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
    if (p.photoUrl?.startsWith("blob:")) URL.revokeObjectURL(p.photoUrl);
    return { ...p, photoUrl: "", photoKey: null, photoFile: null };
  })
}
  >
    Прибрати
  </Button>
)}
          </div>
        </div>

        {/* name */}
        <div>
          <label className="block text-sm font-semibold text-[#1F2A22] mb-1">
            Імʼя
          </label>
          <input
            value={editDraft.name}
            onChange={(e) =>
              setEditDraft((p) => ({ ...p, name: e.target.value }))
            }
            className="w-full rounded-2xl border border-[#E9DED2] bg-white px-4 py-3 text-sm font-semibold text-[#1F2A22] outline-none transition focus:border-black focus:ring-2 focus:ring-black/15"
            placeholder="Напр. Олена Коваль"
          />
        </div>

        {/* role */}
        <div>
          <label className="block text-sm font-semibold text-[#1F2A22] mb-1">
            Посада / Спеціалізація
          </label>
          <input
            value={editDraft.role || ""}
            onChange={(e) =>
              setEditDraft((p) => ({ ...p, role: e.target.value }))
            }
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-[#1F2A22] outline-none transition focus:border-black focus:ring-2 focus:ring-black/15"
            placeholder="Напр. Майстер манікюру / Brow artist"
          />
        </div>

        {/* bio */}
        <div>
          <label className="block text-sm font-semibold text-[#1F2A22] mb-1">
            Опис
          </label>
          <textarea
            value={editDraft.bio}
            onChange={(e) =>
              setEditDraft((p) => ({ ...p, bio: e.target.value }))
            }
            rows={4}
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-[#1F2A22] outline-none transition focus:border-black focus:ring-2 focus:ring-black/15 resize-none"
            placeholder="Коротко про досвід та спеціалізацію…"
          />
        </div>
      </Modal>
    </div>
  );
}
