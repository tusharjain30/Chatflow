const express = require("express");
const router = express.Router();

const RESPONSE_CODES = require("../../../config/responseCode");

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
    try {
        // ==============================
        // CUSTOMER USER
        // ==============================
        if (req.auth.userType === "USER") {
            const user = await prisma.user.findUnique({
                where: { id: req.auth.userId },
                include: {
                    role: true,
                    account: {
                        include: {
                            subscriptions: {
                                where: { isActive: true },
                                include: { plan: true },
                            },
                        },
                    },
                },
            });

            if (!user) {
                return res.status(RESPONSE_CODES.NOT_FOUND).json({
                    status: 0,
                    message: "User not found",
                    statusCode: RESPONSE_CODES.NOT_FOUND,
                    data: {},
                });
            }

            const { password, tokenVersion, otp, otpExpires, ...safeUser } = user;

            return res.status(RESPONSE_CODES.GET).json({
                status: 1,
                message: "User profile fetched successfully",
                statusCode: RESPONSE_CODES.GET,
                data: {
                    userType: "USER",
                    ...safeUser,
                },
            });
        } else {
            // ==============================
            // ADMIN USER
            // ==============================
            if (req.auth.userType === "ADMIN") {
                const admin = await prisma.admin.findUnique({
                    where: { id: req.auth.adminId },
                    include: {
                        role: true,
                    },
                });

                if (!admin) {
                    return res.status(RESPONSE_CODES.NOT_FOUND).json({
                        status: 0,
                        message: "Admin not found",
                        statusCode: RESPONSE_CODES.NOT_FOUND,
                        data: {},
                    });
                }

                const { password, tokenVersion, ...safeAdmin } = admin;

                return res.status(RESPONSE_CODES.GET).json({
                    status: 1,
                    message: "Admin profile fetched successfully",
                    statusCode: RESPONSE_CODES.GET,
                    data: {
                        userType: "ADMIN",
                        ...safeAdmin,
                    },
                });
            }

            return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
                status: 0,
                message: "Invalid session",
                statusCode: RESPONSE_CODES.UNAUTHORIZED,
                data: {},
            });
        }

    } catch (error) {
        console.error("GET /user/me ERROR:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {},
        });
    }
});

module.exports = router;
