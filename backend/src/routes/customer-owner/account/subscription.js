const express = require("express");
const router = express.Router();
const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  try {
    const { accountId } = req.auth;

    const subscription = await prisma.subscription.findFirst({
      where: {
        accountId,
        isActive: true,
      },
      orderBy: { startDate: "desc" },
      include: {
        plan: true,
      },
    });

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Subscription fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: subscription || null,
    });
  } catch (error) {
    console.log("Subscription Detail Error:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
