const express = require("express");
const router = express.Router();

const RESPONSE_CODES = require("../../../config/responseCode");

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

router.put("/", async (req, res) => {
    try {
        // Only USER allowed
        if (req.auth.userType !== "USER") {
            return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
                status: 0,
                message: "Only user can update profile",
                statusCode: RESPONSE_CODES.UNAUTHORIZED,
                data: {},
            });
        }

        const userId = req.auth.userId;
        const { firstName, lastName, email, phone } = req.body;

        // Check existing user
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(RESPONSE_CODES.NOT_FOUND).json({
                status: 0,
                message: "User not found",
                statusCode: RESPONSE_CODES.NOT_FOUND,
                data: {},
            });
        }

        // Check email / phone uniqueness
        const conflict = await prisma.user.findFirst({
            where: {
                id: { not: userId },
                OR: [
                    { email },
                    { phone }
                ],
            },
        });

        if (conflict) {
            return res.status(RESPONSE_CODES.ALREADY_EXIST).json({
                status: 0,
                message: "Email / Phone already in use",
                statusCode: RESPONSE_CODES.ALREADY_EXIST,
                data: {},
            });
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                firstName,
                lastName,
                email,
                phone
            },
        });

        const { password, tokenVersion, otp, otpExpires, ...safeUser } = updatedUser;

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Profile updated successfully",
            statusCode: RESPONSE_CODES.GET,
            data: safeUser,
        });

    } catch (error) {
        console.error("UPDATE PROFILE ERROR:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {},
        });
    }
});

module.exports = router;
