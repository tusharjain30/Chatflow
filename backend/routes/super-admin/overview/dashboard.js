const express = require("express");
const net = require("net");

const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date) {
  return date.toLocaleString("en-US", { month: "short", year: "2-digit" });
}

function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

function buildMonthBuckets(count = 12) {
  const now = new Date();
  const buckets = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: monthKey(d),
      label: monthLabel(d),
      value: 0,
      revenue: 0,
      subscriptions: 0,
      cumulative: 0,
    });
  }
  return buckets;
}

function buildDayBuckets(count = 30) {
  const buckets = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    buckets.push({
      key: dayKey(d),
      label: d.toLocaleString("en-US", { month: "short", day: "numeric" }),
      value: 0,
      successful: 0,
      failed: 0,
    });
  }
  return buckets;
}

function checkRedis(timeoutMs = 1200) {
  const url = process.env.REDIS_URL || "redis://127.0.0.1:6379";
  let host = "127.0.0.1";
  let port = 6379;
  try {
    const parsed = new URL(url);
    host = parsed.hostname || host;
    port = Number(parsed.port || 6379);
  } catch {
    // defaults
  }

  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    let settled = false;
    const done = (ok, detail) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve({ ok, detail });
    };
    socket.setTimeout(timeoutMs);
    socket.on("connect", () => done(true, `${host}:${port}`));
    socket.on("timeout", () => done(false, "timeout"));
    socket.on("error", (err) => done(false, err.message));
  });
}

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

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const [
      totalTenants,
      activeTenants,
      trialTenants,
      suspendedTenants,
      inactiveTenants,
      totalUsers,
      totalWhatsAppNumbers,
      messageStatusGroups,
      outboundMessageCount,
      activeSubscriptions,
      pendingSubscriptions,
      recentTenants,
      recentSubscriptions,
      recentPayments,
      failedWhatsApp,
      suspendedAccounts,
      tenantRegistrations,
      messageVolumeRows,
      redisHealth,
      dbOk,
    ] = await Promise.all([
      prisma.customerAccount.count({ where: { isDeleted: false } }),
      prisma.customerAccount.count({
        where: {
          isDeleted: false,
          isActive: true,
          lifecycleStatus: { in: ["ACTIVE"] },
        },
      }),
      prisma.customerAccount.count({
        where: { isDeleted: false, lifecycleStatus: "TRIAL" },
      }),
      prisma.customerAccount.count({
        where: {
          isDeleted: false,
          OR: [{ lifecycleStatus: "SUSPENDED" }, { isActive: false }],
        },
      }),
      prisma.customerAccount.count({
        where: {
          isDeleted: false,
          OR: [{ isActive: false }, { lifecycleStatus: { in: ["PAUSED", "EXPIRED", "SUSPENDED"] } }],
        },
      }),
      prisma.user.count({ where: { isDeleted: false } }),
      prisma.whatsAppAccount.count(),
      prisma.messageLog.groupBy({
        by: ["status"],
        where: { direction: "OUTBOUND" },
        _count: true,
      }),
      prisma.messageLog.count({ where: { direction: "OUTBOUND" } }),
      prisma.subscription.findMany({
        where: { isActive: true },
        select: {
          id: true,
          startDate: true,
          plan: { select: { id: true, name: true, price: true, currency: true } },
          account: {
            select: {
              id: true,
              companyName: true,
            },
          },
        },
      }),
      prisma.subscription.findMany({
        where: { isActive: false },
        select: {
          id: true,
          startDate: true,
          endDate: true,
          plan: { select: { price: true, name: true, currency: true } },
          account: { select: { id: true, companyName: true } },
        },
        orderBy: { startDate: "desc" },
        take: 200,
      }),
      prisma.customerAccount.findMany({
        where: { isDeleted: false },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          companyName: true,
          lifecycleStatus: true,
          isActive: true,
          createdAt: true,
          reseller: { select: { companyName: true } },
        },
      }),
      prisma.subscription.findMany({
        orderBy: { startDate: "desc" },
        take: 8,
        select: {
          id: true,
          startDate: true,
          isActive: true,
          plan: { select: { name: true, price: true, currency: true } },
          account: { select: { companyName: true } },
        },
      }),
      prisma.billingTransaction.findMany({
        where: { type: "RECHARGE" },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          amount: true,
          currency: true,
          description: true,
          createdAt: true,
          reseller: { select: { companyName: true } },
          account: { select: { companyName: true } },
        },
      }),
      prisma.whatsAppAccount.findMany({
        where: {
          OR: [
            { status: { not: "ACTIVE" } },
            { isActive: false },
          ],
        },
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: {
          id: true,
          phoneNumber: true,
          displayName: true,
          status: true,
          isActive: true,
          updatedAt: true,
          account: { select: { companyName: true } },
        },
      }),
      prisma.customerAccount.findMany({
        where: {
          isDeleted: false,
          OR: [{ lifecycleStatus: "SUSPENDED" }, { isActive: false }],
        },
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: {
          id: true,
          companyName: true,
          lifecycleStatus: true,
          statusReason: true,
          updatedAt: true,
        },
      }),
      prisma.customerAccount.findMany({
        where: {
          isDeleted: false,
          createdAt: { gte: twelveMonthsAgo },
        },
        select: { createdAt: true },
      }),
      prisma.messageLog.findMany({
        where: {
          direction: "OUTBOUND",
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { createdAt: true, status: true },
      }),
      checkRedis(),
      prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
    ]);

    const messageStats = {
      totalSent: outboundMessageCount,
      successful: 0,
      failed: 0,
      pending: 0,
      delivered: 0,
      read: 0,
      sent: 0,
    };
    messageStatusGroups.forEach((row) => {
      const count = row._count || 0;
      const status = String(row.status || "").toUpperCase();
      if (status === "FAILED") messageStats.failed += count;
      else if (status === "PENDING") messageStats.pending += count;
      else if (["SENT", "DELIVERED", "READ"].includes(status)) {
        messageStats.successful += count;
        if (status === "SENT") messageStats.sent += count;
        if (status === "DELIVERED") messageStats.delivered += count;
        if (status === "READ") messageStats.read += count;
      }
    });

    const mrr = activeSubscriptions.reduce(
      (sum, sub) => sum + Number(sub.plan?.price || 0),
      0,
    );
    const arr = mrr * 12;
    const pendingPaymentsAmount = pendingSubscriptions.reduce(
      (sum, sub) => sum + Number(sub.plan?.price || 0),
      0,
    );

    const planDistributionMap = new Map();
    activeSubscriptions.forEach((sub) => {
      const name = sub.plan?.name || "Unknown";
      const current = planDistributionMap.get(name) || {
        plan: name,
        count: 0,
        revenue: 0,
      };
      current.count += 1;
      current.revenue += Number(sub.plan?.price || 0);
      planDistributionMap.set(name, current);
    });

    const tenantRegistrationBuckets = buildMonthBuckets(12);
    tenantRegistrations.forEach((row) => {
      const key = monthKey(new Date(row.createdAt));
      const bucket = tenantRegistrationBuckets.find((b) => b.key === key);
      if (bucket) bucket.value += 1;
    });

    let running = Math.max(
      0,
      totalTenants -
        tenantRegistrationBuckets.reduce((sum, b) => sum + b.value, 0),
    );
    const tenantGrowth = tenantRegistrationBuckets.map((bucket) => {
      running += bucket.value;
      return {
        label: bucket.label,
        registrations: bucket.value,
        cumulative: running,
      };
    });

    const revenueBuckets = buildMonthBuckets(12);
    activeSubscriptions.forEach((sub) => {
      if (!sub.startDate) return;
      const key = monthKey(new Date(sub.startDate));
      const bucket = revenueBuckets.find((b) => b.key === key);
      if (bucket) {
        bucket.revenue += Number(sub.plan?.price || 0);
        bucket.subscriptions += 1;
      }
    });

    const dailyMessageBuckets = buildDayBuckets(30);
    messageVolumeRows.forEach((row) => {
      const key = dayKey(new Date(row.createdAt));
      const bucket = dailyMessageBuckets.find((b) => b.key === key);
      if (!bucket) return;
      bucket.value += 1;
      const status = String(row.status || "").toUpperCase();
      if (status === "FAILED") bucket.failed += 1;
      else if (["SENT", "DELIVERED", "READ"].includes(status)) {
        bucket.successful += 1;
      }
    });

    // Weekly rollup from daily (last ~8 weeks)
    const weeklyMap = new Map();
    dailyMessageBuckets.forEach((day) => {
      const d = new Date(day.key);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = dayKey(weekStart);
      const current = weeklyMap.get(key) || {
        label: `Week of ${weekStart.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
        })}`,
        value: 0,
        successful: 0,
        failed: 0,
      };
      current.value += day.value;
      current.successful += day.successful;
      current.failed += day.failed;
      weeklyMap.set(key, current);
    });

    const monthlyMessageBuckets = buildMonthBuckets(12);
    // Approximate monthly from all outbound status groups isn't date-scoped;
    // use daily totals projected + subscription-era message rows we have.
    // Fill monthly from daily where possible + zero elsewhere.
    dailyMessageBuckets.forEach((day) => {
      const key = monthKey(new Date(day.key));
      const bucket = monthlyMessageBuckets.find((b) => b.key === key);
      if (bucket) bucket.value += day.value;
    });

    const systemAlerts = [];
    if (!dbOk) {
      systemAlerts.push({
        id: "db-down",
        severity: "critical",
        title: "Database unreachable",
        detail: "PostgreSQL health check failed",
        createdAt: new Date().toISOString(),
      });
    }
    if (!redisHealth.ok) {
      systemAlerts.push({
        id: "redis-down",
        severity: "warning",
        title: "Redis unavailable",
        detail: `Queues/realtime deferred (${redisHealth.detail})`,
        createdAt: new Date().toISOString(),
      });
    }
    if (messageStats.failed > 0) {
      systemAlerts.push({
        id: "failed-messages",
        severity: "warning",
        title: "Failed WhatsApp messages",
        detail: `${messageStats.failed.toLocaleString()} outbound messages failed`,
        createdAt: new Date().toISOString(),
      });
    }
    if (suspendedTenants > 0) {
      systemAlerts.push({
        id: "suspended-tenants",
        severity: "info",
        title: "Suspended tenants",
        detail: `${suspendedTenants} tenant accounts are suspended/inactive`,
        createdAt: new Date().toISOString(),
      });
    }
    if (failedWhatsApp.length > 0) {
      systemAlerts.push({
        id: "whatsapp-integrations",
        severity: "warning",
        title: "WhatsApp integration issues",
        detail: `${failedWhatsApp.length} connected numbers need attention`,
        createdAt: new Date().toISOString(),
      });
    }

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Dashboard overview fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        kpis: {
          totalTenants,
          activeTenants,
          trialTenants,
          suspendedTenants,
          totalUsers,
          totalWhatsAppNumbers,
          totalMessagesSent: messageStats.totalSent,
          successfulMessages: messageStats.successful,
          failedMessages: messageStats.failed,
          mrr: Number(mrr.toFixed(2)),
          arr: Number(arr.toFixed(2)),
          pendingPayments: Number(pendingPaymentsAmount.toFixed(2)),
          pendingPaymentCount: pendingSubscriptions.length,
          currency: "INR",
        },
        charts: {
          newTenantRegistrations: tenantRegistrationBuckets.map((b) => ({
            label: b.label,
            value: b.value,
          })),
          monthlyRevenueGrowth: revenueBuckets.map((b) => ({
            label: b.label,
            revenue: Number(b.revenue.toFixed(2)),
            subscriptions: b.subscriptions,
          })),
          subscriptionDistribution: Array.from(planDistributionMap.values()),
          messageVolume: {
            daily: dailyMessageBuckets.map(({ label, value, successful, failed }) => ({
              label,
              value,
              successful,
              failed,
            })),
            weekly: Array.from(weeklyMap.values()),
            monthly: monthlyMessageBuckets.map((b) => ({
              label: b.label,
              value: b.value,
            })),
          },
          messageDeliveryVsFailure: [
            { label: "Successful", value: messageStats.successful },
            { label: "Failed", value: messageStats.failed },
            { label: "Pending", value: messageStats.pending },
          ],
          tenantGrowth,
          activeVsInactiveTenants: [
            { label: "Active", value: activeTenants },
            {
              label: "Inactive",
              value: Math.max(inactiveTenants, totalTenants - activeTenants),
            },
          ],
        },
        recentActivity: {
          latestTenants: recentTenants.map((item) => ({
            id: item.id,
            companyName: item.companyName,
            status: item.lifecycleStatus,
            isActive: item.isActive,
            resellerName: item.reseller?.companyName || null,
            createdAt: item.createdAt,
          })),
          latestSubscriptions: recentSubscriptions.map((item) => ({
            id: item.id,
            companyName: item.account?.companyName || "Unknown",
            planName: item.plan?.name || "Unknown",
            amount: item.plan?.price || 0,
            currency: item.plan?.currency || "INR",
            isActive: item.isActive,
            purchasedAt: item.startDate,
          })),
          recentPayments: recentPayments.map((item) => ({
            id: item.id,
            amount: item.amount,
            currency: item.currency,
            description: item.description,
            party:
              item.account?.companyName ||
              item.reseller?.companyName ||
              "Unknown",
            createdAt: item.createdAt,
          })),
          failedWhatsAppIntegrations: failedWhatsApp.map((item) => ({
            id: item.id,
            phoneNumber: item.phoneNumber,
            displayName: item.displayName,
            status: item.status,
            isActive: item.isActive,
            companyName: item.account?.companyName || "Unknown",
            updatedAt: item.updatedAt,
          })),
          suspendedAccounts: suspendedAccounts.map((item) => ({
            id: item.id,
            companyName: item.companyName,
            status: item.lifecycleStatus,
            reason: item.statusReason,
            updatedAt: item.updatedAt,
          })),
          systemAlerts,
        },
      },
    });
  } catch (error) {
    console.log("OVERVIEW DASHBOARD ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
