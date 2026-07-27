const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const RESPONSE_CODES = require("../../../config/responseCode");

router.delete("/", async (req, res) => {
  try {
    const { userIds } = req.body;
    const auth = req.auth;

    // =========================
    // Find users (same account)
    // =========================
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        accountId: auth.accountId,
        isDeleted: false,
      },
      include: {
        role: true,
      },
    });

    if (!users.length) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "No valid users found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    // =========================
    // Filter out OWNER
    // =========================
    const deletableUsers = users.filter(
      (u) => u.role?.roleType !== "CUSTOMER_OWNER"
    );

    const skippedUsers = users.filter(
      (u) => u.role?.roleType === "CUSTOMER_OWNER"
    );

    if (!deletableUsers.length) {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        status: 0,
        message: "Owner cannot be deleted",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    // =========================
    // Bulk update
    // =========================
    const result = await prisma.user.updateMany({
      where: {
        id: { in: deletableUsers.map((u) => u.id) },
      },
      data: {
        isDeleted: true,
        isActive: false,
      },
    });

    return res.status(RESPONSE_CODES.DELETE).json({
      status: 1,
      message: "Selected members removed successfully",
      statusCode: RESPONSE_CODES.DELETE,
      data: {
        deletedCount: result.count,
        skippedOwnerIds: skippedUsers.map((u) => u.id),
      },
    });

  } catch (error) {
    console.log("Bulk Delete Error:", error);

    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;