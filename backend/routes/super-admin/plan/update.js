const express = require("express");

const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

router.patch("/", async (req, res) => {
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
      planId,
      name,
      description,
      price,
      currency = "INR",
      maxTemplates,
      maxBots = null,
      monthlyMessageLimit = null,
      isActive,
    } = req.body;

    const existing = await prisma.plan.findFirst({
      where: {
        id: planId,
        isDeleted: false,
      },
    });

    if (!existing) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Plan not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    const duplicate = await prisma.plan.findFirst({
      where: {
        id: {
          not: planId,
        },
        name,
      },
    });

    if (duplicate) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Another plan already uses this name",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    const updated = await prisma.plan.update({
      where: {
        id: planId,
      },
      data: {
        name,
        description: description || null,
        price,
        currency,
        maxTemplates,
        maxBots,
        monthlyMessageLimit,
        ...(typeof isActive === "boolean" ? { isActive } : {}),
      },
    });

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Plan updated successfully",
      statusCode: RESPONSE_CODES.GET,
      data: updated,
    });
  } catch (error) {
    console.log("SUPER ADMIN PLAN UPDATE ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
