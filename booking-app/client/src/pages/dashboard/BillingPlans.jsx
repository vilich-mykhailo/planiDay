// BillingPlans.jsx
import { useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Crown,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const plans = [
  {
    id: "start",
    name: "Start",
    icon: Rocket,
    price: "0 грн",
    period: "6 місяців",
    badge: "Для старту",
    description:
      "Базовий план, щоб запустити студію в PlaniDay і приймати перші онлайн-записи.",
    features: [
      "Профіль студії в каталозі",
      "Послуги та категорії",
      "Майстри студії",
      "Онлайн-запис клієнтів",
      "Базовий графік роботи",
      "Повідомлення про нові записи",
    ],
    buttonText: "Поточний план",
    muted: true,
  },
  {
    id: "pro",
    name: "Studio Pro",
    icon: ShieldCheck,
    price: "500 грн",
    period: "на місяць",
    badge: "Рекомендовано",
    description:
      "Оптимальний тариф для студії, яка активно працює із записами, клієнтами та майстрами.",
    features: [
      "Безлімітні записи",
      "CRM клієнтів",
      "VIP-клієнти та нотатки",
      "Особливі дати та перерви",
      "Історія записів клієнта",
      "Експорт даних в Excel",
      "Пріоритетна підтримка",
    ],
    buttonText: "Обрати Pro",
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    icon: Crown,
    price: "900 грн",
    period: "на місяць",
    badge: "Максимум можливостей",
    description:
      "Для студій, які хочуть більше видимості, кращу презентацію та перевагу в каталозі.",
    features: [
      "Усе з тарифу Studio Pro",
      "Преміум-позначка студії",
      "Вище місце в рекомендаціях",
      "Розширена аналітика студії",
      "Промо-блок у профілі студії",
      "Персональна допомога з налаштуванням",
    ],
    buttonText: "Обрати Premium",
    premium: true,
  },
];

export default function BillingPlans() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState("pro");

  const activePlan = plans.find((plan) => plan.id === selectedPlan);

  return (
    <div className="mx-auto max-w-[1180px] pb-10">
      <div className="mb-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="inline-flex h-10 items-center gap-2 rounded-[14px] border border-[#eadfce] bg-white px-4 text-[13px] font-bold text-[#5f6673] transition hover:border-[#ffcab6] hover:text-[#ff4f12] active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад
        </button>

        <div className="hidden items-center gap-2 rounded-full border border-[#ffe0d2] bg-[#fff7f2] px-4 py-2 text-[12px] font-black text-[#ff4f12] sm:flex">
          <Sparkles className="h-4 w-4" />
          Тарифи PlaniDay
        </div>
      </div>

      <section className="overflow-hidden rounded-[30px] border border-[#f0e4d8] bg-white shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
        <div className="relative overflow-hidden bg-[#fff8f4] px-5 py-7 sm:px-8 lg:px-10">
          <div className="absolute right-[-90px] top-[-90px] h-[220px] w-[220px] rounded-full bg-[#ffefe7]" />
          <div className="absolute bottom-[-120px] left-[35%] h-[220px] w-[220px] rounded-full bg-[#fff0df]" />

          <div className="relative z-10 grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#ffd9c8] bg-white px-4 py-2 text-[12px] font-black uppercase tracking-wide text-[#ff4f12]">
                <Zap className="h-4 w-4" />
                Оновлення плану
              </div>

              <h1 className="max-w-[720px] text-[30px] font-black leading-[1.05] tracking-[-0.05em] text-[#111827] sm:text-[42px]">
                Оберіть тариф для розвитку вашої студії
              </h1>

              <p className="mt-4 max-w-[680px] text-[14px] font-medium leading-7 text-[#6b7280] sm:text-[15px]">
                Підключіть більше можливостей для онлайн-запису, роботи з
                клієнтами, майстрами, графіком та просуванням студії в
                PlaniDay.
              </p>
            </div>

            <div className="rounded-[24px] border border-[#ffe0d2] bg-white p-4 shadow-[0_18px_40px_rgba(255,79,18,0.07)]">
              <p className="text-[12px] font-black uppercase tracking-wide text-[#9ca3af]">
                Обраний план
              </p>

              <div className="mt-3 flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-[17px] bg-[#fff0e6] text-[#ff4f12]">
                  {activePlan?.premium ? (
                    <Crown className="h-5 w-5" />
                  ) : activePlan?.id === "start" ? (
                    <Rocket className="h-5 w-5" />
                  ) : (
                    <ShieldCheck className="h-5 w-5" />
                  )}
                </div>

                <div>
                  <p className="text-[16px] font-black text-[#111827]">
                    {activePlan?.name}
                  </p>
                  <p className="text-[13px] font-semibold text-[#6b7280]">
                    {activePlan?.price} / {activePlan?.period}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-[12px] font-medium leading-5 text-[#6b7280]">
                Після підключення оплати тут можна буде зробити оплату або
                змінити тариф студії.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-3 lg:p-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isSelected = selectedPlan === plan.id;

            return (
              <article
                key={plan.id}
                className={cn(
                  "relative flex min-h-[520px] flex-col rounded-[28px] border bg-white p-5 transition-all duration-300",
                  plan.popular
                    ? "border-[#ff9b78] shadow-[0_22px_60px_rgba(255,79,18,0.13)]"
                    : "border-[#f0e4d8] shadow-[0_18px_45px_rgba(15,23,42,0.04)]",
                  isSelected && "ring-2 ring-[#ff4f12]/20",
                )}
              >
                {plan.popular && (
                  <div className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-[#ff4f12] px-3 py-1.5 text-[11px] font-black text-white shadow-[0_10px_25px_rgba(255,79,18,0.25)]">
                    <Star className="h-3.5 w-3.5 fill-white" />
                    ТОП
                  </div>
                )}

                <div
                  className={cn(
                    "grid h-13 w-13 place-items-center rounded-[20px]",
                    plan.premium
                      ? "bg-[#111827] text-white"
                      : "bg-[#fff0e6] text-[#ff4f12]",
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>

                <div className="mt-5">
                  <div className="inline-flex rounded-full bg-[#f8f8f8] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-[#6b7280]">
                    {plan.badge}
                  </div>

                  <h2 className="mt-4 text-[24px] font-black tracking-[-0.04em] text-[#111827]">
                    {plan.name}
                  </h2>

                  <div className="mt-3 flex items-end gap-2">
                    <p className="text-[34px] font-black leading-none tracking-[-0.06em] text-[#111827]">
                      {plan.price}
                    </p>
                    <p className="pb-1 text-[13px] font-bold text-[#9ca3af]">
                      {plan.period}
                    </p>
                  </div>

                  <p className="mt-4 min-h-[66px] text-[13px] font-medium leading-6 text-[#6b7280]">
                    {plan.description}
                  </p>
                </div>

                <div className="my-5 h-px bg-[#f1ebe5]" />

                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex gap-2.5 text-[13px] font-semibold leading-5 text-[#374151]"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#41a85f]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-6">
                  <button
                    type="button"
                    onClick={() => setSelectedPlan(plan.id)}
                    className={cn(
                      "h-12 w-full rounded-[16px] text-[14px] font-black transition-all duration-300 active:scale-[0.98]",
                      plan.muted
                        ? "border border-[#eadfce] bg-white text-[#6b7280] hover:bg-[#f8f8f8]"
                        : plan.premium
                          ? "bg-[#111827] text-white hover:bg-[#0b1220]"
                          : "bg-[#ff4f12] text-white shadow-[0_14px_30px_rgba(255,79,18,0.22)] hover:bg-[#f0440b]",
                    )}
                  >
                    {isSelected ? "Обрано" : plan.buttonText}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="border-t border-[#f0e4d8] bg-[#fffaf6] p-4 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-[22px] border border-[#f0e4d8] bg-white p-5">
              <BadgeCheck className="h-5 w-5 text-[#ff4f12]" />
              <p className="mt-3 text-[14px] font-black text-[#111827]">
                Без ризику для старту
              </p>
              <p className="mt-2 text-[13px] font-medium leading-6 text-[#6b7280]">
                Студія може почати з безкоштовного періоду, протестувати
                онлайн-запис і тільки потім перейти на платний тариф.
              </p>
            </div>

            <div className="rounded-[22px] border border-[#f0e4d8] bg-white p-5">
              <ShieldCheck className="h-5 w-5 text-[#ff4f12]" />
              <p className="mt-3 text-[14px] font-black text-[#111827]">
                Усе для щоденної роботи
              </p>
              <p className="mt-2 text-[13px] font-medium leading-6 text-[#6b7280]">
                Записи, графік, майстри, клієнти, статуси, VIP та історія
                відвідувань — усе в одному кабінеті.
              </p>
            </div>

            <div className="rounded-[22px] border border-[#f0e4d8] bg-white p-5">
              <Crown className="h-5 w-5 text-[#ff4f12]" />
              <p className="mt-3 text-[14px] font-black text-[#111827]">
                Більше видимості
              </p>
              <p className="mt-2 text-[13px] font-medium leading-6 text-[#6b7280]">
                Premium допоможе студії виглядати сильніше в каталозі та краще
                презентувати себе клієнтам.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}