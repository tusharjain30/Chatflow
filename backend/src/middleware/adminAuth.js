const jwt = require("jsonwebtoken");

const { PrismaClient } = require("../generated/prisma/client");
const prisma = new PrismaClient();

const RESPONSE_CODES = require("../config/responseCode");

const adminAuth = async (req, res, next) => {
    try {

        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
                status: 0,
                message: "No token provided",
                statusCode: RESPONSE_CODES.UNAUTHORIZED,
                data: {}
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
                status: 0,
                message: err.name === "TokenExpiredError"
                    ? "Session expired. Please login again."
                    : "Invalid token",
                statusCode: RESPONSE_CODES.UNAUTHORIZED,
                data: {},
            });
        }


        // Find admin
        const admin = await prisma.admin.findUnique({
            where: { id: decoded.adminId },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: {
                                permission: true
                            }
                        }
                    }
                }
            }
        });

        if (!admin) {
            return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
                status: 0,
                message: "Admin not found",
                statusCode: RESPONSE_CODES.UNAUTHORIZED,
                data: {}
            })
        }

        if (admin.isDeleted || !admin.isActive) {
            return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
                status: 0,
                message: "Account inactive/deleted",
                statusCode: RESPONSE_CODES.UNAUTHORIZED,
                data: {}
            });
        }

        // Compare tokenVersion
        if (decoded.tokenVersion !== admin.tokenVersion) {
            return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
                status: 0,
                message: "Session expired. Please login again.",
                statusCode: RESPONSE_CODES.UNAUTHORIZED,
                data: {}
            });
        }

        req.admin = admin; // store admin in request
        next();

    } catch (error) {
        return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
            status: 0,
            message: "Invalid or expired token",
            statusCode: RESPONSE_CODES.UNAUTHORIZED,
            data: {}
        });
    }
};

module.exports = adminAuth;