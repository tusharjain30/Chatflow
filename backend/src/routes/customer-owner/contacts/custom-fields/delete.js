const RESPONSE_CODES = require("../../../../config/responseCode");
const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();

router.delete("/", async (req, res) => {
  try {
    const { accountId } = req.auth;
    const { fieldId } = req.validatedParams;

    const field = await prisma.contactCustomField.findUnique({
      where: { id: fieldId },
    });

    if (!field || field.accountId !== accountId || field.isDeleted) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Custom field not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    await prisma.$transaction([
      prisma.contactCustomValue.deleteMany({
        where: { fieldId },
      }),
      prisma.contactCustomField.update({
        where: { id: fieldId },
        data: { isDeleted: true },
      }),
    ]);

    res.status(200).json({
      status: 1,
      message: "Custom field deleted successfully",
      data: {},
    });
  } catch (err) {
    console.error("Delete Custom Field Error:", err);
    res.status(500).json({
      status: 0,
      message: "Internal server error",
    });
  }
});

module.exports = router;
