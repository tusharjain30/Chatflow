const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const RESPONSE_CODES = require("../../../config/responseCode");
const { enqueueCampaignBatches } = require("../../../queue");
const { emitToAccount } = require("../../../socket");

router.post("/", async (req, res) => {
  try {
    const { campaignId } = req.body;
    const { accountId } = req.auth;

    // =========================
    // Validate Campaign
    // =========================
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        accountId,
        isDeleted: false,
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
    // Status Checks
    // =========================
    if (campaign.status === "RUNNING") {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Campaign already running",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    if (campaign.status === "COMPLETED") {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Campaign already completed",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    if (campaign.status === "PAUSED") {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Paused campaign must be resumed, not started again",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    if (campaign.status === "CANCELLED") {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Cancelled campaign cannot be started",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    if (campaign.status === "FAILED") {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Failed campaign cannot be started again directly",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    if (!["DRAFT", "SCHEDULED"].includes(campaign.status)) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Campaign cannot be started in its current status",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    // =========================
    // Check Audience
    // =========================
    const audienceCount = await prisma.campaignAudience.count({
      where: { campaignId },
    });

    if (!audienceCount) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "No audience found for this campaign",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    // =========================
    // Batch Calculation
    // =========================
    const batchSize = campaign.batchSize || 50;
    const totalBatches = Math.ceil(audienceCount / batchSize);

    const jobs = [];

    for (let i = 0; i < totalBatches; i++) {
      const remaining = audienceCount - i * batchSize;

      jobs.push({
        campaignId,
        batchNumber: i + 1,
        totalRecords: Math.min(batchSize, remaining),
        status: "PENDING",
      });
    }

    const createdJobs = await prisma.$transaction(async (tx) => {
      await tx.campaignJob.deleteMany({
        where: {
          campaignId,
        },
      });

      await tx.campaignJob.createMany({
        data: jobs,
      });

      const persisted = await tx.campaignJob.findMany({
        where: { campaignId },
        orderBy: { batchNumber: "asc" },
        select: {
          id: true,
          batchNumber: true,
          totalRecords: true,
        },
      });

      await tx.campaign.update({
        where: { id: campaignId },
        data: {
          status: "RUNNING",
          startedAt: new Date(),
          completedAt: null,
        },
      });

      await tx.campaignLog.create({
        data: {
          campaignId,
          type: "INFO",
          message: `Campaign started with ${audienceCount} contacts in ${totalBatches} batches (BullMQ)`,
        },
      });

      return persisted;
    });

    try {
      await enqueueCampaignBatches({
        campaignId,
        accountId,
        jobs: createdJobs,
        delayInSeconds: campaign.delayInSeconds || 2,
      });
    } catch (queueError) {
      console.error("Campaign queue enqueue failed:", queueError);
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: "FAILED" },
      });
      await prisma.campaignLog.create({
        data: {
          campaignId,
          type: "ERROR",
          message:
            queueError.message ||
            "Failed to enqueue campaign batches (is Redis running?)",
        },
      });

      return res.status(RESPONSE_CODES.ERROR).json({
        status: 0,
        message:
          "Campaign could not be queued. Ensure Redis is running and try again.",
        statusCode: RESPONSE_CODES.ERROR,
        data: {},
      });
    }

    emitToAccount(accountId, "campaign:status", {
      campaignId,
      status: "RUNNING",
      totalAudience: audienceCount,
      totalBatches,
    });

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "Campaign started successfully",
      statusCode: RESPONSE_CODES.POST,
      data: {
        totalAudience: audienceCount,
        totalBatches,
      },
    });
  } catch (error) {
    console.log("Start Campaign Error:", error);

    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Something went wrong",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
