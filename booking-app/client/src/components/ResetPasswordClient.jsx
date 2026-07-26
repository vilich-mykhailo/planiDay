// ResetPasswordClient.jsx
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useState } from "react";
import {
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { api } from "../api/http";

export default function ResetPasswordClient() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!token) {
      setError(
        "Посилання для відновлення недійсне.",
      );
      return;
    }

    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\S]{8,}$/;

    if (!passwordRegex.test(password)) {
      setError(
        "Пароль має містити мінімум 8 символів, латинську літеру та цифру.",
      );
      return;
    }

    if (/\s/.test(password)) {
      setError(
        "Пароль не може містити пробіли.",
      );
      return;
    }

    if (password !== repeatPassword) {
      setError("Паролі не збігаються.");
      return;
    }

    try {
      setLoading(true);

      await api(
        "/auth/client/reset-password",
        {
          method: "POST",
          body: {
            token,
            password,
          },
        },
      );

      navigate("/login", {
        replace: true,
        state: {
          passwordResetSuccess: true,
        },
      });
    } catch (err) {
      setError(
        err?.message ||
          "Не вдалося змінити пароль.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center">
          <div className="mx-auto mb-3 h-16 w-16">
            <img
              src="/aveliio_logo.png"
              alt="Aveliio"
              className="h-full w-full object-contain"
            />
          </div>

          <h1 className="text-3xl font-black tracking-tight text-[#202020]">
            Новий пароль
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#77716b]">
            Створи новий пароль для свого акаунта
          </p>
        </div>

        <div className="mt-8 rounded-[28px] border border-[#eadfce] bg-white p-6 shadow-[0_16px_44px_rgba(15,23,42,0.08)]">
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <label className="block">
              <span className="text-sm font-black text-[#202020]">
                Новий пароль
              </span>

              <div className="mt-2 flex h-14 items-center gap-3 rounded-[18px] border border-[#eadfce] bg-white px-4 focus-within:border-[#ff6200] focus-within:ring-4 focus-within:ring-[#ff6200]/10">
                <Lock className="h-5 w-5 text-[#8a847d]" />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Мінімум 8 символів"
                  className="w-full bg-transparent text-sm font-bold text-[#202020] outline-none"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (previous) => !previous,
                    )
                  }
                  className="text-[#9f9f9f] transition hover:text-[#ff6200]"
                >
                  {showPassword ? (
                    <Eye className="h-5 w-5" />
                  ) : (
                    <EyeOff className="h-5 w-5" />
                  )}
                </button>
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-black text-[#202020]">
                Повтори пароль
              </span>

              <div className="mt-2 flex h-14 items-center gap-3 rounded-[18px] border border-[#eadfce] bg-white px-4 focus-within:border-[#ff6200] focus-within:ring-4 focus-within:ring-[#ff6200]/10">
                <Lock className="h-5 w-5 text-[#8a847d]" />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="new-password"
                  value={repeatPassword}
                  onChange={(event) =>
                    setRepeatPassword(
                      event.target.value,
                    )
                  }
                  placeholder="Повтори новий пароль"
                  className="w-full bg-transparent text-sm font-bold text-[#202020] outline-none"
                />
              </div>
            </label>

            {error && (
              <div className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !token}
              className="
                inline-flex h-[52px] w-full
                items-center justify-center
                rounded-[15px]
                bg-[#202020]
                text-sm font-black text-white
                shadow-[0_12px_26px_rgba(15,15,15,0.18)]
                transition-all duration-300
                hover:scale-[1.015]
                hover:bg-[#ff6200]
                active:scale-[0.98]
                disabled:pointer-events-none
                disabled:bg-[#eee9e3]
                disabled:text-[#aaa19a]
                disabled:shadow-none
              "
            >
              {loading
                ? "Збереження..."
                : "Змінити пароль"}
            </button>
          </form>

          <div className="mt-6 border-t border-[#eee8e1] pt-5 text-center">
            <Link
              to="/login"
              className="text-sm font-black text-[#ff6200] hover:underline"
            >
              Повернутися до входу
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}