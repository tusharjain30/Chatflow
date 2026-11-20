const express = require("express");
const router = express.Router();
const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();
const RESPONSE_CODES = require("../../../config/responseCode");

function maskToken(token, preview) {
  if (preview) return `...${preview}`;
  if (!token) return "••••••••";
  return `...${token.slice(-4)}`;
}

router.get("/", async (req, res) => {
  try {
    const { userId } = req.auth;

    let tokens;
    try {
      tokens = await prisma.accessToken.findMany({
        where: { userId, isActive: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          service: true,
          label: true,
          tokenHash: true,
          tokenPreview: true,
          limitValue: true,
          usedValue: true,
          createdAt: true,
        },
      });
    } catch (error) {
      if (
        error?.name === "PrismaClientValidationError" ||
        String(error?.message || "").includes("Unknown field")
      ) {
        tokens = await prisma.accessToken.findMany({
          where: { userId, isActive: true },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            service: true,
            tokenHash: true,
            limitValue: true,
            usedValue: true,
            createdAt: true,
          },
        });
      } else {
        throw error;
      }
    }

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Access tokens loaded",
      statusCode: RESPONSE_CODES.GET,
      data: {
        tokens: tokens.map((token) => {
          const preview = token.tokenPreview || token.tokenHash?.slice(-4) || null;
          return {
            id: token.id,
            service: token.service,
            label: token.label || `${token.service} API key`,
            maskedToken: maskToken(token.tokenHash, preview),
            preview,
            limitValue: token.limitValue,
            usedValue: token.usedValue,
            createdAt: token.createdAt,
          };
        }),
      },
    });
  } catch (error) {
    console.log("Developer tokens list error:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: error?.message || "Something went wrong",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
