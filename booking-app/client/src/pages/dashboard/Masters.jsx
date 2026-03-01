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
    <section className="rounded-[24px] sm:rounded-[28px] border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06)] overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-extrabold text-gray-900">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
        </div>
        {right && <div className="w-full sm:w-auto">{right}</div>}
      </div>
      <div className="px-4 sm:px-5 py-4 sm:py-5">{children}</div>
    </section>
  );
}

function Button({ variant = "default", className = "", children, ...props }) {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-extrabold transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed";
  const styles = {
    default: "border border-gray-200 bg-white text-gray-900 hover:bg-gray-50",
    primary: "bg-black text-white hover:bg-gray-900",
    danger: "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
    ghost: "bg-transparent text-gray-900 hover:bg-gray-100",
  };

  return (
    <button
      type="button"
      className={`${base} ${styles[variant]} ${className}`}
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
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:px-4 bg-black/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md overflow-hidden rounded-t-[28px] sm:rounded-[28px] border border-gray-200 bg-white shadow-xl max-h-[92vh] sm:max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b px-4 sm:px-5 py-4 flex-shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {title}
          </p>
          {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
        </div>

        <div className="p-4 sm:p-5 space-y-4 overflow-auto">{children}</div>

        {footer && (
          <div className="border-t px-4 sm:px-5 py-4 flex-shrink-0">
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
    <div className="h-12 w-12 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center flex-shrink-0">
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={name}
          className="h-full w-full object-cover"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      ) : (
        <span className="text-xs font-extrabold text-gray-600">{initials}</span>
      )}
    </div>
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

export default function Masters() {
  const { studio } = useStudio();

  const [mastersLocal, setMastersLocal] = useState([]);
  const [loading, setLoading] = useState(false);
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
    }
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
    photoUrl: localUrl,  // ✅ показуємо картинку в UI
    photoFile: file,     // ✅ зберігаємо сам файл для аплоаду пізніше
    photoKey: null,      // ще нема
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
          photoUrl,   // ✅ вже з Cloudflare
          photoKey,   // ✅ key з R2
        }),
      }
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
    if (form.photoUrl?.startsWith("blob:")) URL.revokeObjectURL(form.photoUrl);

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

  async function deleteMaster(id) {
    const token = localStorage.getItem("token");

    await fetch(`${import.meta.env.VITE_API_URL}/studio/masters/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    refreshMasters();
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
  });
}

function closeEdit() {
  setEditMaster(null);
  setEditDraft({ id: "", name: "", role: "", bio: "", photoUrl: "", photoKey: null });
  setEditOriginal({ photoKey: null, photoUrl: "" });
}

  async function editPickPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const { key, url } = await uploadMasterPhoto(studio.id, file);

    setEditDraft((p) => ({ ...p, photoUrl: url, photoKey: key }));
    e.target.value = "";
  }

async function saveEdit() {
  const name = String(editDraft.name || "").trim();
  if (!name) return;

  const token = localStorage.getItem("token");

  const prevKey = editOriginal.photoKey;
  const nextKey = editDraft.photoKey;

  const photoChanged = Boolean(prevKey) && prevKey !== nextKey;

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
        photoUrl: editDraft.photoUrl,
        photoKey: editDraft.photoKey,
      }),
    }
  );

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    alert(data?.message || `Update failed (${res.status})`);
    return;
  }

  // ✅ видаляємо старий файл лише після успішного збереження в БД
  if (photoChanged) {
    try {
      await deleteMasterPhoto(studio.id, prevKey);
    } catch (e) {
      // не блокуємо користувача, але логнемо/покажемо
      console.warn("Old photo delete failed:", e);
      // optional: toast "не вдалося видалити старе фото"
    }
  }

  closeEdit();
  await refreshMasters();
}

  const total = masters.length;

  const [photoBroken, setPhotoBroken] = useState(false);
  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Майстри
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Додай майстрів, щоб привʼязувати їх до послуг і записів.
          </p>
        </div>

        <span className="flex-shrink-0 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700">
          Всього: {total}
        </span>
      </div>

      {/* add master */}
      <SectionCard
        title="Новий майстер"
        subtitle="Фото, імʼя та короткий опис — як у професійних профілях."
        right={
          <div className="flex gap-2">
            <span className="hidden sm:inline-flex rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700">
              Порада: 2–4 речення
            </span>
          </div>
        }
      >
        <form onSubmit={addMaster} className="space-y-4">
          {/* photo row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-[22px] border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
                {form.photoUrl && !photoBroken ? (
                  <img
                    src={form.photoUrl}
                    alt="Фото майстра"
                    className="h-full w-full object-cover"
                    onError={() => setPhotoBroken(true)}
                  />
                ) : (
                  <span className="text-xs font-semibold text-gray-500">
                    Фото
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="cursor-pointer">
                  <span className="ui-button-primary">Додати фото</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePickPhoto}
                    className="hidden"
                  />
                </label>

                {form.photoUrl && (
                  <Button 
                  className="ui-button-danger"
                  onClick={removePhoto}>
                    Видалити
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Імʼя
            </label>
            <input
              name="name"
              placeholder="Напр. Олена Коваль"
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/15"
            />
          </div>
          {/* role */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Посада / Спеціалізація
            </label>
            <input
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/15"
              placeholder="Напр. Майстер манікюру / Brow artist"
            />
            <p className="mt-1 text-xs text-gray-500">
              Коротко: роль + напрям (манікюр, брови, вії…).
            </p>
          </div>

          {/* bio */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Опис
            </label>
            <textarea
              name="bio"
              placeholder="Напр. 6 років досвіду, спеціалізація: фарбування, укладки..."
              value={form.bio}
              onChange={handleChange}
              rows={4}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/15 resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              Коротко і по суті (2–4 речення).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
<button
  type="submit"
  disabled={adding || !String(form.name || "").trim()}
  className="ui-button-primary"
>
  {adding ? "Додаємо..." : "Додати майстра"}
</button>

            <p className="text-sm text-gray-600">
              Усього:{" "}
              <span className="font-extrabold text-gray-900">{total}</span>
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
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <MasterSkeletonRow key={i} />
            ))}
          </div>
        ) : total === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            Поки що немає майстрів. Додай першого майстра зверху.
          </div>
        ) : (
          <div className="space-y-3">
            {masters.map((m) => (
              <div
                key={m.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 hover:bg-gray-50/60 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <Avatar name={m.name} photoUrl={m.photoUrl} />

                    <div className="min-w-0">
                      <p className="font-extrabold text-gray-900 truncate">
                        {m.name}
                      </p>

                      {m.role ? (
                        <p className="mt-1 text-sm font-semibold text-gray-700 truncate">
                          {m.role}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-gray-400">
                          Спеціалізація не вказана
                        </p>
                      )}

                      {m.bio ? (
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {m.bio}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-gray-400">Без опису</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:flex gap-2 sm:shrink-0">
                    <Button
                      className="ui-button-secondary"
                      onClick={() => openEdit(m)}
                    >
                      Редагувати
                    </Button>
                    <Button
                      className="ui-button-danger"
                      variant="danger"
                      onClick={() => deleteMaster(m.id)}
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
              className="ui-button-primary"
              onClick={saveEdit}
              disabled={!String(editDraft.name || "").trim()}
            >
              Зберегти
            </Button>
            <Button 
            onClick={closeEdit}
            className="ui-button-cancel"
            >
              Скасувати
            </Button>
          </div>
        }
      >
        {/* photo */}
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-[22px] border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
            {editDraft.photoUrl ? (
              <img
                src={editDraft.photoUrl}
                alt="Фото майстра"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs font-semibold text-gray-500">
                {initialsFromName(editDraft.name)}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="cursor-pointer">
              <span className="ui-button-secondary">
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
                className="ui-button-danger"
                onClick={() => setEditDraft((p) => ({ ...p, photoUrl: "" }))}
              >
                Прибрати
              </Button>
            )}
          </div>
        </div>

        {/* name */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">
            Імʼя
          </label>
          <input
            value={editDraft.name}
            onChange={(e) =>
              setEditDraft((p) => ({ ...p, name: e.target.value }))
            }
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/15"
            placeholder="Напр. Олена Коваль"
          />
        </div>

        {/* bio */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1">
            Опис
          </label>
          <textarea
            value={editDraft.bio}
            onChange={(e) =>
              setEditDraft((p) => ({ ...p, bio: e.target.value }))
            }
            rows={4}
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/15 resize-none"
            placeholder="Коротко про досвід та спеціалізацію…"
          />
        </div>
      </Modal>
    </div>
  );
}
