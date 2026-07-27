const RESPONSE_CODES = require("../../../../config/responseCode");
const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();
const express = require("express");
const router = express.Router();

router.post("/", async (req, res) => {
    try {

        const { userId } = req.auth;
        const { otp } = req.body;

        if (!otp) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json(
                {
                    status: 0,
                    message: "OTP required",
                    statusCode: RESPONSE_CODES.BAD_REQUEST,
                    data: {}
                }
            );
        }

        const record = await prisma.wabaVerification.findUnique({
            where: { userId }
        });

        if (!record) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: "Verification request not found",
                statusCode: RESPONSE_CODES.BAD_REQUEST,
                data: {}
            })
        }

        if (
            record.otp !== otp ||
            !record.otpExpires ||
            record.otpExpires < new Date()
        ) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: "Invalid or expired OTP",
                statusCode: RESPONSE_CODES.BAD_REQUEST,
                data: {}
            });
        }

        await prisma.wabaVerification.update({
            where: { userId },
            data: {
                status: "VERIFIED",
                otp: null,
                otpExpires: null,
                wabaPhoneId: process.env.PHONE_NUMBER_ID,
                wabaWabaId: process.env.META_WABA_ID
            }
        });

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Whatsapp number verified successfully",
            statusCode: RESPONSE_CODES.GET,
            data: {}
        });

    } catch (error) {
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        })
    }
});

module.exports = router;