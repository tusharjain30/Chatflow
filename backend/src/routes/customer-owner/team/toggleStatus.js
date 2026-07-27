const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const RESPONSE_CODES = require("../../../config/responseCode");

router.patch("/", async (req, res) => {
  try {
    const { userId } = req.validatedParams;
    const auth = req.auth;

    // =========================
    // Find user
    // =========================
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        accountId: auth.accountId,
        isDeleted: false,
      },
      include: {
        role: true,
      },
    });

    if (!user) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Team member not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    // =========================
    // Prevent toggling OWNER
    // =========================
    if (user.role?.roleType === "CUSTOMER_OWNER") {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        status: 0,
        message: "Owner status cannot be changed",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    // =========================
    // Toggle logic
    // =========================
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isActive: !user.isActive,
      },
    });

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: `User ${
        updatedUser.isActive ? "activated" : "deactivated"
      } successfully`,
      statusCode: RESPONSE_CODES.POST,
      data: {
        userId: updatedUser.id,
        isActive: updatedUser.isActive,
      },
    });
  } catch (error) {
    console.log("Toggle Status Error:", error);

    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
