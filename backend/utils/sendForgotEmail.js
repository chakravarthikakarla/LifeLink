const sendEmail = require("./sendEmail");

const sendForgotEmail = async (to, otp) => {
  return await sendEmail(
    to,
    "LifeLink - Password Reset OTP",
    `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:20px;border:1px solid #eee;border-radius:8px;">
        <h2 style="color:#d9534f;">Password Reset OTP</h2>
        <p>Your OTP for password reset is:</p>
        <h1 style="letter-spacing:8px;color:#d9534f;text-align:center;">${otp}</h1>
        <p style="color:#888;">Valid for <strong>10 minutes</strong>. Do not share with anyone.</p>
        <p>Best regards,<br/><strong>The LifeLink Team</strong></p>
      </div>
    `
  );
};

module.exports = sendForgotEmail;
