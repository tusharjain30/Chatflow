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

    const { accountId } = req.body;

    const account = await prisma.customerAccount.findFirst({
      where: {
        id: accountId,
        isDeleted: false,
      },
      include: {
        users: {
          where: {
            isDeleted: false,
          },
          select: {
            id: true,
          },
        },
      },
    });

    if (!account) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Customer account not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    const userIds = account.users.map((user) => user.id);
    const result = userIds.length
      ? await prisma.accessToken.updateMany({
          where: {
            userId: { in: userIds },
          },
          data: {
            usedValue: 0,
            isActive: true,
          },
        })
      : { count: 0 };

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Account limits reset successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        accountId,
        resetTokens: result.count,
      },
    });
  } catch (error) {
    console.log("SUPER ADMIN RESET LIMITS ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
