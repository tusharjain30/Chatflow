const express = require("express");
const router = express.Router();
const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  try {
    const { accountId } = req.auth;

    const [subscription, account] = await Promise.all([
      prisma.subscription.findFirst({
        where: {
          accountId,
          isActive: true,
        },
        orderBy: { startDate: "desc" },
        include: {
          plan: true,
        },
      }),
      prisma.customerAccount.findUnique({
        where: { id: accountId },
        select: {
          companyName: true,
          creditBalance: true,
          lifecycleStatus: true,
          trialEndsAt: true,
        },
      }),
    ]);

    const isTrial =
      account?.lifecycleStatus === "TRIAL" ||
      (!!account?.trialEndsAt &&
        new Date(account.trialEndsAt).getTime() > Date.now() &&
        !subscription);

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Subscription fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        ...(subscription || {}),
        plan: subscription?.plan || null,
        isActive: subscription?.isActive || false,
        startDate: subscription?.startDate || null,
        endDate: subscription?.endDate || null,
        account: {
          companyName: account?.companyName || null,
          creditBalance: account?.creditBalance || 0,
          lifecycleStatus: account?.lifecycleStatus || null,
          trialEndsAt: account?.trialEndsAt || null,
          isTrial,
        },
      },
    });
  } catch (error) {
    console.log("Subscription Detail Error:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
