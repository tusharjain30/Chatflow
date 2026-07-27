const express = require("express");
const router = express.Router();

import prisma from "../../../config/prisma";

const RESPONSE_CODES = require("../../../config/responseCode");

router.get("/", async (req, res) => {
  try {
    const { id } = req.validatedParams;
    const { accountId } = req.auth;

    // =========================
    // Fetch Campaign
    // =========================
    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        accountId,
        isDeleted: false,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        _count: {
          select: {
            audiences: true,
          },
        },
      },
    });

    if (!campaign) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Campaign not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    // =========================
    // Calculate Progress %
    // =========================
    const total = campaign.totalContacts || 0;
    const sent = campaign.sentCount || 0;

    const progress = total ? Math.round((sent / total) * 100) : 0;

    // =========================
    // Response Format
    // =========================
    const response = {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      status: campaign.status,

      template: campaign.template,

      isScheduled: campaign.isScheduled,
      scheduledAt: campaign.scheduledAt,

      startedAt: campaign.startedAt,
      completedAt: campaign.completedAt,

      // Stats
      totalContacts: campaign.totalContacts,
      audienceCount: campaign._count.audiences,

      sentCount: campaign.sentCount,
      deliveredCount: campaign.deliveredCount,
      readCount: campaign.readCount,
      failedCount: campaign.failedCount,

      progress,

      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    };

    res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Campaign details fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: response,
    });
  } catch (error) {
    console.log("Get Campaign Detail Error:", error);

    res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Something went wrong",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
