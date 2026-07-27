const express = require("express");
const jwt = require("jsonwebtoken");

const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    if (req.auth.userType !== "RESELLER") {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        status: 0,
        message: "Reseller access required",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    const { accountId } = req.body;

    const account = await prisma.customerAccount.findFirst({
      where: {
        id: accountId,
        resellerId: req.auth.resellerId,
        isDeleted: false,
        isActive: true,
      },
      include: {
        users: {
          where: {
            isDeleted: false,
            isActive: true,
          },
          include: {
            role: true,
          },
          orderBy: [{ createdAt: "asc" }],
        },
      },
    });

    if (!account) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Active customer account not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    const targetUser =
      account.users.find((user) => user.role?.roleType === "CUSTOMER_OWNER") ||
      account.users.find((user) => user.role?.roleType === "CUSTOMER_ADMIN") ||
      account.users[0];

    if (!targetUser) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "No active customer user available for login",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    const tokenPayload = {
      userType: "USER",
      userId: targetUser.id,
      accountId: targetUser.accountId,
      role: targetUser.role?.roleType,
      tokenVersion: targetUser.tokenVersion,
      impersonatedBy: {
        resellerId: req.auth.resellerId,
        resellerName: `${req.auth.firstName} ${req.auth.lastName}`.trim(),
        resellerCompanyName: req.auth.companyName,
      },
    };

    const token = jwt.sign(tokenPayload, process.env.USER_JWT_SECRET, {
      expiresIn: "8h",
    });

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Customer login session created successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        token,
        portal: "user",
        redirectTo: "/",
        account: {
          id: account.id,
          companyName: account.companyName,
        },
        user: {
          id: targetUser.id,
          firstName: targetUser.firstName,
          lastName: targetUser.lastName,
          email: targetUser.email,
          roleType: targetUser.role?.roleType || null,
        },
        supportSession: {
          resellerId: req.auth.resellerId,
          resellerName: `${req.auth.firstName} ${req.auth.lastName}`.trim(),
          resellerCompanyName: req.auth.companyName,
          customerCompanyName: account.companyName,
        },
      },
    });
  } catch (error) {
    console.error("RESELLER LOGIN AS CUSTOMER ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
