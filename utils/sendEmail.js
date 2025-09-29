// utils/sendEmail.js
import { SendMailClient } from "zeptomail";
import dotenv from "dotenv";

dotenv.config();

const client = new SendMailClient({
  url: process.env.ZEPTO_URL,
  token: process.env.ZEPTO_TOKEN,
});


/**
 * Send email via ZeptoMail template
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.name - Recipient name
 * @param {string} params.templateKey - ZeptoMail template key
 * @param {Object} params.mergeInfo - Merge variables for template
 */
const sendEmailWithTemplate = async ({ to, name, templateKey, mergeInfo }) => {
  try {
    const resp = await client.sendMailWithTemplate({
      mail_template_key: templateKey,
      from: {
        address: process.env.ZEPTO_FROM,
        name: "AIGAcademics",
      },
      to: [
        {
          email_address: {
            address: to,
            name,
          },
        },
      ],
      merge_info: mergeInfo,
    });
    return resp;
  } catch (error) {
    console.error("sendEmailWithTemplate error:", error);
    throw error;
  }
};

export default sendEmailWithTemplate;