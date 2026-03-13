const { Resend } = require("resend");

let resend = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
} else {
  console.warn(
    "RESEND_API_KEY is not set. Email sending is disabled (this is expected in local dev unless you configure resend)."
  );
}

const sendEmail = async (to, subject, html) => {
  if (!resend) {
    // No email provider configured; log and skip sending.
    console.log("Skipping email send (no RESEND_API_KEY):", { to, subject });
    return;
  }

  try {
    const response = await resend.emails.send({
      from: "LifeLink <onboarding@resend.dev>",
      to,
      subject,
      html,
    });

    console.log("Email sent successfully:", response);
  } catch (error) {
    console.error("Email sending error:", error);
  }
};

module.exports = sendEmail;