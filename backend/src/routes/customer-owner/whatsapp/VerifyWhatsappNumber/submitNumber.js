const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();
const express = require("express");
const router = express.Router();

const RESPONSE_CODES = require("../../../../config/responseCode");

const sendWhatsAppMessage = require("../../../../services/Meta/sendMessage");
const { buildTextPayload } = require("../../../../services/Meta/payloadBuilders");

router.post("/", async (req, res) => {
    try {

        const {userId} = req.auth;
        const { phone } = req.body;

        const isAlreadyVerified = await prisma.wabaVerification.findFirst({
            where: {
                userId,
                clientPhone: phone,
                status: "VERIFIED"
            }
        });

        if (isAlreadyVerified) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: "Whatsapp number is already verified",
                statusCode: RESPONSE_CODES.BAD_REQUEST,
                data: {}
            });
        };

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save / Update verification record
        await prisma.wabaVerification.upsert({
            where: { userId },
            update: {
                clientPhone: phone,
                otp,
                otpExpires: new Date(Date.now() + 5 * 60 * 1000),
                status: "PENDING"
            },
            create: {
                userId,
                clientPhone: phone,
                otp,
                otpExpires: new Date(Date.now() + 5 * 60 * 1000),
                status: "PENDING"
            }
        });

        // Send OTP using your WABA number
        await sendWhatsAppMessage({
            to: `91${phone}`,
            payload: buildTextPayload(`Your WhatsApp verification OTP is ${otp}`)
        });

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "OTP sent successfully",
            statusCode: RESPONSE_CODES.GET,
            data: {}
        });

    } catch (error) {
        console.log(error)
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        })
    }
});

module.exports = router;