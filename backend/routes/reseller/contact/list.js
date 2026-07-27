const express = require("express");

const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

const getActivityKey = (accountId, phone) => `${accountId}:${phone}`;

router.get("/", async (req, res) => {
  try {
    if (req.auth.userType !== "RESELLER") {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        status: 0,
        message: "Reseller access required",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    const { resellerId } = req.auth;
    const { page, limit, search, accountId, groupId } = req.validatedQuery;
    const skip = (page - 1) * limit;
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const baseWhere = {
      isDeleted: false,
      account: {
        resellerId,
        isDeleted: false,
        ...(accountId ? { id: accountId } : {}),
      },
      ...(groupId
        ? {
            groups: {
              some: {
                groupId,
              },
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { phone: { contains: search } },
              { email: { contains: search, mode: "insensitive" } },
              {
                account: {
                  companyName: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [contacts, total, optedOutCount, newContactsLast30Days, accounts, groups] =
      await Promise.all([
        prisma.contact.findMany({
          where: baseWhere,
          skip,
          take: limit,
          orderBy: [{ createdAt: "desc" }],
          select: {
            id: true,
            firstName: true,
            lastName: true,
            country: true,
            phone: true,
            languageCode: true,
            email: true,
            isOptedOut: true,
            createdAt: true,
            updatedAt: true,
            accountId: true,
            account: {
              select: {
                id: true,
                companyName: true,
                isActive: true,
              },
            },
            groups: {
              where: {
                group: {
                  isDeleted: false,
                },
              },
              select: {
                group: {
                  select: {
                    id: true,
                    title: true,
                    isArchived: true,
                  },
                },
              },
            },
          },
        }),
        prisma.contact.count({ where: baseWhere }),
        prisma.contact.count({
          where: {
            ...baseWhere,
            isOptedOut: true,
          },
        }),
        prisma.contact.count({
          where: {
            ...baseWhere,
            createdAt: {
              gte: last30Days,
            },
          },
        }),
        prisma.customerAccount.findMany({
          where: {
            resellerId,
            isDeleted: false,
          },
          select: {
            id: true,
            companyName: true,
          },
          orderBy: [{ companyName: "asc" }],
        }),
        prisma.contactGroup.findMany({
          where: {
            isDeleted: false,
            account: {
              resellerId,
              isDeleted: false,
              ...(accountId ? { id: accountId } : {}),
            },
          },
          select: {
            id: true,
            title: true,
            accountId: true,
            account: {
              select: {
                companyName: true,
              },
            },
          },
          orderBy: [{ title: "asc" }],
        }),
      ]);

    const phones = [...new Set(contacts.map((contact) => contact.phone).filter(Boolean))];
    const pageAccountIds = [...new Set(contacts.map((contact) => contact.accountId))];

    const activityLogs =
      phones.length && pageAccountIds.length
        ? await prisma.messageLog.findMany({
            where: {
              accountId: { in: pageAccountIds },
              OR: [{ to: { in: phones } }, { from: { in: phones } }],
            },
            orderBy: [{ createdAt: "desc" }],
            take: Math.max(phones.length * 8, 40),
            select: {
              accountId: true,
              to: true,
              from: true,
              direction: true,
              type: true,
              status: true,
              templateName: true,
              messageText: true,
              errorMessage: true,
              createdAt: true,
            },
          })
        : [];

    const activityByContactKey = new Map();
    const recentActivity = [];

    activityLogs.forEach((log) => {
      const matchedPhone = log.to && phones.includes(log.to) ? log.to : log.from && phones.includes(log.from) ? log.from : null;
      if (!matchedPhone) return;

      const key = getActivityKey(log.accountId, matchedPhone);
      const current = activityByContactKey.get(key) || {
        outboundCount: 0,
        inboundCount: 0,
        deliveredCount: 0,
        failedCount: 0,
        lastActivityAt: null,
        lastDirection: null,
        lastStatus: null,
        recentMessage: null,
      };

      if (log.direction === "OUTBOUND") current.outboundCount += 1;
      if (log.direction === "INBOUND") current.inboundCount += 1;
      if (log.status === "DELIVERED" || log.status === "READ") current.deliveredCount += 1;
      if (log.status === "FAILED") current.failedCount += 1;

      if (!current.lastActivityAt || log.createdAt > current.lastActivityAt) {
        current.lastActivityAt = log.createdAt;
        current.lastDirection = log.direction;
        current.lastStatus = log.status;
        current.recentMessage = log.messageText || log.templateName || log.errorMessage || log.type;
      }

      activityByContactKey.set(key, current);
    });

    const items = contacts.map((contact) => {
      const activity = activityByContactKey.get(getActivityKey(contact.accountId, contact.phone)) || {
        outboundCount: 0,
        inboundCount: 0,
        deliveredCount: 0,
        failedCount: 0,
        lastActivityAt: null,
        lastDirection: null,
        lastStatus: null,
        recentMessage: null,
      };

      if (activity.lastActivityAt) {
        recentActivity.push({
          id: contact.id,
          name: `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || contact.phone,
          phone: contact.phone,
          account: contact.account,
          lastActivityAt: activity.lastActivityAt,
          lastDirection: activity.lastDirection,
          lastStatus: activity.lastStatus,
          recentMessage: activity.recentMessage,
        });
      }

      return {
        id: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        name: `${contact.firstName || ""} ${contact.lastName || ""}`.trim(),
        country: contact.country,
        phone: contact.phone,
        languageCode: contact.languageCode,
        email: contact.email,
        isOptedOut: contact.isOptedOut,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
        account: contact.account,
        groups: contact.groups.map(({ group }) => ({
          id: group.id,
          title: group.title,
          isArchived: group.isArchived,
        })),
        activity,
      };
    });

    recentActivity.sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime());

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Reseller contacts fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        items,
        accounts,
        groups,
        summary: {
          totalContacts: total,
          optedOutContacts: optedOutCount,
          newContactsLast30Days,
          exportReadyContacts: total,
        },
        importExport: {
          canImport: true,
          canExport: true,
          supportedFormats: ["CSV"],
          ownerRoutes: {
            import: "/user/contacts/contact/import",
            export: "/user/contacts/contact/export",
          },
        },
        recentActivity: recentActivity.slice(0, 12),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    console.error("RESELLER CONTACT LIST ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
