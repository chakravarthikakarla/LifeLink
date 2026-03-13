const { sendMailWithFallback } = require("../config/emailConfig");

const sendEmail = async (to, subject, html) => {
  const result = await sendMailWithFallback({
      to,
      subject,
      html,
  });

  if (!result.ok) {
    console.error("Email sending error:", {
      to,
      subject,
      message: result.error?.message,
      code: result.error?.code,
      response: result.error?.response,
      via: result.error?.via,
    });
    return result;
  }

  return result;
};

module.exports = sendEmail;
