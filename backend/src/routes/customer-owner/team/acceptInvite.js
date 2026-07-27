const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const RESPONSE_CODES = require("../../../config/responseCode");
const bcrypt = require("bcrypt");

router.post("/", async (req, res) => {
  try {
    const { token, firstName, lastName, password, phone } = req.body;

    // =========================
    // Find Invite
    // =========================
    const invite = await prisma.teamInvite.findFirst({
      where: {
        token,
        isAccepted: false,
        isDeleted: false,
      },
    });

    if (!invite) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Invalid or expired invite",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    // =========================
    // Expiry Check
    // =========================
    if (invite.expiresAt < new Date()) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Invite has expired",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    const normalizedEmail = invite.email;
    const baseUsername = normalizedEmail.split("@")[0];

    const userName = `${baseUsername}}`;

    // =========================
    // Check if user already exists (global)
    // =========================
    let user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
      },
    });

    // =========================
    // Hash Password
    // =========================
    const hashedPassword = await bcrypt.hash(password, 10);

    // =========================
    // Get role
    // =========================
    const role = await prisma.role.findFirst({
      where: {
        roleType: invite.roleType,
        isDeleted: false,
        isActive: true,
      },
    });

    if (!role) {
      return res.status(RESPONSE_CODES.ERROR).json({
        status: 0,
        message: "Role not found",
        statusCode: RESPONSE_CODES.ERROR,
        data: {},
      });
    }

    // =========================
    // TRANSACTION
    // =========================
    await prisma.$transaction(async (tx) => {
      // =========================
      // If user exists → attach to account
      // =========================
      if (user) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            firstName,
            lastName,
            phone,
            password: hashedPassword,
            accountId: invite.accountId,
            roleId: role.id,
            isDeleted: false,
            isActive: true,
          },
        });
      } else {
        // =========================
        // Create new user
        // =========================
        await tx.user.create({
          data: {
            firstName,
            lastName,
            email: normalizedEmail,
            phone,
            password: hashedPassword,
            roleId: role.id,
            accountId: invite.accountId,
            isVerified: true,
            termsAccepted: true,
            userName,
          },
        });
      }

      // =========================
      // Mark invite accepted
      // =========================
      await tx.teamInvite.update({
        where: { id: invite.id },
        data: {
          isAccepted: true,
        },
      });
    });

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "Invite accepted successfully",
      statusCode: RESPONSE_CODES.POST,
      data: {},
    });
  } catch (error) {
    console.log("Accept Invite Error:", error);

    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
