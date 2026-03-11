require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const nodemailer = require("nodemailer");

async function testEmail() {
  console.log("EMAIL_USER:", process.env.EMAIL_USER);
  console.log("EMAIL_APP_PASSWORD:", process.env.EMAIL_APP_PASSWORD ? "SET (" + process.env.EMAIL_APP_PASSWORD.length + " chars)" : "NOT SET");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  try {
    await transporter.verify();
    console.log("✅ SMTP connection verified! Credentials are working.");
  } catch (err) {
    console.error("❌ SMTP verify failed:", err.message);
    console.error("Full error:", err);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // send to self as test
      subject: "LifeLink Email Test",
      text: "If you see this, email sending is working!",
    });
    console.log("✅ Test email sent! Message ID:", info.messageId);
  } catch (err) {
    console.error("❌ Send mail failed:", err.message);
    console.error("Full error:", err);
  }
}

testEmail();
