const nodemailer = require("nodemailer");

const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = Number(process.env.SMTP_PORT || 465);
const smtpSecure = process.env.SMTP_SECURE
  ? process.env.SMTP_SECURE === "true"
  : smtpPort === 465;

const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_APP_PASSWORD;

const isEmailConfigured = Boolean(smtpUser && smtpPass);

if (!isEmailConfigured) {
  console.warn("Email service disabled: set SMTP_USER/SMTP_PASS (or EMAIL_USER/EMAIL_APP_PASSWORD).");
}

const transporter = isEmailConfigured
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    })
  : null;

if (transporter && process.env.NODE_ENV !== "test") {
  transporter
    .verify()
    .then(() => {
      console.log(`SMTP ready (${smtpHost}:${smtpPort}, secure=${smtpSecure})`);
    })
    .catch((error) => {
      console.error("SMTP verify failed:", {
        message: error.message,
        code: error.code,
        response: error.response,
      });
    });
}

module.exports = transporter;
