const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("../generated/prisma/client");

const prisma = new PrismaClient();

let io = null;

function accountRoom(accountId) {
  return `account:${accountId}`;
}

function getIO() {
  return io;
}

function emitToAccount(accountId, event, payload) {
  if (!io || !accountId) return;
  io.to(accountRoom(accountId)).emit(event, payload);
}

function initSocket(httpServer) {
  const allowedOrigins = [
    ...new Set(
      [
        process.env.FRONTEND_URL,
        process.env.CUSTOMER_OWNER_URL,
        process.env.RESELLER_FRONTEND_URL,
        process.env.ADMIN_FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:8080",
        "http://localhost:8081",
        "http://localhost:8082",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:8081",
        "http://127.0.0.1:8082",
      ].filter(Boolean),
    ),
  ];

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
    path: "/socket.io",
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "");

      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded = jwt.verify(token, process.env.USER_JWT_SECRET);
      if (decoded.userType !== "USER" || !decoded.userId) {
        return next(new Error("Unauthorized"));
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          accountId: true,
          isActive: true,
          isDeleted: true,
          tokenVersion: true,
        },
      });

      if (
        !user ||
        user.isDeleted ||
        !user.isActive ||
        decoded.tokenVersion !== user.tokenVersion
      ) {
        return next(new Error("Unauthorized"));
      }

      socket.data.userId = user.id;
      socket.data.accountId = user.accountId;
      return next();
    } catch (err) {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const { accountId, userId } = socket.data;
    socket.join(accountRoom(accountId));

    socket.emit("socket:ready", { userId, accountId });

    socket.on("campaign:subscribe", (campaignId) => {
      if (typeof campaignId === "string" && campaignId) {
        socket.join(`campaign:${campaignId}`);
      }
    });

    socket.on("campaign:unsubscribe", (campaignId) => {
      if (typeof campaignId === "string" && campaignId) {
        socket.leave(`campaign:${campaignId}`);
      }
    });

    socket.on("disconnect", () => {});
  });

  return io;
}

module.exports = {
  initSocket,
  getIO,
  emitToAccount,
  accountRoom,
};
