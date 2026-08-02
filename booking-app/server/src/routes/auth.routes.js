// auth.routes.js
import { Router } from "express";
import { randomUUID } from "node:crypto";

import { prisma } from "../lib/prisma.js";
import {
  hashPassword,
  verifyPassword,
} from "../lib/password.js";
import { signToken } from "../lib/jwt.js";
import { requireAuth } from "../middleware/auth.js";
import {
  sendClientRegistrationCode,
  sendClientPasswordResetEmail,
} from "../lib/mailer.js";
import {
  createPasswordResetToken,
  hashPasswordResetToken,
  PASSWORD_RESET_TTL_MS,
} from "../lib/passwordReset.js";

import {
  createRegistrationCode,
  createCodeHash,
  compareCodeHashes,
  normalizeEmail,
  REGISTRATION_CODE_TTL_MS,
  REGISTRATION_RESEND_DELAY_MS,
  MAX_CODE_ATTEMPTS,
} from "../lib/verificationCode.js";

export const authRouter = Router();

function validateEmailPassword(email, password) {
  if (!email || !password) {
    return "Email and password are required";
  }

  if (password.length < 6) {
    return "Password must be at least 6 characters";
  }

  return null;
}

// OWNER registration: request verification code
authRouter.post("/owner/register/request-code", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const phone = String(req.body?.phone || "").trim();
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");
if (!email || !password) {
  return res.status(400).json({
    message: "Заповніть усі обов’язкові поля.",
  });
}

    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\S]{8,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Пароль має містити мінімум 8 символів, латинську літеру та цифру.",
      });
    }

    if (/\s/.test(password)) {
      return res.status(400).json({
        message: "Пароль не може містити пробіли.",
      });
    }

const existingOwner =
  await prisma.ownerAccount.findUnique({
    where: { email },
    select: { id: true },
  });

if (existingOwner) {
  return res.status(409).json({
    message:
      "Акаунт власника з такою електронною поштою вже існує.",
  });
}

    const previousVerification =
      await prisma.ownerRegistrationVerification.findUnique({
        where: { email },
      });

    const now = new Date();

    if (
      previousVerification &&
      previousVerification.resendAfter > now
    ) {
      const retryAfter = Math.ceil(
        (
          previousVerification.resendAfter.getTime() -
          Date.now()
        ) / 1000,
      );

      return res.status(429).json({
        message: `Новий код можна надіслати через ${retryAfter} с.`,
        retryAfter,
      });
    }

    const passwordHash = await hashPassword(password);
    const code = createRegistrationCode();

    const verificationId =
      previousVerification?.id || randomUUID();

    const codeHash = createCodeHash(
      verificationId,
      code,
    );

    const expiresAt = new Date(
      Date.now() + REGISTRATION_CODE_TTL_MS,
    );

    const resendAfter = new Date(
      Date.now() + REGISTRATION_RESEND_DELAY_MS,
    );

    let verification;

    if (previousVerification) {
      verification =
        await prisma.ownerRegistrationVerification.update({
          where: {
            id: previousVerification.id,
          },
          data: {
            name,
            phone: phone || null,
            passwordHash,
            codeHash,
            attempts: 0,
            expiresAt,
            resendAfter,
          },
        });
    } else {
      verification =
        await prisma.ownerRegistrationVerification.create({
          data: {
            id: verificationId,
            name,
            phone: phone || null,
            email,
            passwordHash,
            codeHash,
            attempts: 0,
            expiresAt,
            resendAfter,
          },
        });
    }

    try {
      await sendClientRegistrationCode({
        email,
        code,
      });
    } catch (mailError) {
      console.error(
        "Owner registration email error:",
        mailError,
      );

      await prisma.ownerRegistrationVerification
        .delete({
          where: {
            id: verification.id,
          },
        })
        .catch(() => {});

      return res.status(500).json({
        message:
          "Не вдалося надіслати код. Перевірте адресу пошти та спробуйте ще раз.",
      });
    }

    return res.json({
      message: "Код підтвердження надіслано.",
      verificationId: verification.id,
      email: verification.email,
      expiresIn: 600,
      resendAfter: 60,
    });
  } catch (error) {
    console.error(
      "Request owner registration code error:",
      error,
    );

    return res.status(500).json({
      message:
        "Не вдалося надіслати код підтвердження.",
    });
  }
});

