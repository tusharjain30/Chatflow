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

    const { resellerId } = req.validatedQuery;

    if (resellerId) {
      const reseller = await prisma.reseller.findFirst({
        where: {
          id: resellerId,
          isDeleted: false,
        },
        include: {
          accounts: {
            where: { isDeleted: false },
            include: {
              subscriptions: {
                where: { isActive: true },
                include: { plan: true },
                take: 1,
              },
              users: {
                where: { isDeleted: false },
              },
            },
          },
        },
      });

      if (!reseller) {
        return res.status(RESPONSE_CODES.NOT_FOUND).json({
          status: 0,
          message: "Reseller not found",
          statusCode: RESPONSE_CODES.NOT_FOUND,
          data: {},
        });
      }

      const activeCustomers = reseller.accounts.filter((account) => account.isActive)
        .length;
      const usersManaged = reseller.accounts.reduce(
        (sum, account) => sum + (account.users?.length || 0),
        0,
      );
      const monthlyRevenue = reseller.accounts.reduce((sum, account) => {
        const planPrice = account.subscriptions?.[0]?.plan?.price || 0;
        return sum + planPrice;
      }, 0);

      return res.status(RESPONSE_CODES.GET).json({
        status: 1,
        message: "Reseller stats fetched successfully",
        statusCode: RESPONSE_CODES.GET,
        data: {
          reseller: {
            id: reseller.id,
            companyName: reseller.companyName,
            commissionRate: reseller.commissionRate,
            balance: reseller.balance,
            isActive: reseller.isActive,
          },
          stats: {
            totalCustomers: reseller.accounts.length,
            activeCustomers,
            suspendedCustomers: reseller.accounts.length - activeCustomers,
            managedUsers: usersManaged,
            monthlyRevenue,
          },
        },
      });
    }

    const resellers = await prisma.reseller.findMany({
      where: { isDeleted: false },
      include: {
        accounts: {
          where: { isDeleted: false },
        },
      },
    });

    const activeResellers = resellers.filter((item) => item.isActive).length;
    const managedCustomers = resellers.reduce(
      (sum, reseller) => sum + reseller.accounts.length,
      0,
    );
    const averageCommissionRate =
      resellers.length > 0
        ? Number(
            (
              resellers.reduce(
                (sum, reseller) => sum + reseller.commissionRate,
                0,
              ) / resellers.length
            ).toFixed(2),
          )
        : 0;

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Reseller overview stats fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        totalResellers: resellers.length,
        activeResellers,
        suspendedResellers: resellers.length - activeResellers,
        managedCustomers,
        averageCommissionRate,
      },
    });
  } catch (error) {
    console.log("RESELLER STATS ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
