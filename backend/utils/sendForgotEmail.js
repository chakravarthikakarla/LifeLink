const transporter = require("../config/emailConfig");

const sendForgotEmail = async (to, otp) => {
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const fromAddress = process.env.EMAIL_FROM || smtpUser;
  const fromName = process.env.EMAIL_FROM_NAME || "LifeLink";

  if (!transporter || !fromAddress) {
    console.log("Skipping forgot password email (Gmail not configured).");
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to,
      subject: "LifeLink - Password Reset OTP",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:20px;border:1px solid #eee;border-radius:8px;">
          <h2 style="color:#d9534f;">Password Reset OTP</h2>
          <p>Your OTP for password reset is:</p>
          <h1 style="letter-spacing:8px;color:#d9534f;text-align:center;">${otp}</h1>
          <p style="color:#888;">Valid for <strong>10 minutes</strong>. Do not share with anyone.</p>
          <p>Best regards,<br/><strong>The LifeLink Team</strong></p>
        </div>
      `,
    });
    console.log("Forgot password email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Forgot password email error:", {
      to,
      message: error.message,
      code: error.code,
      response: error.response,
    });
    return false;
  }
};

module.exports = sendForgotEmail;
