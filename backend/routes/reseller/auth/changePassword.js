const crypto = require("crypto");
const express = require("express");
const bcrypt = require("bcrypt");

const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    if (req.auth.userType !== "RESELLER") {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        status: 0,
        message: "Reseller access required",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    const { currentPassword, newPassword } = req.body;

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

    const isMatch = await bcrypt.compare(currentPassword, reseller.password);
    if (!isMatch) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Current password is incorrect",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    const isSame = await bcrypt.compare(newPassword, reseller.password);
    if (isSame) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "New password must be different from old password",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.reseller.update({
      where: { id: reseller.id },
      data: {
        password: hashedPassword,
        tokenVersion: crypto.randomUUID(),
      },
    });

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Password changed successfully. Please login again.",
      statusCode: RESPONSE_CODES.GET,
      data: {},
    });
  } catch (error) {
    console.error("RESELLER CHANGE PASSWORD ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
