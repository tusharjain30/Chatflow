const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const RESPONSE_CODES = require("../../../config/responseCode");

router.get("/", async (req, res) => {
  try {
    const { userId } = req.validatedParams;
    const auth = req.auth;

    // =========================
    // Find User
    // =========================
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        accountId: auth.accountId,
        isDeleted: false,
      },
      include: {
        role: true,
      },
    });

    if (!user) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Team member not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    // Assigned chats (global for now)
    const assignedChats = await prisma.botSession.count({
      where: {
        accountId: auth.accountId,
        isActive: true,
      },
    });

    // Resolved today
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

    // Last active
    const lastMessage = await prisma.messageLog.findFirst({
      where: {
        accountId: auth.accountId,
        sentByUserId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Team member detail fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone,

        role: user.role?.roleType,

        status: user.isActive ? "ACTIVE" : "INACTIVE",

        assignedChats,
        resolvedToday,

        lastActive: lastMessage?.createdAt || null,

        createdAt: user.createdAt,
      },
    });

  } catch (error) {
    console.log("Member Detail Error:", error);

    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;