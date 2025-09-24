import { google } from "googleapis";

const sendEmail = async (options) => {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
  );

  oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  const rawMessage =
    `From: "AIG Event" <${process.env.EMAIL_USER}>\r\n` +
    `To: ${options.email}\r\n` +
    `Subject: ${options.subject}\r\n\r\n` +
    `${options.message}`;

  const encodedMessage = Buffer.from(rawMessage).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encodedMessage },
  });

};

export default sendEmail;
