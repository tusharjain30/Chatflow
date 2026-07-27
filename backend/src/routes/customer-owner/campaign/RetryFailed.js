const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const RESPONSE_CODES = require("../../../config/responseCode");

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
    // Status Check
    // =========================
    if (campaign.status === "CANCELLED") {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Cancelled campaign cannot retry",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    // =========================
    // Reset Failed Records
    // =========================
    const result = await prisma.campaignAudience.updateMany({
      where: {
        campaignId,
        status: "FAILED",
      },
      data: {
        status: "PENDING",
        errorMessage: null,
        failedAt: null,
      },
    });

    if (result.count === 0) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "No failed records to retry",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    // =========================
    // Log Entry
    // =========================
    await prisma.campaignLog.create({
      data: {
        campaignId,
        type: "INFO",
        message: `Retry initiated for ${result.count} failed contacts`,
      },
    });

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "Failed messages moved to pending",
      statusCode: RESPONSE_CODES.POST,
      data: {
        retriedCount: result.count,
      },
    });
  } catch (error) {
    console.log("Retry Campaign Error:", error);

    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Something went wrong",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
