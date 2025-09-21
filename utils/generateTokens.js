// import jwt from "jsonwebtoken";

// export const generateTokens = (userId, role) => {
//   const accessToken = jwt.sign(
//     { id: userId, role },
//     process.env.JWT_SECRET,
//     { expiresIn: process.env.JWT_EXPIRES || "15m" }
//   );

//   const refreshToken = jwt.sign(
//     { id: userId },
//     process.env.JWT_REFRESH_SECRET,
//     { expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d" }
//   );

//   return { accessToken, refreshToken };
// };


//new 

import jwt from "jsonwebtoken";

/**
 * Generate Access & Refresh Tokens
 * - Access Token → short-lived (used in frontend headers)
 * - Refresh Token → long-lived (stored in httpOnly cookie)
 */
export const generateTokens = (userId, role) => {
  // Access Token (frontend consumes directly)
  const accessToken = jwt.sign(
    { id: userId, role }, // payload
    process.env.JWT_SECRET, // secret for access
    { expiresIn: process.env.JWT_EXPIRES || "15m" } // short expiry
  );

  // Refresh Token (stored in httpOnly cookie only)
  const refreshToken = jwt.sign(
    { id: userId, role }, // keep role for extra validation if needed
    process.env.JWT_REFRESH_SECRET, // separate secret
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d" } // long expiry
  );

  return { accessToken, refreshToken };
};
