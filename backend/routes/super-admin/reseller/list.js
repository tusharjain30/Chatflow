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

    let { page = "1", limit = "10", search = "", status } = req.validatedQuery;
    page = Number(page);
    limit = Number(limit);

    const where = {
      isDeleted: false,
      ...(status === "active"
        ? { isActive: true }
        : status === "suspended"
          ? { isActive: false }
          : {}),
      ...(search
        ? {
            OR: [
              { companyName: { contains: search, mode: "insensitive" } },
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const skip = (page - 1) * limit;

    const [resellers, total] = await Promise.all([
      prisma.reseller.findMany({
        where,
        include: {
          accounts: {
            where: {
              isDeleted: false,
            },
            include: {
              subscriptions: {
                where: { isActive: true },
                include: { plan: true },
                take: 1,
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.reseller.count({ where }),
    ]);

    const items = resellers.map((reseller) => {
      const accounts = reseller.accounts || [];
      const activeCustomers = accounts.filter((account) => account.isActive).length;
      const totalRevenue = accounts.reduce((sum, account) => {
        const planPrice = account.subscriptions?.[0]?.plan?.price || 0;
        return sum + planPrice;
      }, 0);

      return {
        id: reseller.id,
        companyName: reseller.companyName,
        firstName: reseller.firstName,
        lastName: reseller.lastName,
        email: reseller.email,
        phone: reseller.phone,
        commissionRate: reseller.commissionRate,
        balance: reseller.balance,
        isActive: reseller.isActive,
        createdAt: reseller.createdAt,
        stats: {
          totalCustomers: accounts.length,
          activeCustomers,
          suspendedCustomers: accounts.length - activeCustomers,
          monthlyRevenue: totalRevenue,
        },
      };
    });

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Reseller list fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        items,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.log("RESELLER LIST ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
