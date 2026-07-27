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

    const { accountId, isActive } = req.body;

    const account = await prisma.customerAccount.findFirst({
      where: {
        id: accountId,
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

    if (!account) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Customer account not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    await prisma.$transaction([
      prisma.customerAccount.update({
        where: { id: accountId },
        data: { isActive },
      }),
      prisma.user.updateMany({
        where: {
          id: { in: account.users.map((user) => user.id) },
        },
        data: { isActive },
      }),
    ]);

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: `Customer ${isActive ? "activated" : "paused"} successfully`,
      statusCode: RESPONSE_CODES.GET,
      data: {
        accountId,
        isActive,
      },
    });
  } catch (error) {
    console.error("RESELLER CUSTOMER STATUS ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
