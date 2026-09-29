const AISENSY_API_URL = "https://backend.aisensy.com/campaign/t1/api/v2";

export const sendAIGRegistrationWhatsApp = async ({
  phone,
  delegateName,
  eventName,
  registrationNumber,
  eventDate,
  venue,
  otherInformation,
  teamName,
  registrationUrl,
}) => {
  const apiKey = process.env.AISENSY_API_KEY;
  const campaignName = process.env.AISENSY_CAMPAIGN_NAME;

  if (!apiKey || !campaignName) {
    throw new Error("AiSensy configuration is missing");
  }

  if (!phone) {
    throw new Error("Delegate mobile number is missing");
  }

  if (!registrationUrl) {
    throw new Error("Registration pass URL is missing");
  }

  // Normalize phone number for India.
  // Stored mobile is expected to be a 10-digit Indian number.
  const digits = String(phone).replace(/\D/g, "");

  if (!/^\d{10}$/.test(digits)) {
    throw new Error("Invalid Indian mobile number");
  }

  const destination = `91${digits}`;

  const payload = {
    apiKey,
    campaignName,
    destination,
    userName: delegateName,

    templateParams: [
      String(delegateName || ""),
      String(eventName || ""),
      String(registrationNumber || ""),
      String(eventDate || ""),
      String(venue || ""),
      String(otherInformation || ""),
      String(teamName || ""),
      String(registrationUrl || ""),
    ],
  };

  const response = await fetch(AISENSY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `AiSensy request failed (${response.status}): ${responseText}`,
    );
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return { response: responseText };
  }
};
