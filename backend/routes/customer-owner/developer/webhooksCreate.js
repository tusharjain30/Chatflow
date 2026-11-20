const express = require("express");
const router = express.Router();
const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();
const RESPONSE_CODES = require("../../../config/responseCode");

router.post("/", async (req, res) => {
  try {
    const { accountId, userId } = req.auth;
    const { url, events } = req.body;

    const webhook = await prisma.developerWebhook.create({
      data: {
        accountId,
        createdByUserId: userId || null,
        url: url.trim(),
        events,
        isActive: true,
      },
    });

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "Webhook created",
      statusCode: RESPONSE_CODES.POST,
      data: webhook,
    });
  } catch (error) {
    console.log("Developer webhook create error:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Something went wrong",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
