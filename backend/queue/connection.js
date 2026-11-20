const { createRedisConnection } = require("../config/redis");

/** Dedicated BullMQ connection (maxRetriesPerRequest must be null). */
function createBullConnection() {
  return createRedisConnection({ maxRetriesPerRequest: null });
}

module.exports = { createBullConnection };
