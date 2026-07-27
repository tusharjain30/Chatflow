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
      select: {
        id: true,
        companyName: true,
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

    const users = await prisma.user.findMany({
      where: {
        accountId: account.id,
        isDeleted: false,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            roleType: true,
          },
        },
      },
      orderBy: [{ createdAt: "asc" }],
    });

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Customer users fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        account,
        users: users.map((user) => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          isActive: user.isActive,
          createdAt: user.createdAt,
          roleType: user.role?.roleType || null,
          roleName: user.role?.name || null,
        })),
      },
    });
  } catch (error) {
    console.error("RESELLER CUSTOMER USERS LIST ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
