const express = require("express");
const router = express.Router();
const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();
const RESPONSE_CODES = require("../../../config/responseCode");

router.get("/", async (req, res) => {
  try {
    const { accountId } = req.auth;

    const webhooks = await prisma.developerWebhook.findMany({
      where: { accountId, isDeleted: false },
      orderBy: { createdAt: "desc" },
    });

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Webhooks loaded",
      statusCode: RESPONSE_CODES.GET,
      data: { webhooks },
    });
  } catch (error) {
    console.log("Developer webhooks list error:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Something went wrong",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
