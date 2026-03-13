const transporter = require("../config/emailConfig");

const sendEmail = async (to, subject, html) => {
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const fromAddress = process.env.EMAIL_FROM || smtpUser;
  const fromName = process.env.EMAIL_FROM_NAME || "LifeLink";

  if (!transporter || !fromAddress) {
    console.log("Skipping email (SMTP not configured):", { to, subject });
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to,
      subject,
      html,
    });
    console.log("Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Email sending error:", {
      to,
      subject,
      message: error.message,
      code: error.code,
      response: error.response,
    });
    return false;
  }
};

module.exports = sendEmail;
