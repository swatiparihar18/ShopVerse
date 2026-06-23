const nodemailer = require("nodemailer");

console.log("sendEmail.js loaded");
const createTransporter = () => {
  const {
    EMAIL_HOST,
    EMAIL_PORT,
    EMAIL_USER,
    EMAIL_PASS,
    EMAIL_SECURE
  } = process.env;

  const emailHost = (EMAIL_HOST || "").trim();

  if (!emailHost || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS) {
    console.log("❌ Email configuration missing");
    return nodemailer.createTransport({ jsonTransport: true });
  }

  const isGmail = ["gmail", "google", "smtp.gmail.com"].includes(
    emailHost.toLowerCase()
  );

  const password = isGmail
    ? EMAIL_PASS.replace(/\s/g, "")
    : EMAIL_PASS;

  if (isGmail && ["gmail", "google"].includes(emailHost.toLowerCase())) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL_USER,
        pass: password
      }
    });
  }

  return nodemailer.createTransport({
    host: emailHost,
    port: Number(EMAIL_PORT),
    secure: EMAIL_SECURE === "true",
    auth: {
      user: EMAIL_USER,
      pass: password
    }
  });
};

const sendEmail = async ({ to, subject, text, html }) => {
    console.log("sendEmail function called");

  try {
    const transporter = createTransporter();

    // SMTP Connection Test
    await transporter.verify();
    console.log("✅ SMTP Connected Successfully");

    const info = await transporter.sendMail({
      from:
        process.env.EMAIL_FROM ||
        `"Creation Corner" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    });

    console.log("✅ Email Sent Successfully");
    console.log("Message ID:", info.messageId);

    if (info.response) {
      console.log("SMTP Response:", info.response);
    }

    return info;
  } catch (error) {
    console.error("❌ Email Sending Failed");
    console.error(error);

    throw error;
  }
};

module.exports = sendEmail;