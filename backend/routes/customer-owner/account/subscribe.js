const express = require("express");
const router = express.Router();
const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

router.post("/", async (req, res) => {
  try {
    const { accountId } = req.auth;
    const { planId, paymentMethod, couponCode } = req.body || {};

    if (!planId) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Plan is required",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    const plan = await prisma.plan.findFirst({
      where: { id: planId, isActive: true, isDeleted: false },
    });

    if (!plan) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Plan not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    const account = await prisma.customerAccount.findUnique({
      where: { id: accountId },
      select: { resellerId: true, companyName: true },
    });

    const result = await prisma.$transaction(async (tx) => {
      await tx.subscription.updateMany({
        where: { accountId, isActive: true },
        data: { isActive: false, endDate: new Date() },
      });

      const subscription = await tx.subscription.create({
        data: {
          accountId,
          planId: plan.id,
          startDate: new Date(),
          endDate: null,
          isActive: true,
        },
        include: { plan: true },
      });

      await tx.customerAccount.update({
        where: { id: accountId },
        data: {
          lifecycleStatus: "ACTIVE",
          trialEndsAt: null,
          statusChangedAt: new Date(),
          statusReason: `Subscribed to ${plan.name}`,
        },
      });

      if (account?.resellerId) {
        await tx.billingTransaction.create({
          data: {
            resellerId: account.resellerId,
            accountId,
            type: "RECHARGE",
            amount: plan.price,
            currency: plan.currency,
            description: `Subscription: ${plan.name}${
              paymentMethod ? ` via ${paymentMethod}` : ""
            }${couponCode ? ` (coupon ${couponCode})` : ""}`,
            reference: `SUB-${Date.now()}`,
          },
        });
      }

      return subscription;
    });

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: `Subscribed to ${plan.name}`,
      statusCode: RESPONSE_CODES.POST,
      data: result,
    });
  } catch (error) {
    console.log("Subscribe error:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
