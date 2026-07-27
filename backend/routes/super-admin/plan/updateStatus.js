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

    const { planId, isActive } = req.body;

    const plan = await prisma.plan.findFirst({
      where: {
        id: planId,
        isDeleted: false,
      },
    });

    if (!plan) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Plan not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    const updated = await prisma.plan.update({
      where: {
        id: planId,
      },
      data: {
        isActive,
      },
    });

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: `Plan ${isActive ? "activated" : "disabled"} successfully`,
      statusCode: RESPONSE_CODES.GET,
      data: {
        id: updated.id,
        isActive: updated.isActive,
      },
    });
  } catch (error) {
    console.log("SUPER ADMIN PLAN STATUS ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
