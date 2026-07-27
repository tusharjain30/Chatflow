const express = require("express");

const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

router.patch("/", async (req, res) => {
  try {
    if (req.auth.userType !== "RESELLER") {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        status: 0,
        message: "Reseller access required",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    const { accountIds, isActive } = req.body;

    const accounts = await prisma.customerAccount.findMany({
      where: {
        id: { in: accountIds },
        resellerId: req.auth.resellerId,
        isDeleted: false,
      },
      include: {
        users: {
          where: { isDeleted: false },
          select: { id: true },
        },
      },
    });

    if (!accounts.length) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "No valid customer accounts found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    const validAccountIds = accounts.map((account) => account.id);
    const userIds = accounts.flatMap((account) =>
      account.users.map((user) => user.id),
    );

    const tx = [
      prisma.customerAccount.updateMany({
        where: {
          id: { in: validAccountIds },
        },
        data: { isActive },
      }),
    ];

    if (userIds.length) {
      tx.push(
        prisma.user.updateMany({
          where: {
            id: { in: userIds },
          },
          data: { isActive },
        }),
      );
    }

    await prisma.$transaction(tx);

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: `Selected customers ${isActive ? "activated" : "paused"} successfully`,
      statusCode: RESPONSE_CODES.GET,
      data: {
        updatedCount: validAccountIds.length,
        skippedCount: Math.max(accountIds.length - validAccountIds.length, 0),
        accountIds: validAccountIds,
        isActive,
      },
    });
  } catch (error) {
    console.error("RESELLER BULK CUSTOMER STATUS ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
