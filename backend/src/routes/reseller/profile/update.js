const express = require("express");

const RESPONSE_CODES = require("../../../config/responseCode");
import prisma from "../../../config/prisma";
const router = express.Router();

router.put("/", async (req, res) => {
  try {
    if (req.auth.userType !== "RESELLER") {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        status: 0,
        message: "Reseller access required",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    const reseller = await prisma.reseller.update({
      where: { id: req.auth.resellerId },
      data: req.body,
    });

    const { password, tokenVersion, ...safeReseller } = reseller;

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Reseller profile updated successfully",
      statusCode: RESPONSE_CODES.GET,
      data: safeReseller,
    });
  } catch (error) {
    console.error("RESELLER PROFILE UPDATE ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
