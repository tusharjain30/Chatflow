const express = require("express");
const router = express.Router();

const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

router.post("/", async (req, res) => {
  try {
    const { inviteId } = req.body;
    const auth = req.auth;

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

    if (invite.isAccepted) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Accepted invites cannot be cancelled",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    await prisma.teamInvite.update({
      where: { id: invite.id },
      data: {
        isDeleted: true,
      },
    });

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Invite cancelled successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        inviteId: invite.id,
      },
    });
  } catch (error) {
    console.log("Cancel Invite Error:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
