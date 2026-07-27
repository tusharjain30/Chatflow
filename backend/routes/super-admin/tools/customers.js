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

    let {
      search = "",
      resellerId,
      status,
      page = "1",
      limit = "20",
    } = req.validatedQuery;

    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;

    const where = {
      isDeleted: false,
      ...(resellerId ? { resellerId } : {}),
      ...(status === "active"
        ? { isActive: true }
        : status === "inactive"
          ? { isActive: false }
          : {}),
      ...(search
        ? {
            OR: [
              { companyName: { contains: search, mode: "insensitive" } },
              {
                reseller: {
                  companyName: { contains: search, mode: "insensitive" },
                },
              },
              {
                users: {
                  some: {
                    OR: [
                      { email: { contains: search, mode: "insensitive" } },
                      { phone: { contains: search, mode: "insensitive" } },
                      { firstName: { contains: search, mode: "insensitive" } },
                      { lastName: { contains: search, mode: "insensitive" } },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [accounts, total] = await Promise.all([
      prisma.customerAccount.findMany({
        where,
        include: {
          reseller: {
            select: {
              id: true,
              companyName: true,
            },
          },
          users: {
            where: {
              isDeleted: false,
            },
            include: {
              role: true,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
          subscriptions: {
            where: {
              isActive: true,
            },
            include: {
              plan: true,
            },
            orderBy: {
              startDate: "desc",
            },
            take: 1,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.customerAccount.count({ where }),
    ]);

    const items = accounts.map((account) => {
      const owner =
        account.users.find((user) => user.role?.roleType === "CUSTOMER_OWNER") ||
        account.users.find((user) => user.role?.roleType === "CUSTOMER_ADMIN") ||
        account.users[0] ||
        null;

      return {
        id: account.id,
        companyName: account.companyName,
        isActive: account.isActive,
        creditBalance: account.creditBalance,
        reseller: account.reseller,
        owner: owner
          ? {
              id: owner.id,
              firstName: owner.firstName,
              lastName: owner.lastName,
              email: owner.email,
              phone: owner.phone,
              isActive: owner.isActive,
              isVerified: owner.isVerified,
            }
          : null,
        subscription: account.subscriptions[0]
          ? {
              id: account.subscriptions[0].id,
              startDate: account.subscriptions[0].startDate,
              plan: account.subscriptions[0].plan
                ? {
                    id: account.subscriptions[0].plan.id,
                    name: account.subscriptions[0].plan.name,
                    maxTemplates: account.subscriptions[0].plan.maxTemplates,
                    maxBots: account.subscriptions[0].plan.maxBots,
                    monthlyMessageLimit:
                      account.subscriptions[0].plan.monthlyMessageLimit,
                  }
                : null,
            }
          : null,
      };
    });

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Customer accounts fetched successfully",
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
    console.log("SUPER ADMIN TOOLS CUSTOMERS ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
