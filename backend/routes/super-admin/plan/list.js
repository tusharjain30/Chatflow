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

    const { search = "", status = "all" } = req.validatedQuery;

    const where = {
      isDeleted: false,
      ...(status === "active"
        ? { isActive: true }
        : status === "inactive"
          ? { isActive: false }
          : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const plans = await prisma.plan.findMany({
      where,
      include: {
        subscriptions: {
          where: {
            account: {
              isDeleted: false,
            },
          },
          include: {
            account: {
              select: {
                id: true,
                companyName: true,
                isActive: true,
                reseller: {
                  select: {
                    id: true,
                    companyName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ isActive: "desc" }, { price: "asc" }, { name: "asc" }],
    });

    const items = plans.map((plan) => {
      const activeSubscriptions = plan.subscriptions.filter((subscription) => subscription.isActive);
      const activeAccounts = activeSubscriptions.filter((subscription) => subscription.account?.isActive);

      return {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        currency: plan.currency,
        maxTemplates: plan.maxTemplates,
        maxBots: plan.maxBots,
        monthlyMessageLimit: plan.monthlyMessageLimit,
        isActive: plan.isActive,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
        stats: {
          totalSubscribers: plan.subscriptions.length,
          activeSubscribers: activeSubscriptions.length,
          activeAccounts: activeAccounts.length,
          monthlyRevenue: activeSubscriptions.length * plan.price,
        },
      };
    });

    const overview = {
      totalPlans: items.length,
      activePlans: items.filter((item) => item.isActive).length,
      inactivePlans: items.filter((item) => !item.isActive).length,
      totalSubscribers: items.reduce((sum, item) => sum + item.stats.activeSubscribers, 0),
      monthlyRevenue: items.reduce((sum, item) => sum + item.stats.monthlyRevenue, 0),
    };

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Plans loaded successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        overview,
        items,
      },
    });
  } catch (error) {
    console.log("SUPER ADMIN PLAN LIST ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
