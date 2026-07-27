const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const RESPONSE_CODES = require("../../../config/responseCode");

router.put("/", async (req, res) => {
  try {
    const { id } = req.validatedParams;
    const {
      name,
      description,
      templateId,
      isScheduled,
      scheduledAt,
      batchSize,
      delayInSeconds,
    } = req.body;

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
    // Allow only DRAFT update
    // =========================
    if (campaign.status !== "DRAFT") {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Only draft campaign can be updated",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    // =========================
    // Validate Template (if changed)
    // =========================
    if (templateId) {
      const template = await prisma.template.findFirst({
        where: {
          id: templateId,
          accountId,
          isDeleted: false,
          isActive: true,
          status: "APPROVED",
        },
      });

      if (!template) {
        return res.status(RESPONSE_CODES.NOT_FOUND).json({
          status: 0,
          message: "Template not found or not approved",
          statusCode: RESPONSE_CODES.NOT_FOUND,
          data: {},
        });
      }
    }

    // =========================
    // Validate Schedule
    // =========================
    let finalScheduledAt = campaign.scheduledAt;

    if (isScheduled !== undefined) {
      if (isScheduled) {
        if (!scheduledAt) {
          return res.status(RESPONSE_CODES.BAD_REQUEST).json({
            status: 0,
            message: "scheduledAt is required when scheduling",
            statusCode: RESPONSE_CODES.BAD_REQUEST,
            data: {},
          });
        }

        const scheduleDate = new Date(scheduledAt);

        if (scheduleDate <= new Date()) {
          return res.status(RESPONSE_CODES.BAD_REQUEST).json({
            status: 0,
            message: "Scheduled time must be in the future",
            statusCode: RESPONSE_CODES.BAD_REQUEST,
            data: {},
          });
        }

        finalScheduledAt = scheduleDate;
      } else {
        finalScheduledAt = null;
      }
    }

    // =========================
    // Safe Limits
    // =========================
    const safeBatchSize = batchSize
      ? Math.min(Math.max(batchSize, 1), 100)
      : campaign.batchSize;

    const safeDelay = delayInSeconds
      ? Math.min(Math.max(delayInSeconds, 1), 60)
      : campaign.delayInSeconds;

    // =========================
    // Update Data
    // =========================
    const updatedCampaign = await prisma.$transaction(async (tx) => {
      const updated = await tx.campaign.update({
        where: { id },
        data: {
          name: name?.trim(),
          description,
          templateId,
          isScheduled,
          scheduledAt: finalScheduledAt,
          batchSize: safeBatchSize,
          delayInSeconds: safeDelay,
          status: isScheduled ? "SCHEDULED" : "DRAFT",
        },
      });

      await tx.campaignLog.create({
        data: {
          campaignId: id,
          type: "INFO",
          message: "Campaign updated",
        },
      });

      return updated;
    });

    // =========================
    // Response
    // =========================
    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "Campaign updated successfully",
      statusCode: RESPONSE_CODES.POST,
      data: {
        id: updatedCampaign.id,
        name: updatedCampaign.name,
        status: updatedCampaign.status,
        isScheduled: updatedCampaign.isScheduled,
        scheduledAt: updatedCampaign.scheduledAt,
      },
    });
  } catch (error) {
    console.log("Update Campaign Error:", error);

    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Something went wrong",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;