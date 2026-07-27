const express = require("express");

const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const handleResellerTeamTableError = require("./handleResellerTeamTableError");

const prisma = new PrismaClient();
const router = express.Router();

router.delete("/", async (req, res) => {
  try {
    if (req.auth.userType !== "RESELLER") {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        status: 0,
        message: "Reseller access required",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    const { memberId } = req.body;

    const member = await prisma.resellerMember.findFirst({
      where: {
        id: memberId,
        resellerId: req.auth.resellerId,
        isDeleted: false,
      },
    });

    if (!member) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Team member not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    await prisma.resellerMember.update({
      where: { id: member.id },
      data: {
        isDeleted: true,
        isActive: false,
      },
    });

    return res.status(RESPONSE_CODES.DELETE).json({
      status: 1,
      message: "Reseller team member removed successfully",
      statusCode: RESPONSE_CODES.DELETE,
      data: {
        memberId: member.id,
      },
    });
  } catch (error) {
    const handledResponse = handleResellerTeamTableError(
      res,
      error,
      "RESELLER TEAM DELETE ERROR",
    );
    if (handledResponse) {
      return handledResponse;
    }

    console.error("RESELLER TEAM DELETE ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
