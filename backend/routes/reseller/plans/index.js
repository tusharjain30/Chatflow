const express = require("express");

const RESPONSE_CODES = require("../../../config/responseCode");
const requireAuth = require("../../../middleware/requireAuth");
const { PrismaClient } = require("../../../generated/prisma/client");

const prisma = new PrismaClient();
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
    const plans = await prisma.plan.findMany({
      where: {
        isDeleted: false,
      },
      orderBy: [{ isActive: "desc" }, { price: "asc" }, { name: "asc" }],
      include: {
        subscriptions: {
          where: {
            account: {
              resellerId,
              isDeleted: false,
            },
          },
          include: {
            account: {
              select: {
                id: true,
                companyName: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Reseller plans loaded successfully",
      statusCode: RESPONSE_CODES.GET,
      data: plans.map((plan) => {
        const activeSubs = plan.subscriptions.filter((subscription) => subscription.isActive);
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
          stats: {
            totalCustomers: plan.subscriptions.length,
            activeCustomers: activeSubs.length,
            monthlyRevenue: activeSubs.reduce(
              (sum, subscription) => sum + plan.price,
              0,
            ),
          },
          customers: activeSubs.slice(0, 5).map((subscription) => subscription.account),
        };
      }),
    });
  } catch (error) {
    console.error("RESELLER PLANS ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
