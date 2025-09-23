import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail", // or any SMTP provider
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  console.log("Email transporter created", transporter);
  const mailOptions = {
    from: `"AIG Event" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.message
  };
  console.log("Sending email to:", options.email);
  console.log("Email subject:", options.subject);
  console.log("Email message:", options.message);
  await transporter.sendMail(mailOptions);
};

export default sendEmail;
