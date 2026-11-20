const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");

const prisma = new PrismaClient();

router.post("/", async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const otp = String(req.body.otp || "").trim();
    const { newPassword } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        email,
        isDeleted: false,
        isActive: true,
      },
    });

    if (!user) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Invalid email or OTP",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    if (!user.otp || !user.otpExpires || user.otpExpires < new Date()) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "OTP expired. Please request a new code.",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    if (user.otp !== otp) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Invalid OTP",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "New password must be different from your current password",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        otp: null,
        otpExpires: null,
        isVerified: true,
        tokenVersion: crypto.randomUUID(),
      },
    });

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "Password reset successfully. Please sign in.",
      statusCode: RESPONSE_CODES.POST,
      data: {},
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
