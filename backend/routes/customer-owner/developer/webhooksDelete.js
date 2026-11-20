const express = require("express");
const router = express.Router({ mergeParams: true });
const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();
const RESPONSE_CODES = require("../../../config/responseCode");

router.delete("/", async (req, res) => {
  try {
    const { accountId } = req.auth;
    const webhookId = req.params.webhookId;

    const existing = await prisma.developerWebhook.findFirst({
      where: { id: webhookId, accountId, isDeleted: false },
    });

    if (!existing) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Webhook not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    await prisma.developerWebhook.update({
      where: { id: existing.id },
      data: { isDeleted: true, isActive: false },
    });

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Webhook deleted",
      statusCode: RESPONSE_CODES.GET,
      data: { id: existing.id },
    });
  } catch (error) {
    console.log("Developer webhook delete error:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Something went wrong",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
