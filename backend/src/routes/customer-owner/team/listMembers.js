const express = require("express");
const router = express.Router();

const RESPONSE_CODES = require("../../../config/responseCode");

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  try {
    const auth = req.auth;

    const {
      search,
      roleType,
      status,
      page = 1,
      limit = 10,
    } = req.validatedQuery;

    const skip = (page - 1) * limit;

    // =========================
    // Build Filters
    // =========================
    const where = {
      accountId: auth.accountId,
      isDeleted: false,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.isActive = status === "ACTIVE";
    }

    // =========================
    // Fetch Users
    // =========================
    const users = await prisma.user.findMany({
      where,
      include: {
        role: true,
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    // =========================
    // Filter roleType manually
    // =========================
    let filteredUsers = users;

    if (roleType) {
      filteredUsers = users.filter((u) => u.role?.roleType === roleType);
    }

    // =========================
    // Compute Extra Fields
    // =========================
    const result = await Promise.all(
      filteredUsers.map(async (user) => {
        // Assigned chats (example: active sessions)
        const assignedChats = await prisma.botSession.count({
          where: {
            accountId: auth.accountId,
            isActive: true,
          },
        });

        // Resolved today (example: completed sessions)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const resolvedToday = await prisma.botSession.count({
          where: {
            accountId: auth.accountId,
            isActive: false,
            updatedAt: {
              gte: todayStart,
            },
          },
        });

        // Last active (from MessageLog)
        const lastMessage = await prisma.messageLog.findFirst({
          where: {
            accountId: auth.accountId,
            sentByUserId: user.id,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        return {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role?.roleType,

          status: user.isActive ? "ACTIVE" : "INACTIVE",

          assignedChats,
          resolvedToday,

          lastActive: lastMessage?.createdAt || null,

          createdAt: user.createdAt,
        };
      }),
    );

    // =========================
    // Count
    // =========================
    const total = await prisma.user.count({
      where: {
        accountId: auth.accountId,
        isDeleted: false,
      },
    });

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Team members fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        members: result,
        pagination: {
          total,
          page,
          limit,
        },
      },
    });
  } catch (error) {
    console.log("List Members Error:", error);

    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
