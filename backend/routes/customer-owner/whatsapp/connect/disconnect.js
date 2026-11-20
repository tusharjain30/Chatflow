const express = require("express");
const router = express.Router();
const RESPONSE_CODES = require("../../../../config/responseCode");
const { PrismaClient } = require("../../../../generated/prisma/client");
const logger = require("../../../../utils/logger");

const prisma = new PrismaClient();

router.post("/", async (req, res) => {
  try {
    const { userId, accountId } = req.auth;

    await prisma.$transaction([
      prisma.wabaVerification.updateMany({
        where: { userId },
        data: {
          status: "EXPIRED",
          otp: null,
          otpExpires: null,
          wabaPhoneId: null,
          wabaWabaId: null,
        },
      }),
      prisma.whatsAppAccount.updateMany({
        where: { accountId },
        data: {
          isActive: false,
          status: "DISCONNECTED",
        },
      }),
    ]);

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "WhatsApp disconnected successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {},
    });
  } catch (error) {
    logger.error("WHATSAPP DISCONNECT ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
