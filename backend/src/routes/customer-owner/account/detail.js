const express = require("express");
const router = express.Router();
const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  try {
    const { accountId, userId } = req.auth;

    const owner = await prisma.user.findFirst({
      where: {
        id: userId,
        accountId,
        isDeleted: false,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        account: {
          select: {
            id: true,
            companyName: true,
            isActive: true,
            isDeleted: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!owner || !owner.account) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Account not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Account details fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        account: owner.account,
        owner: {
          id: owner.id,
          firstName: owner.firstName,
          lastName: owner.lastName,
          email: owner.email,
          phone: owner.phone,
          isActive: owner.isActive,
          createdAt: owner.createdAt,
        },
      },
    });
  } catch (error) {
    console.log("Account Detail Error:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
