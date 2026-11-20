const net = require("net");
const express = require("express");

const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

function checkRedis(timeoutMs = 1500) {
  const url = process.env.REDIS_URL || "redis://127.0.0.1:6379";
  let host = "127.0.0.1";
  let port = 6379;
  try {
    const parsed = new URL(url);
    host = parsed.hostname || host;
    port = Number(parsed.port || 6379);
  } catch {
    // keep defaults
  }

  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    let settled = false;
    const done = (ok, detail) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve({ ok, detail });
    };
    socket.setTimeout(timeoutMs);
    socket.on("connect", () => done(true, `${host}:${port}`));
    socket.on("timeout", () => done(false, "timeout"));
    socket.on("error", (err) => done(false, err.message));
  });
}

router.get("/", async (req, res) => {
  try {
    if (req.admin.role?.roleType !== "SYSTEM_ADMIN") {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        status: 0,
        message: "Access denied",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    const startedAt = Date.now();

    let database = { status: "down", latencyMs: null, detail: null };
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      database = {
        status: "up",
        latencyMs: Date.now() - dbStart,
        detail: "PostgreSQL reachable",
      };
    } catch (err) {
      database = {
        status: "down",
        latencyMs: null,
        detail: err.message || "Database unreachable",
      };
    }

    const redisCheck = await checkRedis();
    const redis = {
      status: redisCheck.ok ? "up" : "down",
      detail: redisCheck.ok
        ? `Redis reachable (${redisCheck.detail})`
        : `Redis unreachable (${redisCheck.detail})`,
    };

    const api = {
      status: "up",
      latencyMs: Date.now() - startedAt,
      detail: "API process healthy",
      environment: process.env.NODE_ENV || "development",
      uptimeSeconds: Math.floor(process.uptime()),
    };

    const checks = [database.status, redis.status, api.status];
    const overall =
      checks.every((s) => s === "up")
        ? "healthy"
        : checks.some((s) => s === "up")
          ? "degraded"
          : "down";

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Platform health fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        overall,
        checkedAt: new Date().toISOString(),
        services: {
          api,
          database,
          redis,
          socket: {
            status: "up",
            detail: "Socket.IO mounted on /socket.io",
          },
          queues: {
            status: redisCheck.ok ? "up" : "down",
            detail: redisCheck.ok
              ? "BullMQ workers can connect"
              : "BullMQ deferred until Redis is available",
          },
        },
      },
    });
  } catch (error) {
    console.log("OVERVIEW HEALTH ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
