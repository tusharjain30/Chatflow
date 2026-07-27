const express = require("express");
const router = express.Router();
const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  try {
    const { accountId } = req.auth;

    const [
      activeSubscription,
      totalTemplates,
      totalBots,
      outboundMessages,
      pendingMessages,
      deliveredMessages,
      readMessages,
      failedMessages,
      activeTeamMembers,
      totalContacts,
    ] = await Promise.all([
      prisma.subscription.findFirst({
        where: { accountId, isActive: true },
        orderBy: { startDate: "desc" },
        include: { plan: true },
      }),
      prisma.template.count({ where: { accountId, isDeleted: false } }),
      prisma.bot.count({ where: { accountId, isDeleted: false } }),
      prisma.messageLog.count({ where: { accountId, direction: "OUTBOUND" } }),
      prisma.messageLog.count({ where: { accountId, direction: "OUTBOUND", status: "PENDING" } }),
      prisma.messageLog.count({ where: { accountId, direction: "OUTBOUND", status: "DELIVERED" } }),
      prisma.messageLog.count({ where: { accountId, direction: "OUTBOUND", status: "READ" } }),
      prisma.messageLog.count({ where: { accountId, direction: "OUTBOUND", status: "FAILED" } }),
      prisma.user.count({ where: { accountId, isDeleted: false, isActive: true } }),
      prisma.contact.count({ where: { accountId, isDeleted: false } }),
    ]);

    const plan = activeSubscription?.plan || null;

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Usage fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        templates: {
          used: totalTemplates,
          limit: plan?.maxTemplates || null,
          remaining: plan?.maxTemplates != null ? Math.max(plan.maxTemplates - totalTemplates, 0) : null,
        },
        bots: {
          used: totalBots,
          limit: plan?.maxBots || null,
          remaining: plan?.maxBots != null ? Math.max(plan.maxBots - totalBots, 0) : null,
        },
        messages: {
          used: outboundMessages,
          limit: plan?.monthlyMessageLimit || null,
          remaining: plan?.monthlyMessageLimit != null ? Math.max(plan.monthlyMessageLimit - outboundMessages, 0) : null,
          pending: pendingMessages,
          delivered: deliveredMessages,
          read: readMessages,
          failed: failedMessages,
        },
        team: {
          activeMembers: activeTeamMembers,
        },
        contacts: {
          total: totalContacts,
        },
      },
    });
  } catch (error) {
    console.log("Usage Summary Error:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
