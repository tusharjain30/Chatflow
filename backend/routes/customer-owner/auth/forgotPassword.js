const express = require("express");
const router = express.Router();
const crypto = require("crypto");

const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const { enqueueEmail } = require("../../../queue");

const prisma = new PrismaClient();

const OTP_TTL_MS = 10 * 60 * 1000;
const GENERIC_MESSAGE =
  "If an account exists for that email, a reset code has been sent.";

router.post("/", async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        email,
        isDeleted: false,
        isActive: true,
      },
      select: { id: true, email: true, firstName: true },
    });

    // Always return the same response to avoid account enumeration.
    if (!user) {
      return res.status(RESPONSE_CODES.POST).json({
        status: 1,
        message: GENERIC_MESSAGE,
        statusCode: RESPONSE_CODES.POST,
        data: {},
      });
    }

    const otp = String(crypto.randomInt(100000, 1000000));
    const otpExpires = new Date(Date.now() + OTP_TTL_MS);

    await prisma.user.update({
      where: { id: user.id },
      data: { otp, otpExpires },
    });

    let emailSent = true;
    try {
      await enqueueEmail({
        to: user.email,
        subject: "ChatFlow password reset code",
        html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
          <h2>Reset your ChatFlow password</h2>
          <p>Hi ${user.firstName || "there"},</p>
          <p>Use this one-time code to reset your password:</p>
          <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">${otp}</p>
          <p>This code expires in 10 minutes. If you did not request a reset, you can ignore this email.</p>
        </div>
        `,
      });
    } catch (error) {
      emailSent = false;
      console.error("Forgot password email enqueue failed:", error);
    }

    const debugEnabled =
      process.env.AUTH_OTP_DEBUG === "true" ||
      process.env.NODE_ENV !== "production";

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: GENERIC_MESSAGE,
      statusCode: RESPONSE_CODES.POST,
      data: {
        emailSent,
        ...(debugEnabled && (!emailSent || process.env.AUTH_OTP_DEBUG === "true")
          ? { debugOtp: otp }
          : {}),
      },
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
