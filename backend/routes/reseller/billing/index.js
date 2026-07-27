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
    const commissionRate = req.auth.commissionRate || 0;

    const [transactions, subscriptions, accounts] = await Promise.all([
      prisma.billingTransaction.findMany({
        where: {
          resellerId,
        },
        include: {
          account: {
            select: {
              id: true,
              companyName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 25,
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
              name: true,
              price: true,
              currency: true,
            },
          },
          account: {
            select: {
              id: true,
              companyName: true,
            },
          },
        },
        orderBy: { startDate: "desc" },
      }),
      prisma.customerAccount.findMany({
        where: {
          resellerId,
          isDeleted: false,
        },
        include: {
          subscriptions: {
            where: {
              isActive: true,
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
            },
            orderBy: { startDate: "desc" },
            take: 1,
          },
          billingTransactions: {
            where: {
              type: "RECHARGE",
            },
            select: {
              amount: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const rechargeHistory = transactions
      .filter((transaction) => transaction.type === "RECHARGE")
      .map((transaction) => ({
        id: transaction.id,
        companyName: transaction.account?.companyName || "General",
        amount: transaction.amount,
        currency: transaction.currency,
        description: transaction.description,
        reference: transaction.reference,
        createdAt: transaction.createdAt,
      }));

    const invoices = subscriptions.slice(0, 20).map((subscription) => {
      const invoiceAmount = subscription.plan.price;
      const profit = Number(
        ((invoiceAmount * commissionRate) / 100).toFixed(2),
      );

      return {
        id: subscription.id,
        invoiceNumber: `INV-${subscription.id.slice(0, 8).toUpperCase()}`,
        companyName: subscription.account.companyName,
        planName: subscription.plan.name,
        amount: invoiceAmount,
        currency: subscription.plan.currency,
        profit,
        issuedAt: subscription.startDate,
        status: subscription.isActive ? "PAID" : "ARCHIVED",
      };
    });

    const totalProfit = invoices.reduce((sum, invoice) => sum + invoice.profit, 0);
    const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
    const totalRecharge = rechargeHistory.reduce(
      (sum, transaction) => sum + transaction.amount,
      0,
    );
    const activeSubscriptions = accounts
      .map((account) => account.subscriptions[0])
      .filter(Boolean);
    const customerRevenue = accounts.map((account) => {
      const subscription = account.subscriptions[0] || null;
      const plan = subscription?.plan || null;
      const basePrice = plan?.price || 0;
      const profit = Number(((basePrice * commissionRate) / 100).toFixed(2));
      const resellerPrice = Number((basePrice + profit).toFixed(2));
      const totalRechargeForCustomer = account.billingTransactions.reduce(
        (sum, transaction) => sum + transaction.amount,
        0,
      );

      return {
        accountId: account.id,
        companyName: account.companyName,
        isActive: account.isActive,
        walletBalance: account.creditBalance,
        planName: plan?.name || "No active plan",
        basePrice,
        resellerPrice,
        profit,
        marginPercent: commissionRate,
        currency: plan?.currency || "INR",
        totalRecharge: totalRechargeForCustomer,
      };
    });
    const planPerformance = activeSubscriptions.reduce((acc, subscription) => {
      const plan = subscription.plan;
      const current = acc.get(plan.id) || {
        planId: plan.id,
        planName: plan.name,
        currency: plan.currency,
        customers: 0,
        revenue: 0,
        profit: 0,
      };

      current.customers += 1;
      current.revenue += plan.price;
      current.profit = Number(
        (current.profit + (plan.price * commissionRate) / 100).toFixed(2),
      );
      acc.set(plan.id, current);
      return acc;
    }, new Map());

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Billing and transactions loaded successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        summary: {
          walletBalance: req.auth.balance || 0,
          totalProfit,
          totalRevenue,
          totalRecharge,
          activeCustomers: accounts.filter((account) => account.isActive).length,
          averageRevenuePerCustomer: accounts.length
            ? Number((totalRevenue / accounts.length).toFixed(2))
            : 0,
          commissionRate,
        },
        rechargeHistory,
        invoices,
        customerRevenue,
        planPerformance: Array.from(planPerformance.values()).sort(
          (a, b) => b.revenue - a.revenue,
        ),
      },
    });
  } catch (error) {
    console.error("RESELLER BILLING ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
