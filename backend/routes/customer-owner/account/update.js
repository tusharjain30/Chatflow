const express = require("express");
const router = express.Router();
const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const ACCOUNT_SETTING_KEYS = [
  "companyName",
  "address",
  "city",
  "state",
  "zipCode",
  "country",
  "timezone",
  "notificationSoundEnabled",
  "campaignResendEnabled",
];

router.put("/", async (req, res) => {
  try {
    const { accountId, userId } = req.auth;
    const {
      companyName,
      firstName,
      lastName,
      phone,
      address,
      city,
      state,
      zipCode,
      country,
      timezone,
      notificationSoundEnabled,
      campaignResendEnabled,
    } = req.body;

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

    const accountData = {};
    const incoming = {
      companyName,
      address,
      city,
      state,
      zipCode,
      country,
      timezone,
      notificationSoundEnabled,
      campaignResendEnabled,
    };
    for (const key of ACCOUNT_SETTING_KEYS) {
      if (incoming[key] !== undefined) accountData[key] = incoming[key];
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (Object.keys(accountData).length > 0) {
        await tx.customerAccount.update({
          where: { id: accountId },
          data: accountData,
        });
      }

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
              address: true,
              city: true,
              state: true,
              zipCode: true,
              country: true,
              timezone: true,
              notificationSoundEnabled: true,
              campaignResendEnabled: true,
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
      message: error?.message || "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