// OWNER registration: verify code
authRouter.post("/owner/register/verify-code", async (req, res) => {
  try {
    const verificationId = String(
      req.body?.verificationId || "",
    ).trim();

    const code = String(req.body?.code || "")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!verificationId || code.length !== 6) {
      return res.status(400).json({
        message: "Введіть 6-значний код.",
      });
    }

    const verification =
      await prisma.ownerRegistrationVerification.findUnique({
        where: {
          id: verificationId,
        },
      });

    if (!verification) {
      return res.status(404).json({
        message:
          "Запит на реєстрацію не знайдено. Заповніть форму повторно.",
      });
    }

    if (verification.expiresAt.getTime() < Date.now()) {
      await prisma.ownerRegistrationVerification.delete({
        where: {
          id: verification.id,
        },
      });

      return res.status(410).json({
        message:
          "Термін дії коду закінчився. Надішліть новий код.",
      });
    }

    if (verification.attempts >= MAX_CODE_ATTEMPTS) {
      await prisma.ownerRegistrationVerification.delete({
        where: {
          id: verification.id,
        },
      });

      return res.status(429).json({
        message:
          "Перевищено кількість спроб. Заповніть форму повторно.",
      });
    }

    const receivedCodeHash = createCodeHash(
      verification.id,
      code,
    );

    const codeIsCorrect = compareCodeHashes(
      verification.codeHash,
      receivedCodeHash,
    );

    if (!codeIsCorrect) {
      const result =
        await prisma.ownerRegistrationVerification.update({
          where: {
            id: verification.id,
          },
          data: {
            attempts: {
              increment: 1,
            },
          },
          select: {
            attempts: true,
          },
        });

      const attemptsLeft = Math.max(
        0,
        MAX_CODE_ATTEMPTS - result.attempts,
      );

      return res.status(400).json({
        message:
          attemptsLeft > 0
            ? `Неправильний код. Залишилось спроб: ${attemptsLeft}.`
            : "Перевищено кількість спроб. Заповніть форму повторно.",
        attemptsLeft,
      });
    }

    const owner = await prisma.$transaction(async (tx) => {
      const existingOwner = await tx.ownerAccount.findUnique({
        where: {
          email: verification.email,
        },
        select: {
          id: true,
        },
      });

      if (existingOwner) {
        throw new Error("OWNER_ALREADY_EXISTS");
      }

      const createdOwner = await tx.ownerAccount.create({
        data: {
          name: verification.name,
          phone: verification.phone,
          email: verification.email,
          passwordHash: verification.passwordHash,
        },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      });

      await tx.ownerRegistrationVerification.delete({
        where: {
          id: verification.id,
        },
      });

      return createdOwner;
    });

    const token = signToken({
      sub: owner.id,
      kind: "owner",
    });

    return res.status(201).json({
      message:
        "Email підтверджено. Акаунт власника створено.",
      token,
      kind: "owner",
      owner,
    });
  } catch (error) {
    if (error?.message === "OWNER_ALREADY_EXISTS") {
      return res.status(409).json({
        message:
          "Акаунт власника з таким email уже існує.",
      });
    }

    console.error(
      "Verify owner registration code error:",
      error,
    );

    return res.status(500).json({
      message: "Не вдалося підтвердити код.",
    });
  }
});

// OWNER registration: resend code
authRouter.post("/owner/register/resend-code", async (req, res) => {
  try {
    const verificationId = String(
      req.body?.verificationId || "",
    ).trim();

    if (!verificationId) {
      return res.status(400).json({
        message: "Не вказано запит на реєстрацію.",
      });
    }

    const verification =
      await prisma.ownerRegistrationVerification.findUnique({
        where: {
          id: verificationId,
        },
      });

    if (!verification) {
      return res.status(404).json({
        message:
          "Запит на реєстрацію не знайдено. Заповніть форму повторно.",
      });
    }

    if (verification.resendAfter.getTime() > Date.now()) {
      const retryAfter = Math.ceil(
        (
          verification.resendAfter.getTime() -
          Date.now()
        ) / 1000,
      );

      return res.status(429).json({
        message:
          `Повторне надсилання буде доступне через ${retryAfter} с.`,
        retryAfter,
      });
    }

    const code = createRegistrationCode();

    const codeHash = createCodeHash(
      verification.id,
      code,
    );

    const updatedVerification =
      await prisma.ownerRegistrationVerification.update({
        where: {
          id: verification.id,
        },
        data: {
          codeHash,
          attempts: 0,
          expiresAt: new Date(
            Date.now() + REGISTRATION_CODE_TTL_MS,
          ),
          resendAfter: new Date(
            Date.now() + REGISTRATION_RESEND_DELAY_MS,
          ),
        },
      });

    await sendClientRegistrationCode({
      email: updatedVerification.email,
      code,
    });

    return res.json({
      message: "Новий код надіслано.",
      resendAfter: 60,
    });
  } catch (error) {
    console.error(
      "Resend owner registration code error:",
      error,
    );

    return res.status(500).json({
      message:
        "Не вдалося повторно надіслати код.",
    });
  }
});

