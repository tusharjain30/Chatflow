const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const RESPONSE_CODES = require("../../../config/responseCode");
const { removeCampaignQueueJobs } = require("../../../queue");
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
    if (campaign.status === "COMPLETED") {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Completed campaign cannot be cancelled",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    if (campaign.status === "CANCELLED") {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Campaign already cancelled",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    await removeCampaignQueueJobs(campaignId);

    await prisma.$transaction(async (tx) => {
      await tx.campaign.update({
        where: { id: campaignId },
        data: {
          status: "CANCELLED",
        },
      });

      await tx.campaignJob.updateMany({
        where: {
          campaignId,
          status: { in: ["PENDING", "PROCESSING"] },
        },
        data: {
          status: "FAILED",
          errorMessage: "Cancelled by user",
          completedAt: new Date(),
        },
      });

      await tx.campaignLog.create({
        data: {
          campaignId,
          type: "WARNING",
          message: "Campaign cancelled by user",
        },
      });
    });

    emitToAccount(accountId, "campaign:status", {
      campaignId,
      status: "CANCELLED",
    });

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "Campaign cancelled successfully",
      statusCode: RESPONSE_CODES.POST,
      data: {},
    });
  } catch (error) {
    console.log("Cancel Campaign Error:", error);

    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Something went wrong",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
