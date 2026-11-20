const { Queue } = require("bullmq");
const { createBullConnection } = require("./connection");

const QUEUE_NAMES = {
  EMAIL: "email",
  CAMPAIGN: "campaign",
};

const defaultJobOptions = {
  removeOnComplete: 100,
  removeOnFail: 200,
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 2000,
  },
};

let emailQueue = null;
let campaignQueue = null;

function getEmailQueue() {
  if (!emailQueue) {
    emailQueue = new Queue(QUEUE_NAMES.EMAIL, {
      connection: createBullConnection(),
      defaultJobOptions,
    });
  }
  return emailQueue;
}

function getCampaignQueue() {
  if (!campaignQueue) {
    campaignQueue = new Queue(QUEUE_NAMES.CAMPAIGN, {
      connection: createBullConnection(),
      defaultJobOptions,
    });
  }
  return campaignQueue;
}

function campaignJobId(campaignId, batchNumber) {
  return `campaign:${campaignId}:batch:${batchNumber}`;
}

async function enqueueEmail({ to, subject, html }) {
  return getEmailQueue().add(
    "send-email",
    { to, subject, html },
    { priority: 2 },
  );
}

async function enqueueCampaignBatches({
  campaignId,
  accountId,
  jobs,
  delayInSeconds = 2,
}) {
  const queue = getCampaignQueue();
  const delayMs = Math.max(0, Number(delayInSeconds) || 0) * 1000;

  const added = [];
  for (const job of jobs) {
    const bullJob = await queue.add(
      "process-batch",
      {
        campaignId,
        accountId,
        campaignJobId: job.id,
        batchNumber: job.batchNumber,
        totalRecords: job.totalRecords,
      },
      {
        jobId: campaignJobId(campaignId, job.batchNumber),
        delay: (job.batchNumber - 1) * delayMs,
      },
    );
    added.push(bullJob.id);
  }
  return added;
}

async function removeCampaignQueueJobs(campaignId, batchNumbers = []) {
  const queue = getCampaignQueue();

  if (batchNumbers.length) {
    await Promise.all(
      batchNumbers.map((batchNumber) =>
        queue.remove(campaignJobId(campaignId, batchNumber)).catch(() => null),
      ),
    );
    return;
  }

  const states = ["waiting", "delayed", "paused", "prioritized"];
  const jobs = await queue.getJobs(states);
  await Promise.all(
    jobs
      .filter((job) => job?.data?.campaignId === campaignId)
      .map((job) => job.remove().catch(() => null)),
  );
}

module.exports = {
  QUEUE_NAMES,
  getEmailQueue,
  getCampaignQueue,
  enqueueEmail,
  enqueueCampaignBatches,
  removeCampaignQueueJobs,
  campaignJobId,
};
