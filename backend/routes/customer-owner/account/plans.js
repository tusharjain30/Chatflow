const express = require("express");
const router = express.Router();
const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true, isDeleted: false },
      orderBy: { price: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        currency: true,
        maxTemplates: true,
        maxBots: true,
        monthlyMessageLimit: true,
      },
    });

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Plans loaded",
      statusCode: RESPONSE_CODES.GET,
      data: { plans },
    });
  } catch (error) {
    console.log("Plans list error:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
