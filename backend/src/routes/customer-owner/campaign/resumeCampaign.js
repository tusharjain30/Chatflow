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
    // Business Validation
    // =========================
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

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: "RUNNING",
        startedAt: campaign.startedAt || new Date(),
        completedAt: null,
      },
    });

    await prisma.campaignLog.create({
      data: {
        campaignId,
        type: "INFO",
        message: `Campaign resumed with ${pendingCount} pending contacts`,
      },
    });

    // Simple background loop until queue worker is introduced.
    setImmediate(async () => {
      try {
        const batchSize = campaign.batchSize || 50;
        const delayInSeconds = campaign.delayInSeconds || 2;

        while (true) {
          const latest = await prisma.campaign.findUnique({
            where: { id: campaignId },
            select: { status: true },
          });

          if (!latest || latest.status !== "RUNNING") {
            return;
          }

          const audiences = await prisma.campaignAudience.findMany({
            where: {
              campaignId,
              status: "PENDING",
            },
            take: batchSize,
            include: {
              contact: true,
            },
          });

          if (!audiences.length) {
            const remainingPending = await prisma.campaignAudience.count({
              where: {
                campaignId,
                status: "PENDING",
              },
            });

            const finalCampaign = await prisma.campaign.findUnique({
              where: { id: campaignId },
              select: { status: true },
            });

            if (remainingPending === 0 && finalCampaign?.status === "RUNNING") {
              await prisma.campaign.update({
                where: { id: campaignId },
                data: {
                  status: "COMPLETED",
                  completedAt: new Date(),
                },
              });

              await prisma.campaignLog.create({
                data: {
                  campaignId,
                  type: "INFO",
                  message: "Campaign completed after resume",
                },
              });
            }

            return;
          }

          for (const audience of audiences) {
            try {
              console.log("Sending to:", audience.contact.phone);

              await prisma.campaignAudience.update({
                where: { id: audience.id },
                data: {
                  status: "SENT",
                  sentAt: new Date(),
                },
              });
            } catch (err) {
              await prisma.campaignAudience.update({
                where: { id: audience.id },
                data: {
                  status: "FAILED",
                  errorMessage: err.message,
                  failedAt: new Date(),
                },
              });
            }
          }

          await new Promise((resolve) =>
            setTimeout(resolve, delayInSeconds * 1000)
          );
        }
      } catch (err) {
        console.log("Background Resume Error:", err);

        await prisma.campaign.update({
          where: { id: campaignId },
          data: {
            status: "FAILED",
          },
        });

        await prisma.campaignLog.create({
          data: {
            campaignId,
            type: "ERROR",
            message: err.message || "Campaign resume failed",
          },
        });
      }
    });

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "Campaign resumed successfully",
      statusCode: RESPONSE_CODES.POST,
      data: {
        pendingCount,
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
