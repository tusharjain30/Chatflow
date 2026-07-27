const RESPONSE_CODES = require("../config/responseCode");

const ROLES = {
  CUSTOMER_OWNER: "CUSTOMER_OWNER",
};

const requireOwner = (req, res, next) => {
  try {
    const auth = req.auth;

    // =========================
    // Auth Check
    // =========================
    if (!auth) {
      return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
        status: 0,
        message: "Unauthorized",
        statusCode: RESPONSE_CODES.UNAUTHORIZED,
        data: {},
      });
    }

    const roleType = auth?.role?.roleType;

    // =========================
    // Role Check
    // =========================
    if (roleType !== ROLES.CUSTOMER_OWNER) {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        status: 0,
        message: "Only account owner can perform this action",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    next();
  } catch (error) {
    console.log("requireOwner error:", error);

    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Authorization error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
};

module.exports = requireOwner;
