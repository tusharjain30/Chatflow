const express = require("express");

const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    if (req.admin.role?.roleType !== "SYSTEM_ADMIN") {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        status: 0,
        message: "Access denied",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    const {
      name,
      description,
      price,
      currency = "INR",
      maxTemplates,
      maxBots = null,
      monthlyMessageLimit = null,
      isActive = true,
    } = req.body;

    const existing = await prisma.plan.findFirst({
      where: {
        name,
      },
    });

    if (existing) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "A plan with this name already exists",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    const plan = await prisma.plan.create({
      data: {
        name,
        description: description || null,
        price,
        currency,
        maxTemplates,
        maxBots,
        monthlyMessageLimit,
        isActive,
      },
    });

    return res.status(RESPONSE_CODES.CREATE).json({
      status: 1,
      message: "Plan created successfully",
      statusCode: RESPONSE_CODES.CREATE,
      data: plan,
    });
  } catch (error) {
    console.log("SUPER ADMIN PLAN CREATE ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
