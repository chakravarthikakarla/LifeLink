const nodemailer = require("nodemailer");

if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
  console.error("CRITICAL: EMAIL_USER or EMAIL_APP_PASSWORD environment variables are missing!");
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use STARTTLS
  family: 4,   // Forces IPv4
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP Connection Error:", error);
  } else {
    console.log("SMTP server is ready to take our messages");
  }
});

module.exports = transporter;
