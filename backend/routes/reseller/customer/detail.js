const express = require("express");

const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    if (req.auth.userType !== "RESELLER") {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        status: 0,
        message: "Reseller access required",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    const account = await prisma.customerAccount.findFirst({
      where: {
        id: req.validatedQuery.accountId,
        resellerId: req.auth.resellerId,
        isDeleted: false,
      },
      include: {
        users: {
          where: { isDeleted: false },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            isActive: true,
            createdAt: true,
          },
        },
        subscriptions: {
          where: { isActive: true },
          include: {
            plan: true,
          },
        },
        _count: {
          select: {
            contacts: {
              where: { isDeleted: false },
            },
            templates: {
              where: { isDeleted: false },
            },
            campaigns: true,
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

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Customer details fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: account,
    });
  } catch (error) {
    console.error("RESELLER CUSTOMER DETAIL ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
