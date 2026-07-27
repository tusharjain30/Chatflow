const express = require("express");
const router = express.Router();

const RESPONSE_CODES = require("../../../config/responseCode");

const { PrismaClient } = require("../../../generated/prisma/client");
const sendEmail = require("../../../utils/sendEmail");
const prisma = new PrismaClient();
const crypto = require("crypto"); 

router.post("/", async (req, res) => {
  try {
    const { inviteId } = req.body;
    const auth = req.auth;

    // =========================
    // Find invite
    // =========================
    const invite = await prisma.teamInvite.findFirst({
      where: {
        id: inviteId,
        accountId: auth.accountId,
        isDeleted: false,
      },
    });

    if (!invite) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Invite not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    // =========================
    // Already accepted
    // =========================
    if (invite.isAccepted) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Invite already accepted",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    // =========================
    // Generate new token
    // =========================
    const newToken = crypto.randomBytes(32).toString("hex");

    const newExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);

    // =========================
    // Update invite
    // =========================
    const updatedInvite = await prisma.teamInvite.update({
      where: { id: invite.id },
      data: {
        token: newToken,
        expiresAt: newExpiry,
      },
    });

    // =========================
    // Prepare email
    // =========================
    const frontendBaseUrl = process.env.FRONTEND_URL;
    const inviteUrl = `${frontendBaseUrl}/team/invite/${newToken}`;

    let emailSent = true;

    try {
      await sendEmail(
        invite.email,
        "Team Invitation (Resent)",
        `
        <div style="font-family: Arial, sans-serif;">
          <h2>Invitation Reminder</h2>
          <p>You have been invited as <strong>${invite.roleType}</strong>.</p>
          <p>New expiry: <strong>${newExpiry.toUTCString()}</strong></p>
          <a href="${inviteUrl}">Accept Invitation</a>
        </div>
        `,
      );
    } catch (emailError) {
      emailSent = false;
      console.log("Resend email failed:", emailError);
    }

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: emailSent
        ? `Invitation resent to ${invite.email}`
        : `Invite updated but email failed`,
      statusCode: RESPONSE_CODES.POST,
      data: {
        inviteId: updatedInvite.id,
        email: updatedInvite.email,
        expiresAt: updatedInvite.expiresAt,
        emailSent,
      },
    });
  } catch (error) {
    console.log("Resend Invite Error:", error);

    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
