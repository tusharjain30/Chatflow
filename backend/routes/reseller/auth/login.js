const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { identifier, password, rememberMe } = req.body;
    const normalizedIdentifier = identifier.trim().toLowerCase();

    const reseller = await prisma.reseller.findFirst({
      where: {
        isDeleted: false,
        OR: [
          { email: normalizedIdentifier },
          { userName: normalizedIdentifier },
          { phone: identifier.trim() },
        ],
      },
    });

    if (reseller && (await bcrypt.compare(password, reseller.password))) {
      if (!reseller.isActive) {
        return res.status(RESPONSE_CODES.FORBIDDEN).json({
          status: 0,
          message: "Reseller account is disabled",
          statusCode: RESPONSE_CODES.FORBIDDEN,
          data: {},
        });
      }

      const expiresIn = rememberMe ? "30d" : "1d";
      const token = jwt.sign(
        {
          userType: "RESELLER",
          resellerId: reseller.id,
          tokenVersion: reseller.tokenVersion,
        },
        process.env.USER_JWT_SECRET,
        { expiresIn },
      );

      const { password: _password, tokenVersion, ...safeReseller } = reseller;

      return res.status(RESPONSE_CODES.GET).json({
        status: 1,
        message: "Login successful",
        statusCode: RESPONSE_CODES.GET,
        data: {
          token,
          expiresIn,
          userType: "RESELLER",
          user: safeReseller,
        },
      });
    }

    const member = await prisma.resellerMember.findFirst({
      where: {
        isDeleted: false,
        OR: [
          { email: normalizedIdentifier },
          { userName: normalizedIdentifier },
          { phone: identifier.trim() },
        ],
      },
      include: {
        reseller: true,
      },
    });

    if (!member || !(await bcrypt.compare(password, member.password))) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Invalid credentials",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    if (!member.isActive || !member.reseller?.isActive || member.reseller?.isDeleted) {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        status: 0,
        message: "Reseller member account is disabled",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    const expiresIn = rememberMe ? "30d" : "1d";
    const token = jwt.sign(
      {
        userType: "RESELLER",
        resellerId: member.resellerId,
        resellerMemberId: member.id,
        tokenVersion: member.tokenVersion,
      },
      process.env.USER_JWT_SECRET,
      { expiresIn },
    );

    const { password: _password, tokenVersion, reseller: parentReseller, ...safeMember } =
      member;

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Login successful",
      statusCode: RESPONSE_CODES.GET,
        data: {
          token,
          expiresIn,
          userType: "RESELLER",
          user: {
            ...safeMember,
            companyName: parentReseller.companyName,
            parentResellerId: parentReseller.id,
          },
        },
      });
  } catch (error) {
    console.error("RESELLER LOGIN ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
