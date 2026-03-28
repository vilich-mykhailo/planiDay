// BookingSuccess.jsx
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function formatUA(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return dt.toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BookingSuccess() {
  const navigate = useNavigate();
  const { state } = useLocation();

  // Очікуваний state (опційно):
  // {
  //   studioName, serviceName, date, time, address
  // }
  const studioName = state?.studioName || null;
  const serviceName = state?.serviceName || null;
  const date = state?.date || null;
  const time = state?.time || null;
  const address = state?.address || null;
  const phone = state?.phone || null;

  // Легкий "confetti" ефект через CSS (без canvas)
  useEffect(() => {
    const t = setTimeout(() => {}, 0);
    return () => clearTimeout(t);
  }, []);

  const whenText = date && time ? `${time}, ${formatUA(date)}` : null;

  return (
    <div className="relative min-h-[70dvh] w-full flex items-center justify-center px-4">
      {/* Confetti lines */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <span className="confetti confetti-1" />
        <span className="confetti confetti-2" />
        <span className="confetti confetti-3" />
        <span className="confetti confetti-4" />
        <span className="confetti confetti-5" />
      </div>

      {/* Content */}
      <div className="relative w-full max-w-lg z-10">
        <div className="rounded-3xl border bg-white shadow-[0_20px_60px_-25px_rgba(0,0,0,0.25)] overflow-hidden animate-pop">
          {/* Header */}
          <div className="p-6 sm:p-7 ">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white grid place-items-center shadow-sm animate-check">
                <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div className="min-w-0">
                <h1 className="!text-2xl sm:!text-3xl md:!text-4xl lg:!text-5xl font-bold text-gray-900">
                  Ви записані
                </h1>

                <p className="mt-1 text-sm text-gray-600">
                  {studioName ? (
                    <>
                      Студія:{" "}
                      <span className="font-semibold text-gray-900">
                        {studioName}
                      </span>
                    </>
                  ) : (
                    <>Дякуємо! Ваш запис успішно створено.</>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="p-4 sm:p-7 space-y-4">
            {whenText || serviceName || address ? (
              <div className="grid gap-3">
                {serviceName && (
                  <div className="flex items-start gap-3 rounded-2xl border bg-gray-50 p-4">
                    <IconSpark />
                    <div>
                      <p className="text-sm text-gray-600">Послуга:</p>
                      <p className="font-semibold text-gray-900">
                        {serviceName}
                      </p>
                    </div>
                  </div>
                )}
                {address && (
                  <div className="flex items-start gap-3 rounded-2xl border bg-gray-50 p-4">
                    <IconPin />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-600">Адреса:</p>
                      <p className="font-semibold text-gray-900 break-words">
                        {address}
                      </p>
                    </div>
                  </div>
                )}
                {whenText && (
                  <div className="flex items-start gap-3 rounded-2xl border bg-gray-50 p-4">
                    <IconClock />
                    <div>
                      <p className="text-sm text-gray-600">Час запису:</p>
                      <p className="font-semibold text-gray-900">{whenText}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-600">
                Майстер звʼяжеться з вами найближчим часом для підтвердження.
              </p>
            )}

            {phone && (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-0 py-3">
                {/* текст */}
                <p className="text-xs font-medium text-emerald-800 text-center">
                  Підтвердження надіслано на {phone}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1 sm:justify-end">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="w-full rounded-2xl bg-gray-900 text-white py-3 px-5 font-semibold hover:bg-black active:scale-[0.99] transition"
              >
                На головну
              </button>

              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-2xl border border-gray-200 bg-white py-3 px-5 font-semibold text-gray-900 hover:bg-gray-50 active:scale-[0.99] transition"
              >
                Назад
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* component-scoped css (можеш винести у файл) */}
      <style>{`
        @keyframes pop {
          0% { transform: translateY(14px) scale(0.98); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        .animate-pop { animation: pop 420ms cubic-bezier(.2,.8,.2,1) both; }

        @keyframes check {
          0% { transform: scale(0.6) rotate(-8deg); opacity: 0; }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
        .animate-check { animation: check 420ms cubic-bezier(.2,.9,.2,1) 120ms both; }

        @keyframes fadein { from {opacity: 0;} to {opacity: 1;} }
        .animate-fadein { animation: fadein 600ms ease 260ms both; }

        @keyframes floaty { 0%,100% { transform: translateY(0); } 50% { transform: translateY(16px); } }
        .animate-float { animation: floaty 6s ease-in-out infinite; }
        .animate-float2 { animation: floaty 7.5s ease-in-out infinite; }

        .confetti {
          position: absolute;
          top: -20px;
          width: 8px;
          height: 60px;
          border-radius: 999px;
          opacity: 0;
          animation: conf 900ms ease-out 120ms both;
        }
        @keyframes conf {
          0% { transform: translateY(-20px) rotate(18deg); opacity: 0; }
          20% { opacity: 0.9; }
          100% { transform: translateY(240px) rotate(18deg); opacity: 0; }
        }
        .confetti-1 { left: 18%; background: rgba(16,185,129,.55); animation-delay: 80ms; }
        .confetti-2 { left: 34%; background: rgba(59,130,246,.45); animation-delay: 160ms; }
        .confetti-3 { left: 52%; background: rgba(234,179,8,.45); animation-delay: 120ms; }
        .confetti-4 { left: 70%; background: rgba(236,72,153,.40); animation-delay: 200ms; }
        .confetti-5 { left: 86%; background: rgba(107,114,128,.35); animation-delay: 140ms; }
      `}</style>
    </div>
  );
}

function IconClock() {
  return (
    <div className="mt-0.5 h-9 w-9 rounded-xl bg-white border grid place-items-center text-gray-900">
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M12 8v5l3 2"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          stroke="currentColor"
          stroke-width="2"
        />
      </svg>
    </div>
  );
}

function IconPin() {
  return (
    <div className="mt-0.5 h-9 w-9 rounded-xl bg-white border grid place-items-center text-gray-900">
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11Z"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <circle
          cx="12"
          cy="10"
          r="2.5"
          stroke="currentColor"
          stroke-width="2"
        />
      </svg>
    </div>
  );
}

function IconSpark() {
  return (
    <div className="mt-0.5 h-9 w-9 rounded-xl bg-white border grid place-items-center text-gray-900">
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 18l-5.8 3.1 1.1-6.5L2.6 9.8l6.5-.9L12 3Z"
          stroke="currentColor"
          stroke-width="2"
          stroke-linejoin="round"
        />
      </svg>
    </div>
  );
}

function IconPhone() {
  return (
    <div className="mt-0.5 h-9 w-9 rounded-xl bg-white border grid place-items-center text-gray-900">
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M22 16.9v3a2 2 0 0 1-2.2 2 19.9 19.9 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.9 19.9 0 0 1-3.1-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2L8.1 9a16 16 0 0 0 7 7l.7-1.1a2 2 0 0 1 2-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.6 1.9Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
