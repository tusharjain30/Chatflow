const express = require("express");
const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const { mapTenantListItem, requireSystemAdmin } = require("./_helpers");

const prisma = new PrismaClient();
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    if (!requireSystemAdmin(req, res, RESPONSE_CODES)) return;

    let {
      search = "",
      status = "all",
      planId,
      resellerId,
      page = "1",
      limit = "20",
    } = req.validatedQuery || req.query;

    page = Number(page) || 1;
    limit = Math.min(Number(limit) || 20, 100);
    const skip = (page - 1) * limit;

    const archivedClause = {
      isDeleted: false,
      OR: [
        { lifecycleStatus: "EXPIRED" },
        { statusReason: "ARCHIVED" },
        { statusReason: { startsWith: "ARCHIVED" } },
      ],
    };

    const notArchivedClause = {
      isDeleted: false,
      NOT: {
        OR: [
          { lifecycleStatus: "EXPIRED" },
          { statusReason: "ARCHIVED" },
          { statusReason: { startsWith: "ARCHIVED" } },
        ],
      },
    };

    const where = {
      ...(status === "archived" ? archivedClause : notArchivedClause),
      ...(resellerId ? { resellerId } : {}),
      ...(status === "active"
        ? { isActive: true, lifecycleStatus: "ACTIVE" }
        : status === "suspended"
          ? {
              OR: [{ isActive: false }, { lifecycleStatus: "SUSPENDED" }],
            }
          : status === "trial"
            ? { lifecycleStatus: "TRIAL" }
            : status === "inactive"
              ? { isActive: false }
              : {}),
      ...(search
        ? {
            OR: [
              { companyName: { contains: search, mode: "insensitive" } },
              {
                users: {
                  some: {
                    OR: [
                      { email: { contains: search, mode: "insensitive" } },
                      { firstName: { contains: search, mode: "insensitive" } },
                      { lastName: { contains: search, mode: "insensitive" } },
                      { phone: { contains: search, mode: "insensitive" } },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
      ...(planId
        ? {
            subscriptions: {
              some: { isActive: true, planId },
            },
          }
        : {}),
    };

    const [
      accounts,
      total,
      liveTotal,
      activeCount,
      trialCount,
      suspendedCount,
      archivedCount,
    ] = await Promise.all([
      prisma.customerAccount.findMany({
        where,
        include: {
          reseller: { select: { id: true, companyName: true } },
          users: {
            where: { isDeleted: false },
            include: { role: true },
            orderBy: { createdAt: "asc" },
          },
          subscriptions: {
            where: { isActive: true },
            include: { plan: true },
            orderBy: { startDate: "desc" },
            take: 1,
          },
          _count: {
            select: {
              users: { where: { isDeleted: false } },
              whatsAppAccounts: true,
              messageLogs: { where: { direction: "OUTBOUND" } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.customerAccount.count({ where }),
      prisma.customerAccount.count({ where: notArchivedClause }),
      prisma.customerAccount.count({
        where: {
          ...notArchivedClause,
          isActive: true,
          lifecycleStatus: "ACTIVE",
        },
      }),
      prisma.customerAccount.count({
        where: { ...notArchivedClause, lifecycleStatus: "TRIAL" },
      }),
      prisma.customerAccount.count({
        where: {
          ...notArchivedClause,
          OR: [{ isActive: false }, { lifecycleStatus: "SUSPENDED" }],
        },
      }),
      prisma.customerAccount.count({ where: archivedClause }),
    ]);

    const items = accounts.map((account) =>
      mapTenantListItem(account, {
        usersCount: account._count.users,
        whatsappCount: account._count.whatsAppAccounts,
        messagesCount: account._count.messageLogs,
      }),
    );

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Tenants fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        items,
        summary: {
          total: liveTotal,
          active: activeCount,
          trial: trialCount,
          suspended: suspendedCount,
          archived: archivedCount,
        },
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    console.log("TENANT LIST ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
