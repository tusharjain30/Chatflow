const express = require("express");
const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const { requireSystemAdmin } = require("./_helpers");

const prisma = new PrismaClient();
const router = express.Router({ mergeParams: true });

router.post("/", async (req, res) => {
  try {
    if (!requireSystemAdmin(req, res, RESPONSE_CODES)) return;

    const { id } = req.params;
    const { planId } = req.body;

    const [account, plan] = await Promise.all([
      prisma.customerAccount.findFirst({
        where: { id, isDeleted: false },
      }),
      prisma.plan.findFirst({
        where: { id: planId, isDeleted: false, isActive: true },
      }),
    ]);

    if (!account) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Tenant not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }
    if (!plan) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Plan not found",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    const subscription = await prisma.$transaction(async (tx) => {
      await tx.subscription.updateMany({
        where: { accountId: id, isActive: true },
        data: { isActive: false, endDate: new Date() },
      });

      return tx.subscription.create({
        data: {
          accountId: id,
          planId,
          isActive: true,
          startDate: new Date(),
        },
        include: { plan: true },
      });
    });

    await prisma.customerAccount.update({
      where: { id },
      data: {
        lifecycleStatus:
          account.lifecycleStatus === "TRIAL" ? "ACTIVE" : account.lifecycleStatus,
        statusChangedAt: new Date(),
        statusReason: `Plan changed to ${plan.name} by ${req.admin.email}`,
      },
    });

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "Subscription plan updated",
      statusCode: RESPONSE_CODES.POST,
      data: subscription,
    });
  } catch (error) {
    console.log("TENANT CHANGE PLAN ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
