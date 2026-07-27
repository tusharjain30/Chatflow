const express = require("express");

const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    if (req.auth.userType !== "RESELLER") {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        status: 0,
        message: "Reseller access required",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    const { resellerId } = req.auth;
    const { campaignId } = req.validatedQuery;

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        isDeleted: false,
        account: {
          resellerId,
          isDeleted: false,
        },
      },
      include: {
        account: {
          select: {
            id: true,
            companyName: true,
            isActive: true,
          },
        },
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
            logs: true,
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

    const [audienceBreakdown, failedAudience, logs, jobs] = await Promise.all([
      prisma.campaignAudience.groupBy({
        by: ["status"],
        where: {
          campaignId,
        },
        _count: {
          _all: true,
        },
      }),
      prisma.campaignAudience.findMany({
        where: {
          campaignId,
          status: "FAILED",
        },
        orderBy: [{ failedAt: "desc" }, { createdAt: "desc" }],
        take: 15,
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      }),
      prisma.campaignLog.findMany({
        where: {
          campaignId,
          type: "ERROR",
        },
        orderBy: [{ createdAt: "desc" }],
        take: 15,
      }),
      prisma.campaignJob.findMany({
        where: {
          campaignId,
        },
        orderBy: [{ batchNumber: "asc" }],
        take: 20,
      }),
    ]);

    const totalContacts = campaign.totalContacts || 0;
    const sentCount = campaign.sentCount || 0;
    const deliveredCount = campaign.deliveredCount || 0;
    const readCount = campaign.readCount || 0;
    const failedCount = campaign.failedCount || 0;

    const analyticsMap = audienceBreakdown.reduce((acc, item) => {
      acc[item.status] = item._count._all;
      return acc;
    }, {});

    const jobStats = jobs.reduce(
      (acc, job) => {
        acc.total += 1;
        acc[job.status.toLowerCase()] += 1;
        return acc;
      },
      {
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      },
    );

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Reseller campaign detail fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        campaign: {
          id: campaign.id,
          name: campaign.name,
          description: campaign.description,
          status: campaign.status,
          account: campaign.account,
          template: campaign.template,
          totalContacts,
          audienceCount: campaign._count.audiences,
          logCount: campaign._count.logs,
          sentCount,
          deliveredCount,
          readCount,
          failedCount,
          progress: totalContacts ? Math.round((sentCount / totalContacts) * 100) : 0,
          isScheduled: campaign.isScheduled,
          scheduledAt: campaign.scheduledAt,
          startedAt: campaign.startedAt,
          completedAt: campaign.completedAt,
          createdAt: campaign.createdAt,
          updatedAt: campaign.updatedAt,
        },
        analytics: {
          pending: analyticsMap.PENDING || 0,
          sent: analyticsMap.SENT || 0,
          delivered: analyticsMap.DELIVERED || 0,
          read: analyticsMap.READ || 0,
          failed: analyticsMap.FAILED || 0,
          skipped: analyticsMap.SKIPPED || 0,
          deliveryRate: totalContacts ? Number(((deliveredCount / totalContacts) * 100).toFixed(1)) : 0,
          readRate: totalContacts ? Number(((readCount / totalContacts) * 100).toFixed(1)) : 0,
          failureRate: totalContacts ? Number(((failedCount / totalContacts) * 100).toFixed(1)) : 0,
        },
        failedAudience: failedAudience.map((entry) => ({
          id: entry.id,
          status: entry.status,
          failedAt: entry.failedAt,
          errorMessage: entry.errorMessage,
          contact: {
            id: entry.contact.id,
            name: `${entry.contact.firstName || ""} ${entry.contact.lastName || ""}`.trim(),
            phone: entry.contact.phone,
          },
        })),
        failedLogs: logs.map((log) => ({
          id: log.id,
          type: log.type,
          message: log.message,
          createdAt: log.createdAt,
        })),
        jobs: jobs.map((job) => ({
          id: job.id,
          batchNumber: job.batchNumber,
          totalRecords: job.totalRecords,
          status: job.status,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
          errorMessage: job.errorMessage,
          createdAt: job.createdAt,
        })),
        jobStats,
      },
    });
  } catch (error) {
    console.error("RESELLER CAMPAIGN DETAIL ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
