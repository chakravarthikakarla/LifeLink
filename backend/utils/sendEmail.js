const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, html) => {
  try {
    await resend.emails.send({
      from: "LifeLink <onboarding@resend.dev>",
      to: to,
      subject: subject,
      html: html
    });

    console.log("Email sent successfully");
  } catch (error) {
    console.error("Email sending error:", error);
  }
};

module.exports = sendEmail;