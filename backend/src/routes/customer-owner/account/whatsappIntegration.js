const express = require("express");
const router = express.Router();
const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  try {
    const { accountId, userId } = req.auth;

    const [wabaVerification, whatsAppAccounts] = await Promise.all([
      prisma.wabaVerification.findFirst({
        where: { userId },
        select: {
          id: true,
          clientPhone: true,
          status: true,
          wabaPhoneId: true,
          wabaWabaId: true,
          updatedAt: true,
          createdAt: true,
        },
      }),
      prisma.whatsAppAccount.findMany({
        where: { accountId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          phoneNumber: true,
          phoneNumberId: true,
          wabaId: true,
          businessId: true,
          webhookVerifyToken: true,
          displayName: true,
          isActive: true,
          status: true,
          tokenExpiresAt: true,
          metaBusinessName: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "WhatsApp integration fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        verification: wabaVerification,
        accounts: whatsAppAccounts,
      },
    });
  } catch (error) {
    console.log("WhatsApp Integration Detail Error:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
