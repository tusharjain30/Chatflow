const { Worker } = require("bullmq");
const { createBullConnection } = require("../connection");
const { QUEUE_NAMES } = require("../queues");
const sendEmail = require("../../utils/sendEmail");
const logger = require("../../utils/logger");

function startEmailWorker() {
  const worker = new Worker(
    QUEUE_NAMES.EMAIL,
    async (job) => {
      const { to, subject, html } = job.data;
      await sendEmail(to, subject, html);
      return { sent: true, to };
    },
    {
      connection: createBullConnection(),
      concurrency: 5,
    },
  );

  worker.on("completed", (job) => {
    logger.info(`[email-worker] sent job ${job.id}`);
  });

  worker.on("failed", (job, err) => {
    logger.error(`[email-worker] job ${job?.id} failed:`, err.message);
  });

  return worker;
}

module.exports = { startEmailWorker };
