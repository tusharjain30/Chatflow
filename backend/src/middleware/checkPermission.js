const RESPONSE_CODES = require("../config/responseCode");

const checkPermission = (requiredPermission) => {
    return (req, res, next) => {
        try {

            const admin = req.admin;

            if (!admin || !admin.role) {
                return res.status(RESPONSE_CODES.FORBIDDEN).json({
                    status: 0,
                    message: "Access denied",
                    statusCode: RESPONSE_CODES.FORBIDDEN,
                    data: {}
                })
            }

            // Super Admin Full Access
            if (admin.role.roleType === "SYSTEM_ADMIN") {
                return next();
            }

            const permissions = admin.role.permissions.map((rp) => rp.permission.name);
            if (!permissions.includes(requiredPermission)) {
                return res.status(RESPONSE_CODES.FORBIDDEN).json({
                    status: 0,
                    message: "You do not have permission to perform this action",
                    statusCode: RESPONSE_CODES.FORBIDDEN,
                    data: {}
                })
            };

            next();

        } catch (error) {
            console.log("Permission Middleware Error:", error);
            res.status(RESPONSE_CODES.ERROR).json({
                status: 0,
                message: "Internal server error",
                statusCode: RESPONSE_CODES.ERROR,
                data: {}
            })
        }
    }
};

module.exports = checkPermission;