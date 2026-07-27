const express = require("express");
const jwt = require("jsonwebtoken");

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
        message: "Customer account not found",
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

    const token = jwt.sign(
      {
        userType: "USER",
        userId: targetUser.id,
        accountId: targetUser.accountId,
        role: targetUser.role?.roleType,
        tokenVersion: targetUser.tokenVersion,
        impersonatedBy: {
          adminId: req.admin.id,
          adminName: `${req.admin.firstName} ${req.admin.lastName}`.trim(),
          adminEmail: req.admin.email,
        },
      },
      process.env.USER_JWT_SECRET,
      { expiresIn: "8h" },
    );

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Customer support session created successfully",
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
          adminName: `${req.admin.firstName} ${req.admin.lastName}`.trim(),
          adminEmail: req.admin.email,
          customerCompanyName: account.companyName,
        },
      },
    });
  } catch (error) {
    console.log("SUPER ADMIN LOGIN AS CUSTOMER ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
