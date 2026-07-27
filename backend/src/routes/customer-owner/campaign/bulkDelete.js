const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const RESPONSE_CODES = require("../../../config/responseCode");

router.post("/", async (req, res) => {
  try {
    const { campaignIds } = req.body;
    const { accountId } = req.auth;

    // =========================
    // Fetch Campaigns (Multi-tenant safe)
    // =========================
    const campaigns = await prisma.campaign.findMany({
      where: {
        id: { in: campaignIds },
        accountId,
        isDeleted: false,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!campaigns.length) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "No campaigns found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    // =========================
    // Filter Deletable Campaigns
    // =========================
    const deletableIds = [];
    const skipped = [];

    campaigns.forEach((c) => {
      if (c.status === "RUNNING") {
        skipped.push({
          id: c.id,
          reason: "Running campaign cannot be deleted",
        });
      } else {
        deletableIds.push(c.id);
      }
    });

    // =========================
    // Perform Soft Delete
    // =========================
    let deletedCount = 0;

    if (deletableIds.length > 0) {
      await prisma.$transaction(async (tx) => {
        const result = await tx.campaign.updateMany({
          where: {
            id: { in: deletableIds },
          },
          data: {
            isDeleted: true,
          },
        });

        deletedCount = result.count;

        // logs
        const logs = deletableIds.map((id) => ({
          campaignId: id,
          type: "WARNING",
          message: "Campaign deleted (bulk)",
        }));

        await tx.campaignLog.createMany({
          data: logs,
        });
      });
    }

    // =========================
    // Response
    // =========================
    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Bulk delete completed",
      statusCode: RESPONSE_CODES.GET,
      data: {
        requested: campaignIds.length,
        deleted: deletedCount,
        skipped,
      },
    });
  } catch (error) {
    console.log("Bulk Delete Error:", error);

    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Something went wrong",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
