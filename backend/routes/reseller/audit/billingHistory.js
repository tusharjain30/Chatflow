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
      resellerId,
      ...(search && {
        account: {
          companyName: {
            contains: search,
            mode: "insensitive",
          },
        },
      }),
    };

    const [billing, total] = await Promise.all([
      prisma.billingTransaction.findMany({
        where,
        include: {
          account: { select: { companyName: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),

      prisma.billingTransaction.count({ where }),
    ]);

    return res.json({
      status: 1,
      data: {
        list: billing.map((b) => {
          let title = "Transaction";
          let description = b.description || "";

          // ✅ smarter event mapping
          if (b.type === "RECHARGE") {
            title = "Wallet Recharged";
            description = `₹${b.amount} added to ${
              b.account?.companyName || "account"
            }`;
          } else if (b.type === "DEBIT") {
            title = "Amount Deducted";
            description = `₹${b.amount} deducted from ${
              b.account?.companyName || "account"
            }`;
          } else if (b.type === "PLAN_PURCHASE") {
            title = "Plan Purchased";
            description = `₹${b.amount} used for plan purchase`;
          }

          return {
            id: b.id,

            // ✅ AUDIT FIELDS
            type: "billing",
            title,
            description,

            // UI helper fields
            companyName: b.account?.companyName || "General",
            amount: b.amount,
            currency: b.currency,

            createdAt: b.createdAt,
          };
        }),

        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 0 });
  }
});

module.exports = router;
