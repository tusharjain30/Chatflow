const express = require("express");
const router = express.Router({ mergeParams: true });
const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();
const RESPONSE_CODES = require("../../../config/responseCode");

router.delete("/", async (req, res) => {
  try {
    const { userId } = req.auth;
    const tokenId = req.params.tokenId;

    const existing = await prisma.accessToken.findFirst({
      where: { id: tokenId, userId, isActive: true },
    });

    if (!existing) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Access token not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    await prisma.accessToken.update({
      where: { id: existing.id },
      data: { isActive: false },
    });

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Access token deleted",
      statusCode: RESPONSE_CODES.GET,
      data: { id: existing.id },
    });
  } catch (error) {
    console.log("Developer token delete error:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Something went wrong",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