// OWNER forgot password
authRouter.post(
  "/owner/forgot-password",
  async (req, res) => {
    const genericResponse = {
      message:
        "Якщо акаунт із таким email існує, інструкцію надіслано.",
    };

    try {
      const email = normalizeEmail(req.body?.email);

      if (!email) {
        return res.status(400).json({
          message: "Вкажіть email.",
        });
      }

      const owner = await prisma.ownerAccount.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
          email: true,
        },
      });

      // Не повідомляємо, чи існує такий акаунт
      if (!owner) {
        return res.json(genericResponse);
      }

      // Видаляємо попередні посилання власника
      await prisma.ownerPasswordResetToken.deleteMany({
        where: {
          ownerId: owner.id,
        },
      });

      const rawToken = createPasswordResetToken();
      const tokenHash =
        hashPasswordResetToken(rawToken);

      const expiresAt = new Date(
        Date.now() + PASSWORD_RESET_TTL_MS,
      );

      const resetRecord =
        await prisma.ownerPasswordResetToken.create({
          data: {
            ownerId: owner.id,
            tokenHash,
            expiresAt,
          },
        });

      const frontendUrl = String(
        process.env.FRONTEND_URL ||
          "http://localhost:5173",
      ).replace(/\/+$/, "");

      const resetUrl =
        `${frontendUrl}/reset-password-owner` +
        `?token=${encodeURIComponent(rawToken)}`;

      try {
        await sendClientPasswordResetEmail({
          email: owner.email,
          resetUrl,
        });
      } catch (mailError) {
        console.error(
          "Owner password reset email error:",
          mailError,
        );

        await prisma.ownerPasswordResetToken
          .delete({
            where: {
              id: resetRecord.id,
            },
          })
          .catch(() => {});
      }

      return res.json(genericResponse);
    } catch (error) {
      console.error(
        "Owner forgot password error:",
        error,
      );

      return res.status(500).json({
        message:
          "Не вдалося обробити запит. Спробуйте ще раз.",
      });
    }
  },
);


// OWNER reset password
authRouter.post(
  "/owner/reset-password",
  async (req, res) => {
    try {
      const token = String(
        req.body?.token || "",
      ).trim();

      const password = String(
        req.body?.password || "",
      );

      if (!token) {
        return res.status(400).json({
          message:
            "Посилання для відновлення недійсне.",
        });
      }

      const passwordRegex =
        /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\S]{8,}$/;

      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          message:
            "Пароль має містити мінімум 8 символів, латинську літеру та цифру.",
        });
      }

      if (/\s/.test(password)) {
        return res.status(400).json({
          message:
            "Пароль не може містити пробіли.",
        });
      }

      const tokenHash =
        hashPasswordResetToken(token);

      const resetRecord =
        await prisma.ownerPasswordResetToken.findUnique({
          where: {
            tokenHash,
          },
        });

      if (!resetRecord) {
        return res.status(400).json({
          message:
            "Посилання недійсне або вже було використане.",
        });
      }

      if (
        resetRecord.expiresAt.getTime() <
        Date.now()
      ) {
        await prisma.ownerPasswordResetToken.delete({
          where: {
            id: resetRecord.id,
          },
        });

        return res.status(410).json({
          message:
            "Термін дії посилання закінчився. Надішліть новий запит.",
        });
      }

      const passwordHash =
        await hashPassword(password);

      await prisma.$transaction(async (tx) => {
        await tx.ownerAccount.update({
          where: {
            id: resetRecord.ownerId,
          },
          data: {
            passwordHash,
          },
        });

        await tx.ownerPasswordResetToken.deleteMany({
          where: {
            ownerId: resetRecord.ownerId,
          },
        });
      });

      return res.json({
        message:
          "Пароль власника успішно змінено.",
      });
    } catch (error) {
      console.error(
        "Owner reset password error:",
        error,
      );

      return res.status(500).json({
        message:
          "Не вдалося змінити пароль.",
      });
    }
  },
);


