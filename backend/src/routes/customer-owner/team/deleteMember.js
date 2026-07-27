const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const RESPONSE_CODES = require("../../../config/responseCode");

router.delete("/", async (req, res) => {
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
    // Prevent deleting OWNER
    // =========================
    if (user.role?.roleType === "CUSTOMER_OWNER") {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        status: 0,
        message: "Owner cannot be deleted",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    // =========================
    // Soft delete
    // =========================
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isDeleted: true,
        isActive: false,
      },
    });

    return res.status(RESPONSE_CODES.DELETE).json({
      status: 1,
      message: "Team member removed successfully",
      statusCode: RESPONSE_CODES.DELETE,
      data: {
        userId: user.id,
      },
    });

  } catch (error) {
    console.log("Delete Member Error:", error);

    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;