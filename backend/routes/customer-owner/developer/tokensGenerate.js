const crypto = require("crypto");
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();
const RESPONSE_CODES = require("../../../config/responseCode");
const hashToken = require("../../../utils/hashToken");

router.post("/", async (req, res) => {
  try {
    const { userId } = req.auth;

    const rawToken = `cf_${crypto.randomBytes(24).toString("base64url")}`;
    const preview = rawToken.slice(-4);
    const tokenHash = hashToken(rawToken);

    // Keep payload compatible with currently loaded Prisma client.
    // Optional columns (label/tokenPreview) are written only when supported.
    const baseData = {
      userId,
      service: "MESSAGE",
      tokenHash,
      limitValue: null,
      usedValue: 0,
      isActive: true,
    };

    let token;
    try {
      token = await prisma.accessToken.create({
        data: {
          ...baseData,
          label: "API key",
          tokenPreview: preview,
        },
      });
    } catch (error) {
      if (
        error?.name === "PrismaClientValidationError" ||
        String(error?.message || "").includes("Unknown argument")
      ) {
        token = await prisma.accessToken.create({ data: baseData });
      } else {
        throw error;
      }
    }

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "API key generated",
      statusCode: RESPONSE_CODES.POST,
      data: {
        id: token.id,
        label: token.label || "API key",
        service: token.service,
        token: rawToken,
        maskedToken: `...${preview}`,
        preview,
        createdAt: token.createdAt,
      },
    });
  } catch (error) {
    console.log("Developer token generate error:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: error?.message || "Something went wrong",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