// OWNER login
authRouter.post("/owner/login", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");

  const err = validateEmailPassword(email, password);

  if (err) {
    return res.status(400).json({
      message: err,
    });
  }

  const owner = await prisma.ownerAccount.findUnique({
    where: { email },
  });

  if (!owner) {
    return res.status(401).json({
      message: "Власника з такою електронною поштою не знайдено.",
    });
  }

  const passwordIsCorrect = await verifyPassword(
    password,
    owner.passwordHash,
  );

  if (!passwordIsCorrect) {
    return res.status(401).json({
      message: "Неправильний пароль.",
    });
  }

  const token = signToken({
    sub: owner.id,
    kind: "owner",
  });

  return res.json({
    token,
    kind: "owner",
  });
});

authRouter.post("/client/register/request-code", async (req, res) => {
  try {
const email = normalizeEmail(req.body?.email);
const password = String(req.body?.password || "");

if (!email || !password) {
  return res.status(400).json({
    message: "Заповни всі обов’язкові поля.",
  });
}

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\S]{8,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Пароль має містити мінімум 8 символів, латинську літеру та цифру.",
      });
    }

    if (/\s/.test(password)) {
      return res.status(400).json({
        message: "Пароль не може містити пробіли.",
      });
    }

const existingClient =
  await prisma.clientAccount.findUnique({
    where: { email },
    select: { id: true },
  });

if (existingClient) {
  return res.status(409).json({
    message:
      "Акаунт клієнта з такою електронною поштою вже існує.",
  });
}

    const now = new Date();

    const previousVerification =
      await prisma.clientRegistrationVerification.findUnique({
        where: { email },
      });

    if (previousVerification && previousVerification.resendAfter > now) {
      const retryAfter = Math.ceil(
        (previousVerification.resendAfter.getTime() - Date.now()) / 1000,
      );

      return res.status(429).json({
        message: `Новий код можна надіслати через ${retryAfter} с.`,
        retryAfter,
      });
    }

    const passwordHash = await hashPassword(password);
    const code = createRegistrationCode();

    const verificationId = previousVerification?.id || randomUUID();

    const codeHash = createCodeHash(verificationId, code);

    const expiresAt = new Date(Date.now() + REGISTRATION_CODE_TTL_MS);

    const resendAfter = new Date(Date.now() + REGISTRATION_RESEND_DELAY_MS);

    let verification;

    if (previousVerification) {
      verification = await prisma.clientRegistrationVerification.update({
        where: {
          id: previousVerification.id,
        },
data: {
  passwordHash,
  codeHash,
  attempts: 0,
  expiresAt,
  resendAfter,
},
      });
    } else {
      verification = await prisma.clientRegistrationVerification.create({
data: {
  id: verificationId,
  email,
  passwordHash,
  codeHash,
  attempts: 0,
  expiresAt,
  resendAfter,
},
      });
    }

    try {
      await sendClientRegistrationCode({
        email,
        code,
      });
    } catch (mailError) {
      console.error("Registration email error:", mailError);

      await prisma.clientRegistrationVerification
        .delete({
          where: {
            id: verification.id,
          },
        })
        .catch(() => {});

      return res.status(500).json({
        message:
          "Не вдалося надіслати код. Перевірте адресу пошти та спробуйте ще раз.",
      });
    }

    return res.json({
      message: "Код підтвердження надіслано.",
      verificationId: verification.id,
      email: verification.email,
      expiresIn: 600,
      resendAfter: 60,
    });
  } catch (error) {
    console.error("Request registration code error:", error);

    return res.status(500).json({
      message: "Не вдалося надіслати код підтвердження.",
    });
  }
});

