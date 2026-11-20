const express = require("express");
const router = express.Router();

const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  try {
    const auth = req.auth;

    const invites = await prisma.teamInvite.findMany({
      where: {
        accountId: auth.accountId,
        isAccepted: false,
        isDeleted: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        email: true,
        roleType: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Pending invites fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        invites,
      },
    });
  } catch (error) {
    console.log("List Invites Error:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
