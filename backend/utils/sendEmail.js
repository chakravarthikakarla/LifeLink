import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (to, subject, html) => {
  try {
    const response = await resend.emails.send({
      from: "LifeLink <onboarding@resend.dev>",
      to: to,
      subject: subject,
      html: html,
    });

    console.log("Email sent:", response);
  } catch (error) {
    console.error("Email error:", error);
  }
};