authRouter.post("/client/register/verify-code", async (req, res) => {
  try {
    const verificationId = String(req.body?.verificationId || "").trim();

    const code = String(req.body?.code || "")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!verificationId || code.length !== 6) {
      return res.status(400).json({
        message: "Введіть 6-значний код.",
      });
    }

    const verification = await prisma.clientRegistrationVerification.findUnique(
      {
        where: {
          id: verificationId,
        },
      },
    );

    if (!verification) {
      return res.status(404).json({
        message: "Запит на реєстрацію не знайдено. Надішліть код повторно.",
      });
    }

    if (verification.expiresAt.getTime() < Date.now()) {
      await prisma.clientRegistrationVerification.delete({
        where: {
          id: verification.id,
        },
      });

      return res.status(410).json({
        message: "Термін дії коду закінчився.",
      });
    }

    if (verification.attempts >= MAX_CODE_ATTEMPTS) {
      await prisma.clientRegistrationVerification.delete({
        where: {
          id: verification.id,
        },
      });

      return res.status(429).json({
        message: "Перевищено кількість спроб. Надішліть новий код.",
      });
    }

    const receivedCodeHash = createCodeHash(verification.id, code);

    const codeIsCorrect = compareCodeHashes(
      verification.codeHash,
      receivedCodeHash,
    );

    if (!codeIsCorrect) {
      const attempts = await prisma.clientRegistrationVerification.update({
        where: {
          id: verification.id,
        },
        data: {
          attempts: {
            increment: 1,
          },
        },
        select: {
          attempts: true,
        },
      });

      const attemptsLeft = Math.max(0, MAX_CODE_ATTEMPTS - attempts.attempts);

      return res.status(400).json({
        message:
          attemptsLeft > 0
            ? `Неправильний код. Залишилось спроб: ${attemptsLeft}.`
            : "Перевищено кількість спроб. Надішліть новий код.",
        attemptsLeft,
      });
    }

    const client = await prisma.$transaction(async (tx) => {
      const existingClient = await tx.clientAccount.findUnique({
        where: {
          email: verification.email,
        },
        select: {
          id: true,
        },
      });

      if (existingClient) {
        throw new Error("CLIENT_ALREADY_EXISTS");
      }

const createdClient = await tx.clientAccount.create({
  data: {
    email: verification.email,
    passwordHash: verification.passwordHash,
  },
  select: {
    id: true,
    email: true,
  },
});

      await tx.clientRegistrationVerification.delete({
        where: {
          id: verification.id,
        },
      });

      return createdClient;
    });

const token = signToken({
  sub: client.id,
  kind: "client",
});

return res.status(201).json({
  message: "Email підтверджено. Акаунт створено.",
  token,
  kind: "client",
  client,
});
  } catch (error) {
    if (error?.message === "CLIENT_ALREADY_EXISTS") {
      return res.status(409).json({
        message: "Акаунт з таким email уже існує.",
      });
    }

    console.error("Verify registration code error:", error);

    return res.status(500).json({
      message: "Не вдалося підтвердити код.",
    });
  }
});

authRouter.post("/client/register/resend-code", async (req, res) => {
  try {
    const verificationId = String(req.body?.verificationId || "").trim();

    const verification = await prisma.clientRegistrationVerification.findUnique(
      {
        where: {
          id: verificationId,
        },
      },
    );

    if (!verification) {
      return res.status(404).json({
        message: "Запит на реєстрацію не знайдено. Заповніть форму повторно.",
      });
    }

    if (verification.resendAfter.getTime() > Date.now()) {
      const retryAfter = Math.ceil(
        (verification.resendAfter.getTime() - Date.now()) / 1000,
      );

      return res.status(429).json({
        message: `Повторне надсилання буде доступне через ${retryAfter} с.`,
        retryAfter,
      });
    }

    const code = createRegistrationCode();

    const codeHash = createCodeHash(verification.id, code);

    const updatedVerification =
      await prisma.clientRegistrationVerification.update({
        where: {
          id: verification.id,
        },
        data: {
          codeHash,
          attempts: 0,
          expiresAt: new Date(Date.now() + REGISTRATION_CODE_TTL_MS),
          resendAfter: new Date(Date.now() + REGISTRATION_RESEND_DELAY_MS),
        },
      });

    await sendClientRegistrationCode({
      email: updatedVerification.email,
      code,
    });

    return res.json({
      message: "Новий код надіслано.",
      resendAfter: 60,
    });
  } catch (error) {
    console.error("Resend registration code error:", error);

    return res.status(500).json({
      message: "Не вдалося повторно надіслати код.",
    });
  }
});


