const express = require("express");
const router = express.Router();
const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

router.post("/", async (req, res) => {
  try {
    const { accountId } = req.auth;
    const amount = Number(req.body?.amount);
    const paymentMethod = String(req.body?.paymentMethod || "").trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Enter a valid amount",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    if (!paymentMethod) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Select a payment method",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    const account = await prisma.customerAccount.findUnique({
      where: { id: accountId },
      select: { resellerId: true, creditBalance: true },
    });

    if (!account?.resellerId) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Account is not linked to a reseller for billing",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    const [transaction] = await prisma.$transaction([
      prisma.billingTransaction.create({
        data: {
          resellerId: account.resellerId,
          accountId,
          type: "RECHARGE",
          amount,
          currency: "INR",
          description: `Manual top-up via ${paymentMethod}`,
          reference: `PAY-${Date.now()}`,
        },
      }),
      prisma.customerAccount.update({
        where: { id: accountId },
        data: { creditBalance: { increment: amount } },
      }),
    ]);

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "Payment recorded",
      statusCode: RESPONSE_CODES.POST,
      data: transaction,
    });
  } catch (error) {
    console.log("Add payment error:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
