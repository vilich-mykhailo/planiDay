import React from "react";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  CircleHelp,
  Crown,
  Eye,
  Info,
  LockKeyhole,
  Rocket,
  Search,
  Sparkles,
  Star,
  Store,
} from "lucide-react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function PremiumButton({ className = "", children = "Підключити Premium", onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group inline-flex h-12 items-center justify-center gap-3 rounded-lg bg-[#ff5b08] px-8 text-[15px] font-extrabold text-white shadow-[0_9px_22px_rgba(255,91,8,.22)] transition hover:-translate-y-0.5 hover:bg-[#f15100] hover:shadow-[0_13px_28px_rgba(255,91,8,.3)] active:translate-y-0",
        className,
      )}
    >
      <Crown className="h-[19px] w-[19px] fill-white stroke-[2.4]" />
      {children}
    </button>
  );
}

function CheckLine({ children, muted = false }) {
  return (
    <li className={cn("flex items-center gap-2.5", muted ? "text-[#474b53]" : "text-[#24272d]")}>
      <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border border-[#ff6a1d] text-[#ff5b08]">
        <Check className="h-3 w-3 stroke-[3]" />
      </span>
      <span>{children}</span>
    </li>
  );
}

function SearchField() {
  return (
    <div className="flex h-10 items-center gap-3 rounded-lg border border-[#ece9e6] bg-white px-3 text-[#8a8d93] shadow-[0_3px_12px_rgba(28,32,40,.025)]">
      <Search className="h-4 w-4" />
      <span className="text-[11px] font-medium">Манікюр у Львові</span>
    </div>
  );
}

function StudioPhoto() {
  return (
    <div className="relative h-[54px] w-[68px] shrink-0 overflow-hidden rounded-lg bg-[linear-gradient(145deg,#d8c4ad,#f3e8dc_50%,#b8a28e)]">
      <div className="absolute bottom-0 left-2 h-7 w-5 rounded-t-sm bg-[#866b55]" />
      <div className="absolute bottom-0 right-2 h-8 w-7 rounded-t-full bg-[#d4bfa7]" />
      <div className="absolute left-6 top-2 h-4 w-5 rounded-full bg-white/55 blur-[1px]" />
    </div>
  );
}

function EmptyStudioRow({ rank }) {
  return (
    <div className="flex items-center gap-3 px-2 py-2 opacity-50">
      <span className="w-4 text-center text-sm font-bold text-[#74777c]">{rank}</span>
      <div className="grid h-[49px] w-[59px] place-items-center rounded-lg bg-[#e7e7e7]">
        <Store className="h-7 w-7 fill-[#c8c8c8] text-[#c8c8c8]" />
      </div>
      <div className="flex-1 space-y-2">
        <div className="h-2 w-4/5 rounded-full bg-[#d8d8d8]" />
        <div className="h-2 w-1/2 rounded-full bg-[#e4e4e4]" />
      </div>
    </div>
  );
}

function StudioResult({ rank, premium = false }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg px-2 py-2",
        premium && "border border-[#f7daca] bg-[#fff5ef]",
      )}
    >
      <span className={cn("w-4 text-center text-sm font-bold", premium ? "text-[#ff5b08]" : "text-[#74777c]")}>
        {rank}
      </span>
      <StudioPhoto />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[11px] font-black text-[#202329]">
            {premium ? "Aurora Beauty Studio" : "Beauty Studio"}
          </p>
          {premium ? (
            <span className="inline-flex items-center gap-1 text-[8px] font-extrabold text-[#ff5b08]">
              <Star className="h-2.5 w-2.5 fill-[#ff5b08]" /> Premium
            </span>
          ) : null}
        </div>
        <p className="mt-1 flex items-center gap-1 text-[9px] text-[#42464e]">
          <Star className="h-2.5 w-2.5 fill-[#ff9b2f] text-[#ff9b2f]" />
          {premium ? "4.9 (128)" : "4.2 (32)"}
        </p>
        <p className="mt-0.5 text-[9px] text-[#42464e]">Львів</p>
      </div>
    </div>
  );
}

function ResultsPanel({ premium = false }) {
  return (
    <div className="w-full rounded-xl border border-[#eeece9] bg-white p-2 shadow-[0_10px_30px_rgba(31,35,42,.035)]">
      <SearchField />
      <div className="mt-2">
        <StudioResult rank={premium ? 1 : 3} premium={premium} />
        <EmptyStudioRow rank={premium ? 2 : 4} />
        <EmptyStudioRow rank={premium ? 3 : 5} />
      </div>
    </div>
  );
}

const benefits = [
  {
    icon: Crown,
    title: "Позначка Premium",
    description: "Спеціальна відмітка біля назви вашої студії",
  },
  {
    icon: Rocket,
    title: "Перші позиції",
    description: "Ваша студія вище у пошуку та рекомендаціях",
  },
  {
    icon: Eye,
    title: "Більше переглядів",
    description: "Більше користувачів бачать вашу студію",
  },
  {
    icon: CalendarDays,
    title: "Більше бронювань",
    description: "Отримуйте більше онлайн-записів",
  },
  {
    icon: Sparkles,
    title: "Виділення серед інших",
    description: "Ваша студія помітніша та викликає довіру",
  },
];

