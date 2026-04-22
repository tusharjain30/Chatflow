const express = require("express");

const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

const normalizeRecipient = (to) => {
  const digits = String(to).replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
};

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

    const { accountIds, message } = req.body;

    const accounts = await prisma.customerAccount.findMany({
      where: {
        id: { in: accountIds },
        resellerId: req.auth.resellerId,
        isDeleted: false,
      },
      include: {
        users: {
          where: {
            isDeleted: false,
            phone: { not: null },
          },
          orderBy: { createdAt: "asc" },
          take: 1,
          select: {
            id: true,
            phone: true,
          },
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

    const deliverableAccounts = accounts.filter((account) => account.users[0]?.phone);

    if (!deliverableAccounts.length) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Selected customers do not have a valid owner phone",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    await prisma.messageLog.createMany({
      data: deliverableAccounts.map((account) => ({
        accountId: account.id,
        to: normalizeRecipient(account.users[0].phone),
        type: "TEXT",
        direction: "OUTBOUND",
        payload: {
          message,
          source: "RESELLER_BULK_CAMPAIGN",
        },
        messageText: message,
        status: "SENT",
      })),
    });

    const validAccountIds = deliverableAccounts.map((account) => account.id);

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "Campaign queued for selected customers",
      statusCode: RESPONSE_CODES.POST,
      data: {
        queuedCount: validAccountIds.length,
        skippedCount: Math.max(accountIds.length - validAccountIds.length, 0),
        accountIds: validAccountIds,
      },
    });
  } catch (error) {
    console.error("RESELLER BULK SEND CAMPAIGN ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
