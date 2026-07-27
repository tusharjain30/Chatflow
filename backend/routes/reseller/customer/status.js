const express = require("express");

const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

const resolveAccountStatus = (account) => {
  const now = new Date();
  const trialEndsAt = account.trialEndsAt ? new Date(account.trialEndsAt) : null;
  const latestSubscription = Array.isArray(account.subscriptions) ? account.subscriptions[0] : null;
  const subscriptionExpiryDate = latestSubscription
    ? latestSubscription.endDate ||
      new Date(
        new Date(latestSubscription.startDate).getTime() +
          30 * 24 * 60 * 60 * 1000,
      )
    : null;
  const owner = account.users?.[0] || null;

  if (account.lifecycleStatus === "SUSPENDED") return "SUSPENDED";
  if (
    account.lifecycleStatus === "PENDING_VERIFICATION" ||
    (owner && owner.isVerified === false)
  ) {
    return "PENDING_VERIFICATION";
  }
  if (
    account.lifecycleStatus === "EXPIRED" ||
    (trialEndsAt && trialEndsAt < now) ||
    (subscriptionExpiryDate && new Date(subscriptionExpiryDate) < now)
  ) {
    return "EXPIRED";
  }
  if (account.lifecycleStatus === "TRIAL" && (!trialEndsAt || trialEndsAt >= now)) {
    return "TRIAL";
  }
  if (account.lifecycleStatus === "PAUSED" || account.isActive === false) {
    return "PAUSED";
  }
  return "ACTIVE";
};

router.patch("/", async (req, res) => {
  try {
    if (req.auth.userType !== "RESELLER") {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        status: 0,
        message: "Reseller access required",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    const { accountId, status, reason, trialEndsAt } = req.body;

    const account = await prisma.customerAccount.findFirst({
      where: {
        id: accountId,
        resellerId: req.auth.resellerId,
        isDeleted: false,
      },
      include: {
        users: {
          where: { isDeleted: false },
          select: { id: true, isVerified: true },
        },
        subscriptions: {
          where: { isActive: true },
          take: 1,
          orderBy: { startDate: "desc" },
        },
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

    const nextIsActive = ["ACTIVE", "TRIAL"].includes(status);
    const lifecycleUpdate = {
      lifecycleStatus: status,
      statusChangedAt: new Date(),
      statusReason: reason || null,
      ...(status === "TRIAL"
        ? {
            trialEndsAt: trialEndsAt
              ? new Date(trialEndsAt)
              : account.trialEndsAt || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          }
        : status === "ACTIVE"
          ? { trialEndsAt: null }
          : {}),
    };

    await prisma.$transaction([
      prisma.customerAccount.update({
        where: { id: accountId },
        data: {
          isActive: nextIsActive,
          ...lifecycleUpdate,
        },
      }),
      prisma.user.updateMany({
        where: {
          id: { in: account.users.map((user) => user.id) },
        },
        data: { isActive: nextIsActive },
      }),
    ]);

    const resolvedStatus = resolveAccountStatus({
      ...account,
      isActive: nextIsActive,
      ...lifecycleUpdate,
    });

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: `Customer status updated to ${resolvedStatus.toLowerCase().replace(/_/g, " ")}`,
      statusCode: RESPONSE_CODES.GET,
      data: {
        accountId,
        isActive: nextIsActive,
        lifecycleStatus: resolvedStatus,
      },
    });
  } catch (error) {
    console.error("RESELLER CUSTOMER STATUS ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
