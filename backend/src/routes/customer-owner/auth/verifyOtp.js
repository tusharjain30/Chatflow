const RESPONSE_CODES = require("../../../config/responseCode");

const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const jwt = require("jsonwebtoken");

router.post("/", async (req, res) => {
    try {
        const { email, otp, rememberMe } = req.body;

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: "Invalid Email",
                statusCode: RESPONSE_CODES.BAD_REQUEST,
                data: {}
            })
        };

        // Expired OTP
        if (!user.otp || !user.otpExpires || user.otpExpires < new Date()) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: "OTP expired. Please login again",
                statusCode: RESPONSE_CODES.BAD_REQUEST,
                data: {}
            })
        }

        // OTP mismatch
        if (user.otp !== otp) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: "Invalid OTP",
                statusCode: RESPONSE_CODES.BAD_REQUEST,
                data: {}
            })
        }

        // Mark verified
        await prisma.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                otp: null,
                otpExpires: null
            }
        });

        // Generate JWT with Remember Me
        const expiresIn = rememberMe ? process.env.USER_JWT_EXPIRATION : "1h";

        const token = jwt.sign(
            {
                userId: user.id,
                roleType: user.role?.roleType || "CUSTOMER_USER",
                tokenVersion: user.tokenVersion,
            },
            process.env.USER_JWT_SECRET,
            { expiresIn }
        );

        const { password: _, otp: __, otpExpires: ___, ...safeUser } = user;

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "OTP verified successfully",
            statusCode: RESPONSE_CODES.GET,
            data: {
                user: safeUser,
                token,
                expiresIn
            }
        });

    } catch (error) {
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal Server Error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        })
    };
});

module.exports = router;