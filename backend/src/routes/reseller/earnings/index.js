const express = require("express");

const RESPONSE_CODES = require("../../../config/responseCode");
const requireAuth = require("../../../middleware/requireAuth");
import prisma from "../../../config/prisma";
const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    if (req.auth.userType !== "RESELLER") {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        status: 0,
        message: "Reseller access required",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    const resellerId = req.auth.resellerId;
    const subscriptions = await prisma.subscription.findMany({
      where: {
        account: {
          resellerId,
          isDeleted: false,
        },
      },
      include: {
        plan: {
          select: {
            name: true,
            price: true,
            currency: true,
          },
        },
        account: {
          select: {
            companyName: true,
          },
        },
      },
      orderBy: { startDate: "desc" },
    });

    const commissionRate = req.auth.commissionRate || 0;
    const monthlyRecurringRevenue = subscriptions
      .filter((subscription) => subscription.isActive)
      .reduce((sum, subscription) => sum + subscription.plan.price, 0);
    const monthlyCommission = Number(
      ((monthlyRecurringRevenue * commissionRate) / 100).toFixed(2),
    );

    const trendMap = new Map();
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date();
      date.setUTCDate(1);
      date.setUTCHours(0, 0, 0, 0);
      date.setUTCMonth(date.getUTCMonth() - i);
      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
      trendMap.set(key, {
        month: date.toLocaleString("en-US", {
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        }),
        revenue: 0,
        commission: 0,
      });
    }

    subscriptions.forEach((subscription) => {
      const monthKey = `${subscription.startDate.getUTCFullYear()}-${String(subscription.startDate.getUTCMonth() + 1).padStart(2, "0")}`;
      const current = trendMap.get(monthKey);
      if (current) {
        current.revenue += subscription.plan.price;
        current.commission += Number(
          ((subscription.plan.price * commissionRate) / 100).toFixed(2),
        );
      }
    });

    const payouts = subscriptions.slice(0, 8).map((subscription) => ({
      id: subscription.id,
      companyName: subscription.account.companyName,
      planName: subscription.plan.name,
      amount: subscription.plan.price,
      commission: Number(
        ((subscription.plan.price * commissionRate) / 100).toFixed(2),
      ),
      currency: subscription.plan.currency,
      startDate: subscription.startDate,
      status: subscription.isActive ? "ACTIVE" : "INACTIVE",
    }));

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Reseller earnings loaded successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        commissionRate,
        walletBalance: req.auth.balance || 0,
        monthlyRecurringRevenue,
        monthlyCommission,
        totalCustomers: new Set(
          subscriptions.map((subscription) => subscription.account.companyName),
        ).size,
        trend: Array.from(trendMap.values()),
        payouts,
      },
    });
  } catch (error) {
    console.error("RESELLER EARNINGS ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
