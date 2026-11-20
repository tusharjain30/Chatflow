const RESPONSE_CODES = require("../../../../config/responseCode");
const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();
const express = require("express");
const logger = require("../../../../utils/logger");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { userId, accountId } = req.auth;
    const { otp } = req.body;

    if (!otp) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "OTP required",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    const record = await prisma.wabaVerification.findUnique({
      where: { userId },
    });

    if (!record) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Verification request not found",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
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
        data: {},
      });
    }

    const phoneNumberId = process.env.PHONE_NUMBER_ID;
    const wabaId = process.env.META_WABA_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const webhookVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

    if (!phoneNumberId || !wabaId || !accessToken || !webhookVerifyToken) {
      logger.error("WhatsApp connect missing Meta env credentials");
      return res.status(RESPONSE_CODES.ERROR).json({
        status: 0,
        message: "WhatsApp provider is not configured on the server",
        statusCode: RESPONSE_CODES.ERROR,
        data: {},
      });
    }

    const account = await prisma.customerAccount.findUnique({
      where: { id: accountId },
      select: { companyName: true },
    });

    const fullPhone = record.clientPhone.startsWith("91")
      ? record.clientPhone
      : `91${record.clientPhone}`;

    const accountPayload = {
      phoneNumber: fullPhone,
      phoneNumberId,
      wabaId,
      accessToken,
      webhookVerifyToken,
      displayName: account?.companyName || "WhatsApp Business",
      metaBusinessName: account?.companyName || null,
      isActive: true,
      status: "ACTIVE",
    };

    const existingWhatsAppAccount = await prisma.whatsAppAccount.findFirst({
      where: { accountId },
      orderBy: { createdAt: "desc" },
    });

    const [verification, whatsAppAccount] = await prisma.$transaction([
      prisma.wabaVerification.update({
        where: { userId },
        data: {
          status: "VERIFIED",
          otp: null,
          otpExpires: null,
          wabaPhoneId: phoneNumberId,
          wabaWabaId: wabaId,
        },
      }),
      existingWhatsAppAccount
        ? prisma.whatsAppAccount.update({
            where: { id: existingWhatsAppAccount.id },
            data: accountPayload,
          })
        : prisma.whatsAppAccount.create({
            data: {
              accountId,
              ...accountPayload,
            },
          }),
    ]);

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "WhatsApp number verified successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        verification: {
          id: verification.id,
          clientPhone: verification.clientPhone,
          status: verification.status,
          wabaPhoneId: verification.wabaPhoneId,
          wabaWabaId: verification.wabaWabaId,
        },
        account: {
          id: whatsAppAccount.id,
          phoneNumber: whatsAppAccount.phoneNumber,
          displayName: whatsAppAccount.displayName,
          status: whatsAppAccount.status,
          isActive: whatsAppAccount.isActive,
        },
      },
    });
  } catch (error) {
    logger.error("VERIFY WHATSAPP OTP ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
