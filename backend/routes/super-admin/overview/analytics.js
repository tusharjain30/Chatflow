const express = require("express");

const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    if (req.admin.role?.roleType !== "SYSTEM_ADMIN") {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        status: 0,
        message: "Access denied",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    const [
      totalResellers,
      activeResellers,
      totalAccounts,
      activeAccounts,
      totalUsers,
      activePlans,
      activeSubscriptions,
      messageLogs,
      campaigns,
    ] = await Promise.all([
      prisma.reseller.count({ where: { isDeleted: false } }),
      prisma.reseller.count({ where: { isDeleted: false, isActive: true } }),
      prisma.customerAccount.count({ where: { isDeleted: false } }),
      prisma.customerAccount.count({
        where: { isDeleted: false, isActive: true },
      }),
      prisma.user.count({ where: { isDeleted: false } }),
      prisma.plan.count({ where: { isDeleted: false, isActive: true } }),
      prisma.subscription.findMany({
        where: { isActive: true },
        select: {
          startDate: true,
          plan: { select: { price: true } },
          account: {
            select: {
              reseller: { select: { commissionRate: true } },
            },
          },
        },
        orderBy: { startDate: "desc" },
        take: 500,
      }),
      prisma.messageLog.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.campaign.groupBy({
        by: ["status"],
        where: { isDeleted: false },
        _count: true,
      }),
    ]);

    const monthlyRevenue = activeSubscriptions.reduce(
      (sum, sub) => sum + Number(sub.plan?.price || 0),
      0,
    );
    const commissionPaid = activeSubscriptions.reduce((sum, sub) => {
      const price = Number(sub.plan?.price || 0);
      const rate = Number(sub.account?.reseller?.commissionRate || 0);
      return sum + (price * rate) / 100;
    }, 0);

    const messageStats = {
      total: 0,
      sent: 0,
      delivered: 0,
      failed: 0,
      pending: 0,
      read: 0,
    };
    messageLogs.forEach((row) => {
      const count = row._count || 0;
      messageStats.total += count;
      const key = String(row.status || "").toLowerCase();
      if (key in messageStats) messageStats[key] += count;
    });

    const campaignStats = {
      total: 0,
      running: 0,
      completed: 0,
      failed: 0,
      paused: 0,
      draft: 0,
      scheduled: 0,
      cancelled: 0,
    };
    campaigns.forEach((row) => {
      const count = row._count || 0;
      campaignStats.total += count;
      const key = String(row.status || "").toLowerCase();
      if (key in campaignStats) campaignStats[key] += count;
    });

    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleString("en-US", { month: "short", year: "2-digit" }),
        revenue: 0,
        subscriptions: 0,
      });
    }
    activeSubscriptions.forEach((sub) => {
      if (!sub.startDate) return;
      const d = new Date(sub.startDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const bucket = months.find((m) => m.key === key);
      if (bucket) {
        bucket.revenue += Number(sub.plan?.price || 0);
        bucket.subscriptions += 1;
      }
    });

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Analytics fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        summary: {
          totalResellers,
          activeResellers,
          suspendedResellers: totalResellers - activeResellers,
          totalAccounts,
          activeAccounts,
          totalUsers,
          activePlans,
          monthlyRevenue: Number(monthlyRevenue.toFixed(2)),
          commissionPaid: Number(commissionPaid.toFixed(2)),
        },
        messages: messageStats,
        campaigns: campaignStats,
        revenueTrend: months.map(({ label, revenue, subscriptions }) => ({
          label,
          revenue: Number(revenue.toFixed(2)),
          subscriptions,
        })),
      },
    });
  } catch (error) {
    console.log("OVERVIEW ANALYTICS ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
