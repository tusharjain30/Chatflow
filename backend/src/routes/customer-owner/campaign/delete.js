const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const RESPONSE_CODES = require("../../../config/responseCode");

router.delete("/", async (req, res) => {
  try {
    const { id } = req.validatedParams;
    const { accountId } = req.auth;

    // =========================
    // Validate Campaign
    // =========================
    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
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
    // Business Rules
    // =========================
    if (campaign.status === "RUNNING") {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Running campaign cannot be deleted",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    // =========================
    // Soft Delete (Transaction)
    // =========================
    await prisma.$transaction(async (tx) => {
      await tx.campaign.update({
        where: { id },
        data: {
          isDeleted: true,
        },
      });

      await tx.campaignLog.create({
        data: {
          campaignId: id,
          type: "WARNING",
          message: "Campaign deleted (soft delete)",
        },
      });
    });

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Campaign deleted successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {},
    });
  } catch (error) {
    console.log("Delete Campaign Error:", error);

    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Something went wrong",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
