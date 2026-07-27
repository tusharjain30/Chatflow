const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const RESPONSE_CODES = require("../../../config/responseCode");

router.get("/", async (req, res) => {
  try {
    const { accountId } = req.auth;

    // =========================
    // Campaign Stats
    // =========================
    const [totalCampaigns, activeCampaigns, scheduledCampaigns] =
      await Promise.all([
        prisma.campaign.count({
          where: {
            accountId,
            isDeleted: false,
          },
        }),

        prisma.campaign.count({
          where: {
            accountId,
            status: "RUNNING",
            isDeleted: false,
          },
        }),

        prisma.campaign.count({
          where: {
            accountId,
            status: "SCHEDULED",
            isDeleted: false,
          },
        }),
      ]);

    // =========================
    // Contact Stats
    // =========================
    const totalContacts = await prisma.contact.count({
      where: {
        accountId,
        isDeleted: false,
      },
    });

    // =========================
    // Message Stats (from campaignAudience)
    // =========================
    const messageStats = await prisma.campaignAudience.groupBy({
      by: ["status"],
      where: {
        campaign: {
          accountId,
        },
      },
      _count: true,
    });

    let sent = 0;
    let delivered = 0;
    let read = 0;
    let failed = 0;

    messageStats.forEach((s) => {
      if (s.status === "SENT") sent = s._count;
      if (s.status === "DELIVERED") delivered = s._count;
      if (s.status === "READ") read = s._count;
      if (s.status === "FAILED") failed = s._count;
    });

    // =========================
    // Recent Campaigns (UI Table)
    // =========================
    const recentCampaigns = await prisma.campaign.findMany({
      where: {
        accountId,
        isDeleted: false,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
        totalContacts: true,
        sentCount: true,
        deliveredCount: true,
        readCount: true,
        failedCount: true,
        createdAt: true,
      },
    });

    // =========================
    // Response
    // =========================
    res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Dashboard data fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        campaigns: {
          total: totalCampaigns,
          active: activeCampaigns,
          scheduled: scheduledCampaigns,
        },
        contacts: {
          total: totalContacts,
        },
        messages: {
          sent,
          delivered,
          read,
          failed,
        },
        recentCampaigns,
      },
    });
  } catch (error) {
    console.log("Dashboard Error:", error);

    res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Something went wrong",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
