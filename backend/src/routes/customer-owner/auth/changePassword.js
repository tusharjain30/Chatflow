const RESPONSE_CODES = require("../../../config/responseCode");

const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const bcrypt = require("bcrypt");

router.post("/", async (req, res) => {
    try {
        const { userId } = req.auth;
        const { currentPassword, newPassword } = req.body;

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

        // Check current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: "Current password is incorrect",
                statusCode: RESPONSE_CODES.BAD_REQUEST,
                data: {},
            });
        }

        // Prevent same password
        const isSame = await bcrypt.compare(newPassword, user.password);
        if (isSame) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: "New password must be different from old password",
                statusCode: RESPONSE_CODES.BAD_REQUEST,
                data: {},
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                tokenVersion: require("crypto").randomUUID(), // logout all sessions
            },
        });

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Password changed successfully. Please login again.",
            statusCode: RESPONSE_CODES.GET,
            data: {},
        });

    } catch (err) {
        console.error("Change password error:", err);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {},
        });
    }
});

module.exports = router;