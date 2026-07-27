const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const RESPONSE_CODES = require("../../../config/responseCode");
import prisma from "../../../config/prisma";
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

    if (!reseller || !(await bcrypt.compare(password, reseller.password))) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Invalid credentials",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

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
