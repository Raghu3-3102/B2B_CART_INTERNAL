// import dotenv from "dotenv";
// dotenv.config();

import sgMail from "@sendgrid/mail";
import { SendOtpMailContent } from "../utils/MailContent.js";

sgMail.setApiKey(process.env.EMAIL_API_KEY); // Set SendGrid API key
console.log("api_key",process.env.EMAIL_API_KEY)

export const sendOtpMail = async (otp, email,role="Admin") => {
  console.log("api_key",process.env.EMAIL_API_KEY)
  try {
    const mailContent = SendOtpMailContent(otp,role);

    const msg = {
      to: email,
      from: {
        name: "EQES Support",
        email: process.env.EMAIL_FROM, // must be verified in SendGrid
      },
      subject: "Your EQES Password Reset — One-Time PIN (OTP)",
      html: mailContent,
    };

    const response = await sgMail.send(msg);
    console.log("✅ OTP email successfully sent to:", email);
    return true;

  } catch (error) {
    console.error("🚨 Error sending OTP email:", error.response?.body || error.message);
    return false;
  }
};