function BenefitCard({ icon: Icon, title, description }) {
  return (
    <article className="flex min-h-[150px] flex-col items-center justify-center rounded-xl border border-[#efedeb] bg-white px-5 py-5 text-center shadow-[0_8px_24px_rgba(31,35,42,.035)] transition hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(31,35,42,.08)]">
      <Icon className="h-11 w-11 fill-[#ff5b08] text-[#ff5b08] stroke-[2]" />
      <h3 className="mt-3 text-[13px] font-black text-[#202329]">{title}</h3>
      <p className="mt-2 max-w-[170px] text-[11px] leading-[1.55] text-[#555961]">{description}</p>
    </article>
  );
}

function PremiumIllustration() {
  return (
    <div className="relative mx-auto h-[170px] w-[205px] shrink-0" aria-hidden="true">
      <Star className="absolute left-1 top-5 h-5 w-5 fill-[#ff6a0a] text-[#ff6a0a]" />
      <Star className="absolute right-3 top-[94px] h-5 w-5 fill-[#ff6a0a] text-[#ff6a0a]" />
      <div className="absolute bottom-3 left-8 h-[108px] w-[124px] -rotate-12 rounded-[30px] bg-[linear-gradient(145deg,#ff9a45,#ff6714)] shadow-[0_22px_34px_rgba(255,91,8,.28)]">
        <span className="absolute inset-0 grid rotate-12 place-items-center text-[52px] font-black italic text-white drop-shadow-[0_5px_3px_rgba(157,54,0,.22)]">A</span>
      </div>
      <Crown className="absolute left-[55px] top-0 h-[92px] w-[92px] -rotate-6 fill-[#ff8b1f] text-[#e85d00] drop-shadow-[0_8px_5px_rgba(164,61,0,.25)]" />
    </div>
  );
}

export default function PremiumPage({ onConnectPremium }) {
  const handleConnect = () => {
    if (typeof onConnectPremium === "function") onConnectPremium();
  };

  return (
    <main className="min-h-screen bg-white px-4 pb-10 pt-4 font-sans text-[#1f2329] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1280px]">
        <header className="flex h-10 items-center justify-end gap-7 pr-2 text-xs font-semibold text-[#2f333a]">
          <button type="button" className="relative transition hover:text-[#ff5b08]" aria-label="Сповіщення">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[#ff5b08] ring-2 ring-white" />
          </button>
          <button type="button" className="inline-flex items-center gap-2 transition hover:text-[#ff5b08]">
            <CircleHelp className="h-[18px] w-[18px]" />
            Потрібна допомога?
          </button>
        </header>

        <section className="relative overflow-hidden rounded-[22px] border border-[#f1ece8] bg-[linear-gradient(115deg,#fff_0%,#fffaf7_55%,#fff5ee_100%)] px-6 py-9 shadow-[0_8px_30px_rgba(36,31,27,.025)] sm:px-10 lg:grid lg:grid-cols-[.82fr_1.25fr] lg:gap-12 lg:px-12 lg:py-10">
          <div className="relative z-10">
            <h1 className="text-[42px] font-black leading-none tracking-[-0.055em] text-[#202329] sm:text-[50px]">
              Aveliio <span className="text-[#ff5b08]">Premium</span>
            </h1>
            <h2 className="mt-5 max-w-[410px] text-[20px] font-black leading-[1.35] tracking-[-0.02em]">
              Виділіть свою студію серед інших та отримайте більше клієнтів
            </h2>
            <ul className="mt-5 space-y-3 text-[13px]">
              <CheckLine muted>Перші позиції в пошуку та рекомендаціях</CheckLine>
              <CheckLine muted>Більше переглядів вашої сторінки</CheckLine>
              <CheckLine muted>Більше онлайн-бронювань</CheckLine>
            </ul>
            <div className="mt-7">
              <PremiumButton onClick={handleConnect} className="w-full sm:w-[292px]" />
              <p className="mt-3 flex items-center gap-2 text-[10px] font-medium text-[#646870]">
                <LockKeyhole className="h-4 w-4" />
                Без прихованих платежів. Скасування у будь-який час
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-10 lg:mt-0">
            <div className="grid items-start gap-9 sm:grid-cols-[1fr_auto_1fr] sm:gap-3">
              <div>
                <div className="mb-2 flex h-7 items-center justify-center">
                  <span className="rounded-md bg-[#eeeeee] px-3 py-1 text-[10px] font-bold text-[#61656c]">Звичайна студія</span>
                </div>
                <ResultsPanel />
              </div>

              <ArrowRight className="mx-auto hidden h-11 w-11 self-center text-[#ff5b08] sm:block" />

              <div>
                <div className="mb-2 flex h-7 items-center justify-center">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-[#ff5b08] px-3 py-1 text-[10px] font-extrabold text-white shadow-[0_5px_14px_rgba(255,91,8,.24)]">
                    <Star className="h-3 w-3 fill-white" /> Premium Studio
                  </span>
                </div>
                <ResultsPanel premium />
              </div>
            </div>
            <p className="mt-3 flex items-center justify-center gap-2 text-center text-[10px] text-[#62666d]">
              <Info className="h-4 w-4" />
              Premium-студії відображаються вище у пошуку та рекомендаціях
            </p>
          </div>
        </section>

        <section className="py-7 sm:px-10">
          <h2 className="text-center text-[20px] font-black tracking-[-0.02em]">Що ви отримуєте з Premium</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {benefits.map((benefit) => (
              <BenefitCard key={benefit.title} {...benefit} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
