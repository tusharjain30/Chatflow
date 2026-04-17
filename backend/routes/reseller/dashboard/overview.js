const express = require("express");

const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");

const prisma = new PrismaClient();
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

    const [recentCustomers, subscriptions, plans, recentMessages] = await Promise.all([
      prisma.customerAccount.findMany({
        where: {
          resellerId,
          isDeleted: false,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          users: {
            where: { isDeleted: false },
            orderBy: { createdAt: "asc" },
            take: 1,
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          subscriptions: {
            where: { isActive: true },
            include: {
              plan: {
                select: {
                  name: true,
                  price: true,
                  currency: true,
                },
              },
            },
            take: 1,
            orderBy: { startDate: "desc" },
          },
          _count: {
            select: {
              contacts: {
                where: { isDeleted: false },
              },
              campaigns: true,
            },
          },
        },
      }),
      prisma.subscription.findMany({
        where: {
          account: {
            resellerId,
            isDeleted: false,
          },
        },
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              price: true,
              currency: true,
            },
          },
          account: {
            select: {
              id: true,
              companyName: true,
              isActive: true,
            },
          },
        },
        orderBy: { startDate: "desc" },
      }),
      prisma.plan.findMany({
        where: {
          isDeleted: false,
          isActive: true,
        },
        orderBy: [{ price: "asc" }, { name: "asc" }],
      }),
      prisma.messageLog.findMany({
        where: {
          account: {
            resellerId,
            isDeleted: false,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          to: true,
          status: true,
          createdAt: true,
          direction: true,
          templateName: true,
          messageText: true,
          account: {
            select: {
              companyName: true,
            },
          },
        },
      }),
    ]);

    const planMap = new Map(
      plans.map((plan) => [
        plan.id,
        {
          id: plan.id,
          name: plan.name,
          price: plan.price,
          currency: plan.currency,
          customers: 0,
          revenue: 0,
        },
      ]),
    );

    const monthMap = new Map();
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date();
      date.setUTCDate(1);
      date.setUTCHours(0, 0, 0, 0);
      date.setUTCMonth(date.getUTCMonth() - i);
      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
      monthMap.set(key, {
        month: date.toLocaleString("en-US", {
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        }),
        revenue: 0,
        commission: 0,
      });
    }

    const recentSubscriptions = subscriptions.slice(0, 6).map((subscription) => ({
      id: subscription.id,
      companyName: subscription.account.companyName,
      planName: subscription.plan.name,
      amount: subscription.plan.price,
      currency: subscription.plan.currency,
      isActive: subscription.isActive,
      startDate: subscription.startDate,
    }));

    subscriptions.forEach((subscription) => {
      const current = planMap.get(subscription.planId);
      if (current) {
        current.customers += 1;
        current.revenue += subscription.isActive ? subscription.plan.price : 0;
      }

      const monthKey = `${subscription.startDate.getUTCFullYear()}-${String(subscription.startDate.getUTCMonth() + 1).padStart(2, "0")}`;
      const existingMonth = monthMap.get(monthKey);
      if (existingMonth) {
        existingMonth.revenue += subscription.plan.price;
        existingMonth.commission += Number(
          ((subscription.plan.price * (req.auth.commissionRate || 0)) / 100).toFixed(2),
        );
      }
    });

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Reseller overview loaded successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        recentCustomers: recentCustomers.map((account) => ({
          id: account.id,
          companyName: account.companyName,
          isActive: account.isActive,
          createdAt: account.createdAt,
          owner: account.users[0] || null,
          subscription: account.subscriptions[0] || null,
          counts: account._count,
        })),
        revenueByPlan: Array.from(planMap.values()),
        revenueTrend: Array.from(monthMap.values()),
        recentSubscriptions,
        recentMessages,
      },
    });
  } catch (error) {
    console.error("RESELLER OVERVIEW ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
