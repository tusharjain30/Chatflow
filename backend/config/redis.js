const IORedis = require("ioredis");

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

let sharedConnection = null;

function createRedisConnection(overrides = {}) {
  const connection = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: true,
    retryStrategy(times) {
      if (times > 20) return null;
      return Math.min(times * 500, 5000);
    },
    ...overrides,
  });

  connection.on("error", (err) => {
    // Avoid crashing the process; workers/queues log failures on use.
    if (process.env.REDIS_DEBUG === "true") {
      console.error("[redis] connection error:", err.message);
    }
  });

  return connection;
}

function getRedisConnection() {
  if (!sharedConnection) {
    sharedConnection = createRedisConnection();
  }
  return sharedConnection;
}

module.exports = {
  REDIS_URL,
  createRedisConnection,
  getRedisConnection,
};
