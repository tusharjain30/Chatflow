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

    const accountId = req.query.accountId;

    if (!accountId) {
      return res.status(400).json({
        status: 0,
        message: "accountId is required",
      });
    }

    // 🔥 PAGINATION + SEARCH
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const skip = (page - 1) * limit;

    // ✅ Validate account
    const account = await prisma.customerAccount.findFirst({
      where: {
        id: accountId,
        resellerId: req.auth.resellerId,
        isDeleted: false,
      },
      select: { id: true, companyName: true },
    });

    if (!account) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Customer account not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    // 🔥 WHERE FILTER
    const where = {
      accountId,
      ...(search && {
        plan: {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
      }),
    };

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        include: {
          plan: {
            select: {
              name: true,
              price: true,
              currency: true,
            },
          },
        },
        orderBy: [
          { isActive: "desc" }, // 🔥 important
          { startDate: "desc" },
        ],
        skip,
        take: limit,
      }),

      prisma.subscription.count({ where }),
    ]);

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Customer subscriptions fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        list: subscriptions.map((s) => ({
          id: s.id,
          planName: s.plan.name,
          amount: s.plan.price,
          currency: s.plan.currency,
          isActive: s.isActive,
          startDate: s.startDate,
          endDate: s.endDate,
          status: s.isActive ? "ACTIVE" : "EXPIRED",
        })),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("CUSTOMER SUBSCRIPTIONS ERROR:", error);

    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
