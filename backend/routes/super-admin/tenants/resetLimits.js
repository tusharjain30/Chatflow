const express = require("express");
const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const { requireSystemAdmin } = require("./_helpers");

const prisma = new PrismaClient();
const router = express.Router({ mergeParams: true });

router.post("/", async (req, res) => {
  try {
    if (!requireSystemAdmin(req, res, RESPONSE_CODES)) return;

    const { id } = req.params;
    const account = await prisma.customerAccount.findFirst({
      where: { id, isDeleted: false },
      include: {
        users: {
          where: { isDeleted: false },
          select: { id: true },
        },
      },
    });

    if (!account) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Tenant not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    const userIds = account.users.map((u) => u.id);
    const result = userIds.length
      ? await prisma.accessToken.updateMany({
          where: { userId: { in: userIds } },
          data: { usedValue: 0, isActive: true },
        })
      : { count: 0 };

    await prisma.customerAccount.update({
      where: { id },
      data: {
        statusChangedAt: new Date(),
        statusReason: `Usage limits reset by ${req.admin.email}`,
      },
    });

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "Usage limits reset successfully",
      statusCode: RESPONSE_CODES.POST,
      data: { accountId: id, resetTokens: result.count },
    });
  } catch (error) {
    console.log("TENANT RESET LIMITS ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
