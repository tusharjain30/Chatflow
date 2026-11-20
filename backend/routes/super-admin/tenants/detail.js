const express = require("express");
const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const { pickOwner, mapStatus, requireSystemAdmin } = require("./_helpers");
const {
  mapSubscriptionToInvoice,
} = require("../invoice/shared");

const prisma = new PrismaClient();
const router = express.Router({ mergeParams: true });

router.get("/", async (req, res) => {
  try {
    if (!requireSystemAdmin(req, res, RESPONSE_CODES)) return;

    const { id } = req.params;

    const account = await prisma.customerAccount.findFirst({
      where: { id },
      include: {
        reseller: {
          select: {
            id: true,
            companyName: true,
            email: true,
            commissionRate: true,
          },
        },
        users: {
          where: { isDeleted: false },
          include: { role: true },
          orderBy: { createdAt: "asc" },
        },
        subscriptions: {
          include: { plan: true },
          orderBy: { startDate: "desc" },
        },
        whatsAppAccounts: {
          orderBy: { createdAt: "desc" },
        },
        campaigns: {
          where: { isDeleted: false },
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            name: true,
            status: true,
            totalContacts: true,
            sentCount: true,
            failedCount: true,
            createdAt: true,
            startedAt: true,
            completedAt: true,
          },
        },
        supportTickets: {
          where: { isDeleted: false },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        billingTransactions: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!account) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Tenant not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    const [
      messageStats,
      recentMessages,
      templateCount,
      botCount,
      contactCount,
    ] = await Promise.all([
      prisma.messageLog.groupBy({
        by: ["status"],
        where: { accountId: id, direction: "OUTBOUND" },
        _count: true,
      }),
      prisma.messageLog.findMany({
        where: { accountId: id },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          to: true,
          from: true,
          type: true,
          direction: true,
          status: true,
          templateName: true,
          createdAt: true,
        },
      }),
      prisma.template.count({
        where: { accountId: id, isDeleted: false },
      }),
      prisma.bot.count({
        where: { accountId: id, isDeleted: false },
      }),
      prisma.contact.count({
        where: { accountId: id, isDeleted: false },
      }),
    ]);

    const messages = {
      total: 0,
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
      pending: 0,
    };
    messageStats.forEach((row) => {
      const count = row._count || 0;
      messages.total += count;
      const key = String(row.status || "").toLowerCase();
      if (key in messages) messages[key] += count;
    });

    const owner = pickOwner(account.users);
    const activeSubscription =
      account.subscriptions.find((sub) => sub.isActive) || null;

    const invoices = account.subscriptions.map((subscription) =>
      mapSubscriptionToInvoice({
        ...subscription,
        account: {
          id: account.id,
          companyName: account.companyName,
          reseller: account.reseller,
        },
      }),
    );

    const usage = {
      messages,
      templates: templateCount,
      bots: botCount,
      contacts: contactCount,
      whatsappNumbers: account.whatsAppAccounts.length,
      users: account.users.length,
      campaigns: account.campaigns.length,
      planLimits: activeSubscription?.plan
        ? {
            maxTemplates: activeSubscription.plan.maxTemplates,
            maxBots: activeSubscription.plan.maxBots,
            monthlyMessageLimit: activeSubscription.plan.monthlyMessageLimit,
          }
        : null,
    };

    const auditHistory = [
      ...account.billingTransactions.map((tx) => ({
        id: `billing-${tx.id}`,
        type: "BILLING",
        title: tx.type,
        detail: tx.description,
        createdAt: tx.createdAt,
      })),
      ...(account.statusChangedAt
        ? [
            {
              id: `status-${account.id}`,
              type: "STATUS",
              title: `Status: ${mapStatus(account)}`,
              detail: account.statusReason || account.lifecycleStatus,
              createdAt: account.statusChangedAt,
            },
          ]
        : []),
      ...recentMessages.slice(0, 10).map((msg) => ({
        id: `msg-${msg.id}`,
        type: "MESSAGE",
        title: `${msg.direction} ${msg.type}`,
        detail: `${msg.status} · ${msg.to || msg.from || ""}`,
        createdAt: msg.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 40);

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Tenant details fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        overview: {
          id: account.id,
          organization: account.companyName,
          status: mapStatus(account),
          lifecycleStatus: account.lifecycleStatus,
          isActive: account.isActive,
          isDeleted: account.isDeleted,
          trialEndsAt: account.trialEndsAt,
          createdAt: account.createdAt,
          updatedAt: account.updatedAt,
          creditBalance: account.creditBalance,
          reseller: account.reseller,
          owner: owner
            ? {
                id: owner.id,
                name: `${owner.firstName} ${owner.lastName}`.trim(),
                email: owner.email,
                phone: owner.phone,
              }
            : null,
          plan: activeSubscription?.plan || null,
          usageSummary: usage,
        },
        profile: {
          companyName: account.companyName,
          address: account.address,
          city: account.city,
          state: account.state,
          zipCode: account.zipCode,
          country: account.country,
          timezone: account.timezone,
          notificationSoundEnabled: account.notificationSoundEnabled,
          campaignResendEnabled: account.campaignResendEnabled,
          resellerId: account.resellerId,
        },
        users: account.users.map((user) => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          userName: user.userName,
          roleType: user.role?.roleType || null,
          isActive: user.isActive,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        })),
        whatsappAccounts: account.whatsAppAccounts,
        campaigns: account.campaigns,
        messages: {
          stats: messages,
          recent: recentMessages,
        },
        subscription: {
          active: activeSubscription,
          history: account.subscriptions,
        },
        billing: {
          transactions: account.billingTransactions,
          invoices,
        },
        usage,
        auditHistory,
        supportTickets: account.supportTickets,
      },
    });
  } catch (error) {
    console.log("TENANT DETAIL ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
