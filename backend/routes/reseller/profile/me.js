const express = require("express");

const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    if (req.auth.userType !== "RESELLER") {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        status: 0,
        message: "Reseller access required",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    if (req.auth.resellerMemberId) {
      const member = await prisma.resellerMember.findUnique({
        where: { id: req.auth.resellerMemberId },
        include: {
          reseller: true,
        },
      });

      if (!member) {
        return res.status(RESPONSE_CODES.NOT_FOUND).json({
          status: 0,
          message: "Reseller member not found",
          statusCode: RESPONSE_CODES.NOT_FOUND,
          data: {},
        });
      }

      const { password, tokenVersion, reseller, ...safeMember } = member;

      return res.status(RESPONSE_CODES.GET).json({
        status: 1,
        message: "Reseller member profile fetched successfully",
        statusCode: RESPONSE_CODES.GET,
        data: {
          userType: "RESELLER",
          companyName: reseller.companyName,
          commissionRate: reseller.commissionRate,
          balance: reseller.balance,
          isTeamMember: true,
          ...safeMember,
        },
      });
    }

    const reseller = await prisma.reseller.findUnique({
      where: { id: req.auth.resellerId },
    });

    if (!reseller) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Reseller not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    const { password, tokenVersion, ...safeReseller } = reseller;

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Reseller profile fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        userType: "RESELLER",
        ...safeReseller,
      },
    });
  } catch (error) {
    console.error("RESELLER PROFILE ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
