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

    // 🔥 PAGINATION
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const skip = (page - 1) * limit;

    // 🔥 SEARCH FILTER
    const where = {
      isDeleted: false,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [plans, total] = await Promise.all([
      prisma.plan.findMany({
        where,
        orderBy: [{ isActive: "desc" }, { price: "asc" }, { name: "asc" }],
        skip,
        take: limit,
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
      }),

      prisma.plan.count({ where }),
    ]);

    // 🔥 FORMAT RESPONSE
    const formatted = plans.map((plan) => {
      const activeSubs = plan.subscriptions.filter((s) => s.isActive);

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
          monthlyRevenue: activeSubs.length * plan.price,
        },

        customers: activeSubs.slice(0, 5).map((s) => s.account),
      };
    });

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Reseller plans loaded successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        list: formatted,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
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

