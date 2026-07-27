const express = require("express");
const router = express.Router();

import prisma from "../../../config/prisma";

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
    // Business Logic Checks
    // =========================
    if (campaign.status === "DRAFT") {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Draft campaign cannot be paused",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    if (campaign.status === "COMPLETED") {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Completed campaign cannot be paused",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    if (campaign.status === "PAUSED") {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Campaign already paused",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    if (campaign.status === "CANCELLED") {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Cancelled campaign cannot be paused",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    // =========================
    // Update Campaign
    // =========================
    await prisma.campaign.update({
      where: {
        id: campaignId,
      },
      data: {
        status: "PAUSED",
      },
    });

    await prisma.campaignLog.create({
      data: {
        campaignId,
        type: "INFO",
        message: "Campaign paused by user",
      },
    });

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Campaign paused successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {},
    });

  } catch (error) {
    console.log("Pause Campaign Error:", error);

    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Something went wrong",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;