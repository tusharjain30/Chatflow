const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const RESPONSE_CODES = require("../../../config/responseCode");
const { enqueueCampaignBatches, removeCampaignQueueJobs } = require("../../../queue");
const { emitToAccount } = require("../../../socket");

router.post("/", async (req, res) => {
  try {
    const { campaignId } = req.body;
    const { accountId } = req.auth;

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

    if (campaign.status !== "PAUSED") {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Only paused campaign can be resumed",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    const pendingCount = await prisma.campaignAudience.count({
      where: {
        campaignId,
        status: "PENDING",
      },
    });

    if (pendingCount === 0) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "No pending audience to resume",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    const batchSize = campaign.batchSize || 50;
    const totalBatches = Math.ceil(pendingCount / batchSize);
    const jobs = [];

    for (let i = 0; i < totalBatches; i++) {
      const remaining = pendingCount - i * batchSize;
      jobs.push({
        campaignId,
        batchNumber: i + 1,
        totalRecords: Math.min(batchSize, remaining),
        status: "PENDING",
      });
    }

    await removeCampaignQueueJobs(campaignId);

    const createdJobs = await prisma.$transaction(async (tx) => {
      await tx.campaignJob.deleteMany({ where: { campaignId } });
      await tx.campaignJob.createMany({ data: jobs });

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
          startedAt: campaign.startedAt || new Date(),
          completedAt: null,
        },
      });

      await tx.campaignLog.create({
        data: {
          campaignId,
          type: "INFO",
          message: `Campaign resumed with ${pendingCount} pending contacts in ${totalBatches} batches (BullMQ)`,
        },
      });

      return persisted;
    });

    await enqueueCampaignBatches({
      campaignId,
      accountId,
      jobs: createdJobs,
      delayInSeconds: campaign.delayInSeconds || 2,
    });

    emitToAccount(accountId, "campaign:status", {
      campaignId,
      status: "RUNNING",
      pendingCount,
      totalBatches,
    });

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "Campaign resumed successfully",
      statusCode: RESPONSE_CODES.POST,
      data: {
        pendingCount,
        totalBatches,
      },
    });
  } catch (error) {
    console.log("Resume Campaign Error:", error);

    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Something went wrong",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
