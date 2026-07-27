const express = require("express");

const RESPONSE_CODES = require("../../../config/responseCode");
const requireAuth = require("../../../middleware/requireAuth");
const { PrismaClient } = require("../../../generated/prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const resellerId = req.auth.resellerId;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const skip = (page - 1) * limit;

    const where = {
      account: {
        resellerId,
        isDeleted: false,
        ...(search && {
          companyName: {
            contains: search,
            mode: "insensitive",
          },
        }),
      },
    };

    const [plans, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        include: {
          plan: { select: { name: true, price: true, currency: true } },
          account: { select: { companyName: true } },
        },
        orderBy: { startDate: "desc" },
        skip,
        take: limit,
      }),

      prisma.subscription.count({ where }),
    ]);

    return res.json({
      status: 1,
      data: {
        list: plans.map((p) => ({
          id: p.id,

          // ✅ AUDIT FIELDS
          type: "plan",

          title: p.isActive
            ? "Plan Activated"
            : "Plan Updated",

          description: `${p.plan.name} plan assigned to ${p.account.companyName}`,

          companyName: p.account.companyName,

          amount: p.plan.price,
          currency: p.plan.currency,

          createdAt: p.startDate,
        })),

        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    console.error("PLAN AUDIT ERROR:", err);
    res.status(500).json({
      status: 0,
      message: "Internal server error",
    });
  }
});

module.exports = router;
