const express = require("express");
const router = express.Router();
const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

router.put("/", async (req, res) => {
  try {
    const { accountId, userId } = req.auth;
    const { companyName, firstName, lastName, phone } = req.body;

    const owner = await prisma.user.findFirst({
      where: {
        id: userId,
        accountId,
        isDeleted: false,
      },
    });

    if (!owner) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Owner account not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    if (phone && phone !== owner.phone) {
      const existingPhone = await prisma.user.findFirst({
        where: {
          phone,
          isDeleted: false,
          id: { not: userId },
        },
        select: { id: true },
      });

      if (existingPhone) {
        return res.status(RESPONSE_CODES.ALREADY_EXIST).json({
          status: 0,
          message: "Phone number already in use",
          statusCode: RESPONSE_CODES.ALREADY_EXIST,
          data: {},
        });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.customerAccount.update({
        where: { id: accountId },
        data: {
          ...(companyName !== undefined ? { companyName } : {}),
        },
      });

      return tx.user.update({
        where: { id: userId },
        data: {
          ...(firstName !== undefined ? { firstName } : {}),
          ...(lastName !== undefined ? { lastName } : {}),
          ...(phone !== undefined ? { phone } : {}),
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          account: {
            select: {
              id: true,
              companyName: true,
              updatedAt: true,
            },
          },
        },
      });
    });

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Account updated successfully",
      statusCode: RESPONSE_CODES.GET,
      data: updated,
    });
  } catch (error) {
    console.log("Account Update Error:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
