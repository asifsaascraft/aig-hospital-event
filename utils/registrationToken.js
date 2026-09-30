import crypto from "crypto";

/**
 * Generates a cryptographically secure public token
 * for an event registration.
 */
export const generateRegistrationPublicToken = () => {
  return crypto.randomBytes(8).toString("hex");
};

/**
 * Builds the public registration pass URL.
 */
export const getRegistrationPublicUrl = (publicToken) => {
  if (!publicToken) {
    throw new Error("Registration public token is required");
  }

  const baseUrl =
    process.env.MY_REGISTRATION_BASE_URL || "http://localhost:3000";

  return `${baseUrl.replace(/\/+$/, "")}/regnum/${publicToken}`;
};

/**
 * Returns the existing public token.
 *
 * If the registration is from before the public-pass feature
 * and does not have a token yet, generate and persist one.
 *
 * The same token is reused on every future WhatsApp send.
 */
export const ensureRegistrationPublicToken = async (registration) => {
  if (registration.publicToken) {
    return registration.publicToken;
  }

  const publicToken = generateRegistrationPublicToken();

  registration.publicToken = publicToken;

  await registration.save();

  return publicToken;
};
