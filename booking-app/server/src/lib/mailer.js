// mailer.js
import nodemailer from "nodemailer";

const smtpPort = Number(process.env.SMTP_PORT || 587);

export const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function verifyMailerConnection() {
  await mailer.verify();
  console.log("SMTP connection is ready");
}

export async function sendClientRegistrationCode({ email, code }) {
  const info = await mailer.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: "Код підтвердження реєстрації — Aveliio",

    text: [
      "Підтвердження реєстрації в Aveliio",
      "",
      `Ваш код: ${code}`,
      "",
      "Код дійсний протягом 10 хвилин.",
      "Якщо ви не створювали акаунт, просто проігноруйте цей лист.",
    ].join("\n"),

    html: `
      <div style="
        max-width:520px;
        margin:0 auto;
        padding:32px;
        background:#ffffff;
        border:1px solid #eadfce;
        border-radius:24px;
        font-family:Arial,sans-serif;
        color:#202020;
      ">
        <div style="text-align:center;">
          <div style="
            display:inline-block;
            margin-bottom:20px;
            font-size:30px;
            font-weight:900;
            letter-spacing:-1px;
          ">
            Avel<span style="color:#ff6200;">ii</span>o
          </div>

          <h1 style="
            margin:0;
            font-size:24px;
            line-height:1.2;
          ">
            Підтвердження реєстрації
          </h1>

          <p style="
            margin:14px 0 0;
            color:#77716b;
            font-size:15px;
            line-height:1.6;
          ">
            Введіть цей код у вікні реєстрації:
          </p>

          <div style="
            margin:24px 0;
            padding:18px;
            background:#fff5ee;
            border:1px solid rgba(255,98,0,0.25);
            border-radius:18px;
            color:#ff6200;
            font-size:36px;
            font-weight:900;
            letter-spacing:10px;
          ">
            ${code}
          </div>

          <p style="
            margin:0;
            color:#77716b;
            font-size:13px;
            line-height:1.6;
          ">
            Код дійсний протягом 10 хвилин.
          </p>

          <p style="
            margin:16px 0 0;
            color:#aaa19a;
            font-size:12px;
            line-height:1.6;
          ">
            Якщо ви не створювали акаунт в Aveliio,
            просто проігноруйте цей лист.
          </p>
        </div>
      </div>
    `,
  });
    console.log("Registration email sent:", {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response,
    recipient: email,
  });

  return info;
}

export async function sendClientPasswordResetEmail({
  email,
  resetUrl,
}) {
  const info = await mailer.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: "Відновлення пароля — Aveliio",

    text: [
      "Відновлення пароля в Aveliio",
      "",
      "Для створення нового пароля відкрийте посилання:",
      resetUrl,
      "",
      "Посилання дійсне протягом 30 хвилин.",
      "",
      "Якщо ви не надсилали запит на відновлення пароля, проігноруйте цей лист.",
    ].join("\n"),

    html: `
      <div style="
        max-width:520px;
        margin:0 auto;
        padding:32px;
        background:#ffffff;
        border:1px solid #eadfce;
        border-radius:24px;
        font-family:Arial,sans-serif;
        color:#202020;
      ">
        <div style="text-align:center;">
          <div style="
            margin-bottom:20px;
            font-size:30px;
            font-weight:900;
            letter-spacing:-1px;
          ">
            Avel<span style="color:#ff6200;">ii</span>o
          </div>

          <h1 style="
            margin:0;
            font-size:24px;
            line-height:1.25;
          ">
            Відновлення пароля
          </h1>

          <p style="
            margin:16px 0 0;
            color:#77716b;
            font-size:15px;
            line-height:1.6;
          ">
            Ми отримали запит на зміну пароля вашого акаунта.
          </p>

          <a
            href="${resetUrl}"
            style="
              display:inline-block;
              margin:26px 0;
              padding:15px 28px;
              border-radius:15px;
              background:#202020;
              color:#ffffff;
              text-decoration:none;
              font-size:15px;
              font-weight:800;
            "
          >
            Створити новий пароль
          </a>

          <p style="
            margin:0;
            color:#77716b;
            font-size:13px;
            line-height:1.6;
          ">
            Посилання дійсне протягом 30 хвилин.
          </p>

          <p style="
            margin:18px 0 0;
            color:#aaa19a;
            font-size:12px;
            line-height:1.6;
          ">
            Якщо ви не надсилали цей запит,
            просто проігноруйте лист.
          </p>
        </div>
      </div>
    `,
  });

  console.log("Password reset email sent:", {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response,
    recipient: email,
  });

  return info;
}