authRouter.post(
  "/client/forgot-password",
  async (req, res) => {
    const genericResponse = {
      message:
        "Якщо акаунт із таким email існує, інструкцію надіслано.",
    };

    try {
      const email = normalizeEmail(req.body?.email);

      if (!email) {
        return res.status(400).json({
          message: "Вкажіть email.",
        });
      }

      const client =
        await prisma.clientAccount.findUnique({
          where: {
            email,
          },
          select: {
            id: true,
            email: true,
          },
        });

      /*
       * Не повідомляємо, чи існує акаунт.
       * Це захищає базу користувачів від перевірки email.
       */
      if (!client) {
        return res.json(genericResponse);
      }

      await prisma.clientPasswordResetToken.deleteMany({
        where: {
          clientId: client.id,
        },
      });

      const rawToken = createPasswordResetToken();

      const tokenHash =
        hashPasswordResetToken(rawToken);

      const expiresAt = new Date(
        Date.now() + PASSWORD_RESET_TTL_MS,
      );

      const resetRecord =
        await prisma.clientPasswordResetToken.create({
          data: {
            clientId: client.id,
            tokenHash,
            expiresAt,
          },
        });

      const frontendUrl = String(
        process.env.FRONTEND_URL ||
          "http://localhost:5173",
      ).replace(/\/+$/, "");

      const resetUrl =
        `${frontendUrl}/reset-password` +
        `?token=${encodeURIComponent(rawToken)}`;

      try {
        await sendClientPasswordResetEmail({
          email: client.email,
          resetUrl,
        });
      } catch (mailError) {
        console.error(
          "Password reset email error:",
          mailError,
        );

        await prisma.clientPasswordResetToken
          .delete({
            where: {
              id: resetRecord.id,
            },
          })
          .catch(() => {});

        /*
         * Зовні повертаємо однакову відповідь,
         * щоб не розкривати наявність акаунта.
         */
      }

      return res.json(genericResponse);
    } catch (error) {
      console.error(
        "Forgot password error:",
        error,
      );

      return res.status(500).json({
        message:
          "Не вдалося обробити запит. Спробуйте ще раз.",
      });
    }
  },
);

authRouter.post(
  "/client/reset-password",
  async (req, res) => {
    try {
      const token = String(
        req.body?.token || "",
      ).trim();

      const password = String(
        req.body?.password || "",
      );

      if (!token) {
        return res.status(400).json({
          message:
            "Посилання для відновлення недійсне.",
        });
      }

      const passwordRegex =
        /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\S]{8,}$/;

      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          message:
            "Пароль має містити мінімум 8 символів, латинську літеру та цифру.",
        });
      }

      if (/\s/.test(password)) {
        return res.status(400).json({
          message:
            "Пароль не може містити пробіли.",
        });
      }

      const tokenHash =
        hashPasswordResetToken(token);

      const resetRecord =
        await prisma.clientPasswordResetToken.findUnique({
          where: {
            tokenHash,
          },
        });

      if (!resetRecord) {
        return res.status(400).json({
          message:
            "Посилання недійсне або вже було використане.",
        });
      }

      if (
        resetRecord.expiresAt.getTime() <
        Date.now()
      ) {
        await prisma.clientPasswordResetToken.delete({
          where: {
            id: resetRecord.id,
          },
        });

        return res.status(410).json({
          message:
            "Термін дії посилання закінчився. Надішліть новий запит.",
        });
      }

      const passwordHash =
        await hashPassword(password);

      await prisma.$transaction(async (tx) => {
        await tx.clientAccount.update({
          where: {
            id: resetRecord.clientId,
          },
          data: {
            passwordHash,
          },
        });

        /*
         * Видаляємо всі посилання відновлення
         * цього користувача.
         */
        await tx.clientPasswordResetToken.deleteMany({
          where: {
            clientId: resetRecord.clientId,
          },
        });
      });

      return res.json({
        message:
          "Пароль успішно змінено.",
      });
    } catch (error) {
      console.error(
        "Reset password error:",
        error,
      );

      return res.status(500).json({
        message:
          "Не вдалося змінити пароль.",
      });
    }
  },
);

// CLIENT login
authRouter.post("/client/login", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");
  const err = validateEmailPassword(email, password);

  if (err) {
    return res.status(400).json({ message: err });
  }

  const client = await prisma.clientAccount.findUnique({
    where: { email },
  });

  if (!client) {
    return res.status(401).json({
      message: "Користувача з такою електронною поштою не знайдено.",
    });
  }

  const ok = await verifyPassword(
    password,
    client.passwordHash,
  );

  if (!ok) {
    return res.status(401).json({
      message: "Неправильний пароль.",
    });
  }

  const token = signToken({
    sub: client.id,
    kind: "client",
  });

  return res.json({
    token,
    kind: "client",
  });
});

// ME
authRouter.get("/me", requireAuth, async (req, res) => {
  const { sub, kind } = req.auth;

  if (kind === "owner") {
    const owner = await prisma.ownerAccount.findUnique({
      where: { id: sub },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        createdAt: true,
      },
    });
    return res.json({ kind, account: owner });
  }

  const client = await prisma.clientAccount.findUnique({
    where: { id: sub },
    select: { id: true, email: true, name: true, phone: true, createdAt: true },
  });
  return res.json({ kind, account: client });
});
