const net = require("net");
const { startEmailWorker } = require("./workers/email.worker");
const { startCampaignWorker } = require("./workers/campaign.worker");
const logger = require("../utils/logger");

let workers = [];
let retryTimer = null;

function parseRedisTarget(url = process.env.REDIS_URL || "redis://127.0.0.1:6379") {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || "127.0.0.1",
      port: Number(parsed.port || 6379),
    };
  } catch {
    return { host: "127.0.0.1", port: 6379 };
  }
}

function redisAvailable(timeoutMs = 1500) {
  const { host, port } = parseRedisTarget();
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    let settled = false;

    const done = (ok) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(ok);
    };

    socket.setTimeout(timeoutMs);
    socket.on("connect", () => done(true));
    socket.on("timeout", () => done(false));
    socket.on("error", () => done(false));
  });
}

async function startWorkers({ retryMs = 10000 } = {}) {
  if (workers.length) return workers;

  const ok = await redisAvailable();
  if (!ok) {
    logger.warn(
      `[queue] Redis not reachable at ${process.env.REDIS_URL || "redis://127.0.0.1:6379"} — workers deferred`,
    );
    if (!retryTimer) {
      retryTimer = setTimeout(() => {
        retryTimer = null;
        startWorkers({ retryMs }).catch(() => null);
      }, retryMs);
      if (typeof retryTimer.unref === "function") retryTimer.unref();
    }
    return [];
  }

  try {
    workers = [startEmailWorker(), startCampaignWorker()];
    logger.info("[queue] BullMQ workers started (email, campaign)");
  } catch (err) {
    logger.error(
      "[queue] could not start workers — ensure Redis is running at REDIS_URL:",
      err.message,
    );
    workers = [];
  }
  return workers;
}

async function stopWorkers() {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  await Promise.all(workers.map((w) => w.close().catch(() => null)));
  workers = [];
}

module.exports = {
  startWorkers,
  stopWorkers,
  ...require("./queues"),
};
