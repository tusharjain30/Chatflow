const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const RESPONSE_CODES = require("../../../config/responseCode");

router.get("/", async (req, res) => {
  try {
    const auth = req.auth;

    const baseWhere = {
      accountId: auth.accountId,
      isDeleted: false,
    };

    // =========================
    // Total Members
    // =========================
    const totalMembers = await prisma.user.count({
      where: baseWhere,
    });

    // =========================
    // Active Members
    // =========================
    const activeMembers = await prisma.user.count({
      where: {
        ...baseWhere,
        isActive: true,
      },
    });

    // =========================
    // Agents Count
    // =========================
    const agents = await prisma.user.count({
      where: {
        ...baseWhere,
        role: {
          roleType: "CUSTOMER_AGENT",
        },
      },
    });

    // =========================
    // Pending Invites
    // =========================
    const pendingInvites = await prisma.teamInvite.count({
      where: {
        accountId: auth.accountId,
        isAccepted: false,
        isDeleted: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Team stats fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        totalMembers,
        activeMembers,
        agents,
        pendingInvites,
      },
    });
  } catch (error) {
    console.log("Team Stats Error:", error);

    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
