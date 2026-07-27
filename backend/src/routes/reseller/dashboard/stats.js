const express = require("express");

const RESPONSE_CODES = require("../../../config/responseCode");
import prisma from "../../../config/prisma";
const router = express.Router();

router.get("/", async (req, res) => {
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
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const activeSubscriptionWhere = {
      isActive: true,
      account: {
        resellerId,
        isDeleted: false,
      },
    };

    const [
      totalCustomers,
      activeCustomers,
      totalTeamMembers,
      totalSubscriptions,
      activePlans,
      totalMessages,
      messagesUsedThisMonth,
      revenueSummary,
    ] = await Promise.all([
      prisma.customerAccount.count({
        where: { resellerId, isDeleted: false },
      }),
      prisma.customerAccount.count({
        where: { resellerId, isDeleted: false, isActive: true },
      }),
      prisma.user.count({
        where: {
          account: {
            resellerId,
            isDeleted: false,
          },
          isDeleted: false,
        },
      }),
      prisma.subscription.count({
        where: activeSubscriptionWhere,
      }),
      prisma.plan.count({
        where: {
          subscriptions: {
            some: activeSubscriptionWhere,
          },
          isDeleted: false,
          isActive: true,
        },
      }),
      prisma.messageLog.count({
        where: {
          account: {
            resellerId,
            isDeleted: false,
          },
        },
      }),
      prisma.messageLog.count({
        where: {
          account: {
            resellerId,
            isDeleted: false,
          },
          createdAt: {
            gte: monthStart,
          },
        },
      }),
      prisma.subscription.findMany({
        where: activeSubscriptionWhere,
        include: {
          plan: {
            select: {
              price: true,
            },
          },
        },
      }),
    ]);

    const monthlyRevenue = revenueSummary.reduce(
      (sum, subscription) => sum + (subscription.plan?.price || 0),
      0,
    );
    const commissionEarned = Number(
      ((monthlyRevenue * (req.auth.commissionRate || 0)) / 100).toFixed(2),
    );

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Reseller dashboard stats loaded",
      statusCode: RESPONSE_CODES.GET,
      data: {
        totalCustomers,
        activeCustomers,
        inactiveCustomers: Math.max(totalCustomers - activeCustomers, 0),
        totalTeamMembers,
        totalSubscriptions,
        activePlans,
        totalMessages,
        messagesUsedThisMonth,
        monthlyRevenue,
        commissionEarned,
        walletBalance: req.auth.balance || 0,
      },
    });
  } catch (error) {
    console.error("RESELLER DASHBOARD ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
