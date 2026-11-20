const { Worker } = require("bullmq");
const { PrismaClient } = require("../../generated/prisma/client");
const { createBullConnection } = require("../connection");
const { QUEUE_NAMES } = require("../queues");
const sendWhatsAppMessage = require("../../services/Meta/sendMessage");
const { buildTemplatePayload } = require("../../services/Meta/templatePayloadBuilder");
const { emitToAccount } = require("../../socket");
const logger = require("../../utils/logger");

const prisma = new PrismaClient();

const normalizeRecipient = (to) => {
  const digits = String(to || "").replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
};

async function getCampaignProgress(campaignId) {
  const [campaign, totalJobs, completedJobs, pendingAudience, failedAudience] =
    await Promise.all([
      prisma.campaign.findUnique({
        where: { id: campaignId },
        select: {
          id: true,
          status: true,
          totalContacts: true,
          sentCount: true,
          failedCount: true,
          deliveredCount: true,
          readCount: true,
        },
      }),
      prisma.campaignJob.count({ where: { campaignId } }),
      prisma.campaignJob.count({
        where: { campaignId, status: "COMPLETED" },
      }),
      prisma.campaignAudience.count({
        where: { campaignId, status: "PENDING" },
      }),
      prisma.campaignAudience.count({
        where: { campaignId, status: "FAILED" },
      }),
    ]);

  const progress = totalJobs
    ? Math.round((completedJobs / totalJobs) * 100)
    : 0;

  return {
    campaign,
    stats: {
      totalJobs,
      completedJobs,
      pendingAudience,
      failedAudience,
      progress,
    },
  };
}

async function maybeCompleteCampaign(campaignId, accountId) {
  const pendingJobs = await prisma.campaignJob.count({
    where: {
      campaignId,
      status: { in: ["PENDING", "PROCESSING"] },
    },
  });

  const pendingAudience = await prisma.campaignAudience.count({
    where: { campaignId, status: "PENDING" },
  });

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { status: true },
  });

  if (
    campaign?.status === "RUNNING" &&
    pendingJobs === 0 &&
    pendingAudience === 0
  ) {
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
        message: "Campaign completed",
      },
    });

    const snapshot = await getCampaignProgress(campaignId);
    emitToAccount(accountId, "campaign:status", {
      campaignId,
      status: "COMPLETED",
      ...snapshot,
    });
  }
}

async function processCampaignBatch(job) {
  const { campaignId, accountId, campaignJobId, totalRecords } = job.data;

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, accountId, isDeleted: false },
    include: {
      template: true,
    },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  if (campaign.status === "PAUSED" || campaign.status === "CANCELLED") {
    await prisma.campaignJob.update({
      where: { id: campaignJobId },
      data: {
        status: "FAILED",
        errorMessage: `Skipped: campaign is ${campaign.status}`,
        completedAt: new Date(),
      },
    });
    return { skipped: true, reason: campaign.status };
  }

  if (campaign.status !== "RUNNING") {
    throw new Error(`Campaign is ${campaign.status}, expected RUNNING`);
  }

  await prisma.campaignJob.update({
    where: { id: campaignJobId },
    data: {
      status: "PROCESSING",
      startedAt: new Date(),
      errorMessage: null,
    },
  });

  emitToAccount(accountId, "campaign:progress", {
    campaignId,
    campaignJobId,
    batchNumber: job.data.batchNumber,
    status: "PROCESSING",
  });

  const limit = totalRecords || campaign.batchSize || 50;
  const audiences = await prisma.campaignAudience.findMany({
    where: { campaignId, status: "PENDING" },
    take: limit,
    include: { contact: true },
    orderBy: { createdAt: "asc" },
  });

  let sent = 0;
  let failed = 0;

  for (const audience of audiences) {
    const latest = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { status: true },
    });

    if (!latest || latest.status !== "RUNNING") {
      break;
    }

    try {
      const to = normalizeRecipient(audience.contact?.phone);
      if (!to) {
        throw new Error("Missing contact phone");
      }

      const variables = [];
      if (audience.payload && Array.isArray(audience.payload.variables)) {
        variables.push(...audience.payload.variables);
      }

      let metaResponse = null;
      if (campaign.template?.name) {
        metaResponse = await sendWhatsAppMessage({
          to,
          payload: buildTemplatePayload({
            name: campaign.template.name,
            language: campaign.template.language || "en",
            variables,
          }),
        });
      } else {
        logger.warn(
          `[campaign-worker] no template for campaign ${campaignId}; marking sent`,
        );
      }

      await prisma.campaignAudience.update({
        where: { id: audience.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
          errorMessage: null,
        },
      });

      await prisma.campaign.update({
        where: { id: campaignId },
        data: { sentCount: { increment: 1 } },
      });

      if (metaResponse?.messages?.[0]?.id) {
        await prisma.messageLog.create({
          data: {
            accountId,
            to,
            type: "TEMPLATE",
            direction: "OUTBOUND",
            templateId: campaign.templateId,
            templateName: campaign.template?.name || null,
            payload: {
              campaignId,
              audienceId: audience.id,
              variables,
            },
            status: "SENT",
            metaMessageId: metaResponse.messages[0].id,
          },
        });
      }

      sent += 1;
    } catch (err) {
      failed += 1;
      await prisma.campaignAudience.update({
        where: { id: audience.id },
        data: {
          status: "FAILED",
          failedAt: new Date(),
          errorMessage: err?.response?.data?.error?.message || err.message,
        },
      });
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { failedCount: { increment: 1 } },
      });
    }
  }

  await prisma.campaignJob.update({
    where: { id: campaignJobId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      errorMessage: failed ? `${failed} recipients failed in batch` : null,
    },
  });

  const snapshot = await getCampaignProgress(campaignId);
  emitToAccount(accountId, "campaign:progress", {
    campaignId,
    campaignJobId,
    batchNumber: job.data.batchNumber,
    status: "COMPLETED",
    sent,
    failed,
    ...snapshot,
  });

  await maybeCompleteCampaign(campaignId, accountId);

  return { sent, failed, processed: audiences.length };
}

function startCampaignWorker() {
  const worker = new Worker(
    QUEUE_NAMES.CAMPAIGN,
    async (job) => processCampaignBatch(job),
    {
      connection: createBullConnection(),
      concurrency: 2,
    },
  );

  worker.on("completed", (job) => {
    logger.info(`[campaign-worker] completed job ${job.id}`);
  });

  worker.on("failed", (job, err) => {
    logger.error(`[campaign-worker] job ${job?.id} failed:`, err.message);
  });

  return worker;
}

module.exports = { startCampaignWorker, processCampaignBatch };
