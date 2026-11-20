const express = require("express");
const router = express.Router();

const RESPONSE_CODES = require("../../../config/responseCode");

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const crypto = require("crypto");
const sendEmail = require("../../../utils/sendEmail");

router.post("/", async (req, res) => {
  try {
    const { email, roleType } = req.body;
    const auth = req.auth;

    const normalizedEmail = email.trim().toLowerCase();

    // =========================
    // Get or Create Role (UPSERT)
    // =========================
    const role = await prisma.role.upsert({
      where: {
        name: roleType, // assuming name is unique
      },
      update: {
        isDeleted: false,
        isActive: true,
      },
      create: {
        name: roleType,
        roleType: roleType,
      },
    });

    // =========================
    // Check if user exists in same account
    // =========================
    const existingUser = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        accountId: auth.accountId,
      },
    });

    // =========================
    //  RESTORE USER (IMPORTANT)
    // =========================
    if (existingUser && existingUser.isDeleted) {
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          isDeleted: false,
          isActive: true,
          roleId: role.id, // update role
        },
      });

      return res.status(RESPONSE_CODES.POST).json({
        status: 1,
        message: "User restored and added to team",
        statusCode: RESPONSE_CODES.POST,
        data: {
          userId: updatedUser.id,
          email: updatedUser.email,
          roleType,
        },
      });
    }

    // =========================
    // Already active user
    // =========================
    if (existingUser && !existingUser.isDeleted) {
      return res.status(RESPONSE_CODES.ALREADY_EXIST).json({
        status: 0,
        message: "User already exists in this account",
        statusCode: RESPONSE_CODES.ALREADY_EXIST,
        data: {},
      });
    }

    // =========================
    // Check existing invite
    // =========================
    const existingInvite = await prisma.teamInvite.findFirst({
      where: {
        email: normalizedEmail,
        accountId: auth.accountId,
        isAccepted: false,
        isDeleted: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (existingInvite) {
      return res.status(RESPONSE_CODES.ALREADY_EXIST).json({
        status: 0,
        message: "Invitation already sent",
        statusCode: RESPONSE_CODES.ALREADY_EXIST,
        data: {},
      });
    }

    // =========================
    // Generate token
    // =========================
    const token = crypto.randomBytes(32).toString("hex");

    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    // =========================
    // Create invite
    // =========================
    const invite = await prisma.teamInvite.create({
      data: {
        email: normalizedEmail,
        roleType,
        accountId: auth.accountId,
        token,
        expiresAt,
        createdByUserId: auth.userId,
      },
    });

    const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:8080";
    const inviteUrl = `${frontendBaseUrl}/team/invite/${token}`;
    const roleLabel =
      roleType === "CUSTOMER_ADMIN" ? "Admin" : "Agent";

    let emailSent = true;
    try {
      await sendEmail(
        normalizedEmail,
        "You're invited to join ChatFlow",
        `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
          <h2>ChatFlow Team Invitation</h2>
          <p>You have been invited to join the team as <strong>${roleLabel}</strong>.</p>
          <p>This invitation will expire on <strong>${expiresAt.toUTCString()}</strong>.</p>
          <p>
            <a href="${inviteUrl}" style="display: inline-block; padding: 10px 16px; background: #16a34a; color: #ffffff; text-decoration: none; border-radius: 6px;">
              Accept Invitation
            </a>
          </p>
          <p>If the button does not work, use this link:</p>
          <p><a href="${inviteUrl}">${inviteUrl}</a></p>
        </div>
      `,
      );
    } catch (error) {
      emailSent = false;
      console.log("Invite email send failed:", error);
    }

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: emailSent
        ? `Invitation sent successfully to ${normalizedEmail}`
        : `Invite created for ${normalizedEmail}, but email could not be sent`,
      statusCode: RESPONSE_CODES.POST,
      data: {
        inviteId: invite.id,
        email: invite.email,
        roleType: invite.roleType,
        expiresAt: invite.expiresAt,
        emailSent,
        inviteUrl: process.env.NODE_ENV === "development" ? inviteUrl : undefined,
      },
    });
  } catch (error) {
    console.log("Invite Member Error:", error);

    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
