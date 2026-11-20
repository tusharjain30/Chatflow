const express = require("express");
const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const { requireSystemAdmin } = require("./_helpers");

const prisma = new PrismaClient();
const router = express.Router({ mergeParams: true });

router.patch("/", async (req, res) => {
  try {
    if (!requireSystemAdmin(req, res, RESPONSE_CODES)) return;

    const { id } = req.params;
    const account = await prisma.customerAccount.findFirst({
      where: { id, isDeleted: false },
    });

    if (!account) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Tenant not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    const data = {};
    const fields = [
      "companyName",
      "address",
      "city",
      "state",
      "zipCode",
      "country",
      "timezone",
      "notificationSoundEnabled",
      "campaignResendEnabled",
      "creditBalance",
      "resellerId",
    ];
    fields.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        data[key] = req.body[key];
      }
    });

    const updated = await prisma.customerAccount.update({
      where: { id },
      data,
    });

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Tenant updated successfully",
      statusCode: RESPONSE_CODES.GET,
      data: updated,
    });
  } catch (error) {
    console.log("TENANT UPDATE ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
