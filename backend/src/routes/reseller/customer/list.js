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

    const {
      page = 1,
      limit = 10,
      search,
      isActive,
      status,
      planId,
      revenueMin,
      revenueMax,
      usageMin,
      usageMax,
    } = req.validatedQuery;
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const where = {
      resellerId: req.auth.resellerId,
      isDeleted: false,
      ...(typeof isActive === "boolean" ? { isActive } : {}),
      ...(search
        ? {
            OR: [
              { companyName: { contains: search, mode: "insensitive" } },
              {
                users: {
                  some: {
                    isDeleted: false,
                    OR: [
                      { firstName: { contains: search, mode: "insensitive" } },
                      { lastName: { contains: search, mode: "insensitive" } },
                      { email: { contains: search, mode: "insensitive" } },
                      { phone: { contains: search } },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.customerAccount.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          users: {
            where: { isDeleted: false },
            orderBy: { createdAt: "asc" },
            take: 1,
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              isActive: true,
            },
          },
          subscriptions: {
            where: {
              ...(planId ? { planId } : {}),
            },
            include: {
              plan: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  currency: true,
                  monthlyMessageLimit: true,
                },
              },
            },
            take: 5,
            orderBy: { startDate: "desc" },
          },
          _count: {
            select: {
              users: {
                where: { isDeleted: false },
              },
              contacts: {
                where: { isDeleted: false },
              },
              campaigns: true,
            },
          },
        },
      }),
      prisma.customerAccount.count({ where }),
    ]);

    const accountIds = items.map((account) => account.id);
    const usageRows = accountIds.length
      ? await prisma.messageLog.groupBy({
          by: ["accountId"],
          where: {
            accountId: { in: accountIds },
            createdAt: {
              gte: monthStart,
            },
          },
          _count: {
            _all: true,
          },
        })
      : [];

    const recentMessageRows = accountIds.length
      ? await prisma.messageLog.groupBy({
          by: ["accountId"],
          where: {
            accountId: { in: accountIds },
            createdAt: {
              gte: last7Days,
            },
          },
          _count: {
            _all: true,
          },
        })
      : [];

    const campaignRows = accountIds.length
      ? await prisma.campaign.findMany({
          where: {
            accountId: { in: accountIds },
            isDeleted: false,
          },
          select: {
            accountId: true,
            sentCount: true,
            deliveredCount: true,
            failedCount: true,
            updatedAt: true,
          },
        })
      : [];

    const latestMessageRows = accountIds.length
      ? await prisma.messageLog.findMany({
          where: {
            accountId: { in: accountIds },
          },
          orderBy: {
            createdAt: "desc",
          },
          select: {
            accountId: true,
            createdAt: true,
          },
        })
      : [];

    const usageByAccountId = new Map(
      usageRows.map((row) => [row.accountId, row._count._all]),
    );
    const recentMessagesByAccountId = new Map(
      recentMessageRows.map((row) => [row.accountId, row._count._all]),
    );
    const campaignMetricsByAccountId = new Map();
    const latestMessageByAccountId = new Map();

    campaignRows.forEach((campaign) => {
      const current = campaignMetricsByAccountId.get(campaign.accountId) || {
        sentCount: 0,
        deliveredCount: 0,
        failedCount: 0,
        updatedAt: null,
      };

      current.sentCount += campaign.sentCount || 0;
      current.deliveredCount += campaign.deliveredCount || 0;
      current.failedCount += campaign.failedCount || 0;
      if (!current.updatedAt || campaign.updatedAt > current.updatedAt) {
        current.updatedAt = campaign.updatedAt;
      }

      campaignMetricsByAccountId.set(campaign.accountId, current);
    });

    latestMessageRows.forEach((message) => {
      if (!latestMessageByAccountId.has(message.accountId)) {
        latestMessageByAccountId.set(message.accountId, message.createdAt);
      }
    });

    const commissionRate = req.auth.commissionRate || 0;

    const enrichedItems = items
      .map((account) => {
        const latestSubscription = account.subscriptions[0] || null;
        const pricing = latestSubscription?.plan
          ? {
              basePrice: latestSubscription.plan.price,
              resellerPrice: Number(
                (
                  latestSubscription.plan.price +
                  (latestSubscription.plan.price * commissionRate) / 100
                ).toFixed(2),
              ),
              profit: Number(
                ((latestSubscription.plan.price * commissionRate) / 100).toFixed(2),
              ),
              currency: latestSubscription.plan.currency,
            }
          : null;
        const usage = latestSubscription?.plan
          ? (() => {
              const used = usageByAccountId.get(account.id) || 0;
              const limitValue = latestSubscription.plan.monthlyMessageLimit || 0;
              const percentage = limitValue
                ? Math.min(100, Math.round((used / limitValue) * 100))
                : 0;

              return {
                used,
                limit: limitValue,
                percentage,
              };
            })()
          : null;
        const subscriptionExpiryDate = latestSubscription
          ? latestSubscription.endDate ||
            new Date(
              new Date(latestSubscription.startDate).getTime() +
                30 * 24 * 60 * 60 * 1000,
            )
          : null;
        const isExpired = subscriptionExpiryDate
          ? new Date(subscriptionExpiryDate) < new Date()
          : false;
        const campaignMetrics = campaignMetricsByAccountId.get(account.id) || {
          sentCount: 0,
          deliveredCount: 0,
          failedCount: 0,
          updatedAt: null,
        };
        const campaignBase =
          campaignMetrics.sentCount + campaignMetrics.failedCount;
        const campaignSuccessRate = campaignBase
          ? Math.round((campaignMetrics.deliveredCount / campaignBase) * 100)
          : 0;
        const lastActivityCandidates = [
          latestMessageByAccountId.get(account.id) || null,
          campaignMetrics.updatedAt,
          account.updatedAt,
          account.createdAt,
        ].filter(Boolean);
        const lastActivity =
          lastActivityCandidates.sort((a, b) => b.getTime() - a.getTime())[0] ||
          null;

        return {
          id: account.id,
          companyName: account.companyName,
          isActive: account.isActive,
          creditBalance: account.creditBalance,
          createdAt: account.createdAt,
          owner: account.users[0] || null,
          subscription: latestSubscription,
          pricing,
          usage,
          metrics: {
            messagesSentLast7Days: recentMessagesByAccountId.get(account.id) || 0,
            campaignSuccessRate,
            lastActivity,
          },
          subscriptionExpiryDate,
          counts: account._count,
          computedStatus: isExpired
            ? "expired"
            : account.isActive
              ? "active"
              : "paused",
        };
      })
      .filter((account) => {
        if (status && account.computedStatus !== status) {
          return false;
        }

        if (planId && account.subscription?.planId !== planId) {
          return false;
        }

        if (
          typeof revenueMin === "number" &&
          (account.pricing?.resellerPrice || 0) < revenueMin
        ) {
          return false;
        }

        if (
          typeof revenueMax === "number" &&
          (account.pricing?.resellerPrice || 0) > revenueMax
        ) {
          return false;
        }

        if (
          typeof usageMin === "number" &&
          (account.usage?.percentage || 0) < usageMin
        ) {
          return false;
        }

        if (
          typeof usageMax === "number" &&
          (account.usage?.percentage || 0) > usageMax
        ) {
          return false;
        }

        return true;
      });

    const paginatedItems = enrichedItems.slice((page - 1) * limit, page * limit);
    const filteredTotal = enrichedItems.length;

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Reseller customers fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        items: paginatedItems,
        pagination: {
          total: filteredTotal,
          page,
          limit,
          totalPages: Math.ceil(filteredTotal / limit) || 1,
        },
      },
    });
  } catch (error) {
    console.error("RESELLER CUSTOMER LIST ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
