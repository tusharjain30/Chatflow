const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();
const express = require("express");
const router = express.Router();
const RESPONSE_CODES = require("../../../../config/responseCode");
const sendWhatsAppMessage = require("../../../../services/Meta/sendMessage");
const { buildTextPayload } = require("../../../../services/Meta/payloadBuilders");

const normalizeRecipient = (to) => {
  const digits = String(to).replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
};

router.post("/", async (req, res) => {
  try {
    const { userId, accountId } = req.auth;
    const { to, message } = req.body;
    const normalizedTo = normalizeRecipient(to);

    const metaResponse = await sendWhatsAppMessage({
      to: normalizedTo,
      payload: buildTextPayload(message),
    });

    const savedMessage = await prisma.messageLog.create({
      data: {
        accountId,
        sentByUserId: userId,
        to: normalizedTo,
        type: "TEXT",
        direction: "OUTBOUND",
        payload: {
          message,
        },
        messageText: message,
        status: "SENT",
        metaMessageId: metaResponse.messages?.[0]?.id || null,
      },
    });

    res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "Message sent successfully",
      statusCode: RESPONSE_CODES.POST,
      data: {
        message: savedMessage,
        metaResponse,
      },
    });
  } catch (error) {
    console.error("Send text message error:", error?.response?.data || error);
    res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: error?.response?.data?.error?.message || "Failed to send message",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
