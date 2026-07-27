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

    const { accountIds, planId } = req.body;

    const [accounts, plan] = await Promise.all([
      prisma.customerAccount.findMany({
        where: {
          id: { in: accountIds },
          resellerId: req.auth.resellerId,
          isDeleted: false,
        },
        select: { id: true },
      }),
      prisma.plan.findFirst({
        where: {
          id: planId,
          isDeleted: false,
          isActive: true,
        },
      }),
    ]);

    if (!accounts.length) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "No valid customer accounts found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    if (!plan) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Plan not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    const validAccountIds = accounts.map((account) => account.id);
    const startDate = new Date();
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      await tx.subscription.updateMany({
        where: {
          accountId: { in: validAccountIds },
          isActive: true,
        },
        data: {
          isActive: false,
          endDate: startDate,
        },
      });

      await tx.subscription.createMany({
        data: validAccountIds.map((accountId) => ({
          accountId,
          planId,
          startDate,
          endDate,
          isActive: true,
        })),
      });
    });

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "Selected customer plans changed successfully",
      statusCode: RESPONSE_CODES.POST,
      data: {
        updatedCount: validAccountIds.length,
        skippedCount: Math.max(accountIds.length - validAccountIds.length, 0),
        accountIds: validAccountIds,
        plan: {
          id: plan.id,
          name: plan.name,
          price: plan.price,
          currency: plan.currency,
        },
      },
    });
  } catch (error) {
    console.error("RESELLER BULK CHANGE PLAN ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
