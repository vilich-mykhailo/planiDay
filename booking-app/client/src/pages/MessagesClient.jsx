// MessagesClient.jsx
import { useState } from "react";
import {
  Sparkles,
  Mail,
  CheckCheck,
  X,
  Bell,
  Search,
} from "lucide-react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-stone-200/70 bg-white p-8 shadow-[0_4px_24px_-4px_rgba(120,90,60,0.08)] sm:p-10">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] border border-stone-200 bg-stone-100">
          <Mail className="h-7 w-7 text-stone-500" />
        </div>

        <h3 className="mt-4 text-xl font-semibold tracking-tight text-stone-800">
          Поки що немає повідомлень
        </h3>

        <p className="mt-2 text-sm text-stone-500">
          Тут з’являтимуться нагадування про записи, підтвердження та важливі
          оновлення.
        </p>
      </div>
    </div>
  );
}

function MessageItem({ item, onRead }) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[24px] border p-5 transition-all duration-300 sm:rounded-[28px]",

        item.read
          ? "bg-white border-stone-200/80 shadow-[0_10px_26px_rgba(15,23,42,0.07)] hover:shadow-[0_16px_34px_rgba(15,23,42,0.10)]"
          : "bg-emerald-50/60 border-emerald-200 shadow-[0_12px_28px_rgba(16,185,129,0.15)] hover:shadow-[0_18px_36px_rgba(16,185,129,0.18)]",
      )}
    >
      {/* 🔥 ЛІВА ЛІНІЯ (АКЦЕНТ) */}
      {!item.read && (
        <div className="absolute left-0 top-0 h-full w-[4px] bg-gradient-to-b from-emerald-400 to-emerald-600" />
      )}

      {/* верхня лінія */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-stone-200 to-transparent" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={cn(
                "tracking-[-0.02em]",
                item.read
                  ? "text-base font-semibold text-stone-900 sm:text-lg"
                  : "text-base font-black text-stone-900 sm:text-lg",
              )}
            >
              {item.title}
            </h3>

            {!item.read && (
              <>
                {/* 🔴 DOT */}
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />

                {/* BADGE */}
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[11px] font-bold text-emerald-700 shadow-sm">
                  Нове
                </span>
              </>
            )}
          </div>

          <p
            className={cn(
              "mt-2 leading-6",
              item.read
                ? "text-sm text-stone-600"
                : "text-sm text-stone-800 font-medium",
            )}
          >
            {item.text}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-stone-400">
            <span className="rounded-full border border-stone-200 bg-stone-100 px-2.5 py-1 font-medium text-stone-600">
              {item.date}
            </span>
          </div>
        </div>

        {!item.read ? (
          <button
            type="button"
            onClick={() => onRead(item.id)}
            className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-emerald-200 bg-white px-4 py-2.5 text-sm font-bold text-emerald-700 transition-all duration-200 hover:bg-emerald-50 hover:shadow-md active:scale-95"
          >
            <CheckCheck className="h-4 w-4" />
            Відмітити як переглянуто
          </button>
        ) : (
          <div className="inline-flex items-center justify-center rounded-[18px] border border-stone-200 bg-white px-4 py-2.5 text-sm font-bold text-stone-500 shadow-sm">
            Переглянуто
          </div>
        )}
      </div>
    </div>
  );
}

export default function Messages() {
  const [q, setQ] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      title: "Запис підтверджено",
      text: "Ваш запис у студію Beauty Space підтверджено на 12:00.",
      date: "Сьогодні, 10:32",
      read: false,
    },
    {
      id: 2,
      title: "Нагадування про запис",
      text: "Ваш запис завтра о 14:30. Будь ласка, приходьте за 5–10 хвилин до початку.",
      date: "Вчора, 18:12",
      read: true,
    },
    {
      id: 3,
      title: "Оновлення часу бронювання",
      text: "Студія змінила час вашого запису з 15:00 на 15:30.",
      date: "22 липня, 09:10",
      read: false,
    },
  ]);

  const filtered = messages.filter((m) => {
    const hay = [m.title, m.text, m.date].join(" ").toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

  const unreadCount = messages.filter((m) => !m.read).length;

  function markAsRead(id) {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, read: true } : m)),
    );
  }

  return (
    <div className="pt-20 px-4 sm:pt-22 sm:px-6 lg:pt-22 lg:px-8 space-y-6">
      <section className="overflow-hidden rounded-[24px] border border-stone-200/60 bg-white shadow-[0_4px_20px_-6px_rgba(120,90,60,0.08)] sm:rounded-3xl">
        <div className="h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-70" />

        <div className="px-4 pb-7 pt-7 sm:px-6 sm:pb-4 sm:pt-5 lg:px-8 lg:pt-6">
          <div className="mb-5 space-y-3 sm:mb-4 sm:space-y-2 lg:mb-5">
            <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-3 py-1 sm:px-4 sm:py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-600 sm:h-4 sm:w-4" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700 sm:text-xs sm:tracking-[0.22em]">
                Мої повідомлення
              </span>
            </div>

            <h1 className="max-w-full !text-[34px] font-black leading-tight tracking-[-0.03em] text-stone-800 sm:max-w-none sm:!text-5xl lg:!text-5xl">
              Слідкуйте за своїми{" "}
              <span className="text-amber-600">повідомленнями</span>
            </h1>

            <p className="max-w-2xl text-sm leading-6 text-stone-600 sm:text-base sm:leading-7">
              Тут зберігаються нагадування, підтвердження бронювання та важливі
              оновлення щодо ваших записів.
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-[18px] border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-stone-700">
                <Bell className="h-4 w-4 text-amber-600" />
                Усього: {messages.length}
              </span>

              <span className="inline-flex items-center gap-2 rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800">
                <Mail className="h-4 w-4" />
                Нових: {unreadCount}
              </span>
            </div>

            <div className="w-full lg:w-[360px]">
              <div className="flex items-center gap-2.5 rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm transition-all duration-200 focus-within:border-amber-300 focus-within:ring-4 focus-within:ring-amber-100">
                <Search className="h-4 w-4 text-stone-400" />

                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Пошук: підтвердження, нагадування…"
                  className="w-full bg-transparent text-sm text-stone-800 outline-none placeholder:text-stone-400"
                />

                {q ? (
                  <button
                    type="button"
                    onClick={() => setQ("")}
                    className="text-stone-400 transition hover:text-red-600"
                    aria-label="Очистити пошук"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-2 text-sm text-stone-500">
        <span className="rounded-full border border-stone-200 bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
          Знайдено: {filtered.length}
        </span>

        {q ? (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
            Пошук: {q}
          </span>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {filtered.map((item) => (
            <MessageItem key={item.id} item={item} onRead={markAsRead} />
          ))}
        </div>
      )}
    </div>
  );
}