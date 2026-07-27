const express = require("express");

const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

router.patch("/", async (req, res) => {
  try {
    if (req.admin.role?.roleType !== "SYSTEM_ADMIN") {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        status: 0,
        message: "Access denied",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    const { resellerId, isActive } = req.body;
    const reseller = await prisma.reseller.findFirst({
      where: {
        id: resellerId,
        isDeleted: false,
      },
    });

    if (!reseller) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Reseller not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    const updated = await prisma.reseller.update({
      where: { id: reseller.id },
      data: { isActive },
    });

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: `Reseller ${isActive ? "activated" : "suspended"} successfully`,
      statusCode: RESPONSE_CODES.GET,
      data: {
        id: updated.id,
        isActive: updated.isActive,
      },
    });
  } catch (error) {
    console.log("RESELLER STATUS UPDATE ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
