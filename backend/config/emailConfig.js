const nodemailer = require("nodemailer");

const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = Number(process.env.SMTP_PORT || 465);
const smtpSecure = process.env.SMTP_SECURE
  ? process.env.SMTP_SECURE === "true"
  : smtpPort === 465;

const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_APP_PASSWORD;
const fromAddress = process.env.EMAIL_FROM || smtpUser;
const fromName = process.env.EMAIL_FROM_NAME || "LifeLink";

const isEmailConfigured = Boolean(smtpUser && smtpPass);

if (!isEmailConfigured) {
  console.warn("Email service disabled: set SMTP_USER/SMTP_PASS (or EMAIL_USER/EMAIL_APP_PASSWORD).");
}

const buildTransport = (host, port, secure) => nodemailer.createTransport({
  host,
  port,
  secure,
  requireTLS: !secure,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 30000,
  tls: {
    servername: host,
  },
});

const getTransportCandidates = () => {
  if (!isEmailConfigured) return [];

  const candidates = [
    { host: smtpHost, port: smtpPort, secure: smtpSecure, label: `primary:${smtpHost}:${smtpPort}:${smtpSecure}` },
  ];

  if (smtpHost === "smtp.gmail.com") {
    const alternates = [
      { host: "smtp.gmail.com", port: 587, secure: false, label: "gmail-starttls" },
      { host: "smtp.gmail.com", port: 465, secure: true, label: "gmail-ssl" },
    ];

    for (const alt of alternates) {
      const exists = candidates.some(
        (candidate) => candidate.host === alt.host && candidate.port === alt.port && candidate.secure === alt.secure
      );
      if (!exists) candidates.push(alt);
    }
  }

  return candidates;
};

const verifyPrimaryTransport = async () => {
  if (!isEmailConfigured || process.env.NODE_ENV === "test") return;
  const [primary] = getTransportCandidates();
  if (!primary) return;

  try {
    const transporter = buildTransport(primary.host, primary.port, primary.secure);
    await transporter.verify();
    console.log(`SMTP ready (${primary.host}:${primary.port}, secure=${primary.secure})`);
  } catch (error) {
    console.error("SMTP verify failed:", {
      host: primary.host,
      port: primary.port,
      secure: primary.secure,
      message: error.message,
      code: error.code,
      response: error.response,
    });
  }
};

verifyPrimaryTransport();

const sendMailWithFallback = async (mailOptions) => {
  if (!isEmailConfigured || !fromAddress) {
    return {
      ok: false,
      error: {
        code: "EMAIL_NOT_CONFIGURED",
        message: "SMTP credentials are missing",
      },
    };
  }

  const candidates = getTransportCandidates();
  let lastError = null;

  for (const candidate of candidates) {
    try {
      const transporter = buildTransport(candidate.host, candidate.port, candidate.secure);
      const info = await transporter.sendMail({
        ...mailOptions,
        from: `"${fromName}" <${fromAddress}>`,
      });

      console.log("Email sent:", {
        messageId: info.messageId,
        via: candidate.label,
      });

      return {
        ok: true,
        info,
        via: candidate.label,
      };
    } catch (error) {
      lastError = {
        code: error.code || "SMTP_SEND_FAILED",
        message: error.message,
        response: error.response,
        via: candidate.label,
      };

      console.error("SMTP send failed:", {
        via: candidate.label,
        code: lastError.code,
        message: lastError.message,
        response: lastError.response,
      });
    }
  }

  return {
    ok: false,
    error: lastError || {
      code: "SMTP_SEND_FAILED",
      message: "Unable to send email",
    },
  };
};

module.exports = {
  sendMailWithFallback,
  fromAddress,
  fromName,
};
