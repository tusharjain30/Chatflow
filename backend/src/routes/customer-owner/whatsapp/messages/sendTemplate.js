const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();
const express = require("express");
const router = express.Router();
const RESPONSE_CODES = require("../../../../config/responseCode");
const sendWhatsAppMessage = require("../../../../services/Meta/sendMessage");
const { buildTemplatePayload } = require("../../../../services/Meta/templatePayloadBuilder");

const normalizeRecipient = (to) => {
  const digits = String(to).replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
};

router.post("/", async (req, res) => {
  try {
    const { userId, accountId } = req.auth;
    const { to, templateId, variables = [] } = req.body;
    const normalizedTo = normalizeRecipient(to);

    const template = await prisma.template.findFirst({
      where: {
        id: templateId,
        accountId,
        isDeleted: false,
        isActive: true,
        status: "APPROVED",
      },
    });

    if (!template) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Approved template not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    const metaResponse = await sendWhatsAppMessage({
      to: normalizedTo,
      payload: buildTemplatePayload({
        name: template.name,
        language: template.language,
        variables,
      }),
    });

    const savedMessage = await prisma.messageLog.create({
      data: {
        accountId,
        sentByUserId: userId,
        to: normalizedTo,
        type: "TEMPLATE",
        direction: "OUTBOUND",
        templateId: template.id,
        templateName: template.name,
        payload: {
          templateId: template.id,
          templateName: template.name,
          variables,
        },
        status: "SENT",
        metaMessageId: metaResponse.messages?.[0]?.id || null,
      },
    });

    res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "Template message sent successfully",
      statusCode: RESPONSE_CODES.POST,
      data: {
        message: savedMessage,
        metaResponse,
      },
    });
  } catch (error) {
    console.error("Send template message error:", error?.response?.data || error);
    res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: error?.response?.data?.error?.message || "Failed to send template message",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
