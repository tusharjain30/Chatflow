const RESPONSE_CODES = require("../config/responseCode");

const superAdminOnly = (req, res, next) => {
    try {
        const admin = req.admin;

        if (!admin || !admin.role) {
            return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
                status: 0,
                message: "Unauthorized",
                statusCode: RESPONSE_CODES.UNAUTHORIZED,
                data: {},
            });
        }

        if (admin.role.roleType !== "SYSTEM_ADMIN") {
            return res.status(RESPONSE_CODES.FORBIDDEN).json({
                status: 0,
                message: "Access denied. Super Admin only.",
                statusCode: RESPONSE_CODES.FORBIDDEN,
                data: {},
            });
        }

        next();
    } catch (error) {
        console.log("Super admin authorization error:", error);
        res.status(RESPONSE_CODES.FORBIDDEN).json({
            status: 0,
            message: "Access denied",
            statusCode: RESPONSE_CODES.FORBIDDEN,
            data: {},
        });
    }
};

module.exports = superAdminOnly;
