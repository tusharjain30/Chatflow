const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();
const express = require("express");
const router = express.Router();

const RESPONSE_CODES = require("../../../../config/responseCode");
const logger = require("../../../../utils/logger");
const sendWhatsAppMessage = require("../../../../services/Meta/sendMessage");
const {
  buildTextPayload,
} = require("../../../../services/Meta/payloadBuilders");

function normalizePhone(phone = "") {
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }
  return digits;
}

router.post("/", async (req, res) => {
  try {
    const { userId } = req.auth;
    const phone = normalizePhone(req.body.phone);

    if (!/^\d{10}$/.test(phone)) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Phone number must be a valid 10-digit mobile number",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    const isAlreadyVerified = await prisma.wabaVerification.findFirst({
      where: {
        userId,
        clientPhone: phone,
        status: "VERIFIED",
      },
    });

    if (isAlreadyVerified) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "WhatsApp number is already verified",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.wabaVerification.upsert({
      where: { userId },
      update: {
        clientPhone: phone,
        otp,
        otpExpires: new Date(Date.now() + 5 * 60 * 1000),
        status: "PENDING",
      },
      create: {
        userId,
        clientPhone: phone,
        otp,
        otpExpires: new Date(Date.now() + 5 * 60 * 1000),
        status: "PENDING",
      },
    });

    try {
      await sendWhatsAppMessage({
        to: `91${phone}`,
        payload: buildTextPayload(
          `Your WhatsApp verification OTP is ${otp}`,
        ),
      });
    } catch (sendError) {
      logger.error("Failed to send WhatsApp OTP via Meta:", sendError);
      if (process.env.WHATSAPP_OTP_DEBUG === "true") {
        logger.warn(`OTP debug fallback for ${phone}: ${otp}`);
      } else {
        return res.status(RESPONSE_CODES.ERROR).json({
          status: 0,
          message: "Unable to send OTP on WhatsApp. Please try again.",
          statusCode: RESPONSE_CODES.ERROR,
          data: {},
        });
      }
    }

    if (process.env.WHATSAPP_OTP_DEBUG === "true") {
      logger.info(`WhatsApp OTP for ${phone}: ${otp}`);
    }

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "OTP sent successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        phone,
        expiresInSeconds: 300,
        debugOtp:
          process.env.WHATSAPP_OTP_DEBUG === "true" ? otp : undefined,
      },
    });
  } catch (error) {
    logger.error("SUBMIT WHATSAPP NUMBER ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
