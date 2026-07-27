const express = require("express");

const RESPONSE_CODES = require("../../../config/responseCode");
import prisma from "../../../config/prisma";
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

    const { accountId, amount } = req.body;

    const account = await prisma.customerAccount.findFirst({
      where: {
        id: accountId,
        resellerId: req.auth.resellerId,
        isDeleted: false,
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

    const updatedAccount = await prisma.$transaction(async (tx) => {
      const accountRecord = await tx.customerAccount.update({
        where: { id: accountId },
        data: {
          creditBalance: {
            increment: amount,
          },
        },
      });

      await tx.billingTransaction.create({
        data: {
          resellerId: req.auth.resellerId,
          accountId,
          type: "RECHARGE",
          amount,
          currency: "INR",
          description: `Credits added to ${account.companyName}`,
          reference: `RCG-${Date.now()}`,
        },
      });

      return accountRecord;
    });

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "Credits added successfully",
      statusCode: RESPONSE_CODES.POST,
      data: {
        accountId: updatedAccount.id,
        creditBalance: updatedAccount.creditBalance,
      },
    });
  } catch (error) {
    console.error("RESELLER RECHARGE ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
