const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();
const express = require("express");
const router = express.Router();
const RESPONSE_CODES = require("../../../../config/responseCode");
const sendWhatsAppMessage = require("../../../../services/Meta/sendMessage");
const uploadMediaToMeta = require("../../../../services/Meta/uploadMediaToMeta");
const { buildMediaPayload } = require("../../../../services/Meta/payloadBuilders");
const fs = require("fs");

const normalizeRecipient = (to) => {
  const digits = String(to).replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
};

router.post("/", async (req, res) => {
  try {
    const { userId, accountId } = req.auth;
    const { to, caption } = req.body;

    if (!req.file) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Media file is required",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    const normalizedTo = normalizeRecipient(to);
    const filePath = req.file.path;
    const mimeType = req.file.mimetype;

    let mediaType;
    if (mimeType.startsWith("image/")) mediaType = "IMAGE";
    else if (mimeType.startsWith("video/")) mediaType = "VIDEO";
    else mediaType = "DOCUMENT";

    const mediaId = await uploadMediaToMeta({
      filePath,
      mimeType,
    });

    const metaResponse = await sendWhatsAppMessage({
      to: normalizedTo,
      payload: buildMediaPayload({
        mediaType,
        mediaId,
        caption,
      }),
    });

    const savedMessage = await prisma.messageLog.create({
      data: {
        accountId,
        sentByUserId: userId,
        to: normalizedTo,
        type: mediaType,
        direction: "OUTBOUND",
        payload: {
          caption,
          metaMediaId: mediaId,
          fileName: req.file.originalname,
          mimeType,
        },
        mediaUrl: mediaId,
        status: "SENT",
        metaMessageId: metaResponse.messages?.[0]?.id || null,
      },
    });

    fs.unlinkSync(filePath);

    res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "Media message sent successfully",
      statusCode: RESPONSE_CODES.POST,
      data: {
        message: savedMessage,
        metaResponse,
      },
    });
  } catch (error) {
    console.error("Send media error:", error?.response?.data || error);
    res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: error?.response?.data?.error?.message || "Failed to send media",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
