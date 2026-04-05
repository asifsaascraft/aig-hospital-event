// middlewares/authorizeUniversal.js

export const authorizeUniversal = ({ allowUserRoles = [], allowSponsor = false }) => {
  return (req, res, next) => {

    // ================= USER =================
    if (req.authType === "user") {
      if (!allowUserRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "User not allowed",
        });
      }
      return next();
    }

    // ================= SPONSOR =================
    if (req.authType === "sponsor") {
      if (!allowSponsor) {
        return res.status(403).json({
          success: false,
          message: "Sponsor not allowed",
        });
      }
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Unauthorized",
    });
  };
};