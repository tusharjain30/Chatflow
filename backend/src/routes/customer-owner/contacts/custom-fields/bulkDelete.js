const RESPONSE_CODES = require("../../../../config/responseCode");
const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();

router.delete("/", async (req, res) => {
  try {
    const { accountId } = req.auth;
    const { fieldIds } = req.body;

    /* ================= VALIDATE FIELDS ================= */
    const fields = await prisma.contactCustomField.findMany({
      where: {
        id: { in: fieldIds },
        accountId,
        isDeleted: false,
      },
      select: { id: true },
    });

    const validIds = fields.map((f) => f.id);
    const invalidIds = fieldIds.filter((id) => !validIds.includes(id));

    if (invalidIds.length) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Some field IDs are invalid",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: { invalidFieldIds: invalidIds },
      });
    }

    /* ================= TRANSACTION ================= */
    await prisma.$transaction(async (tx) => {
      // Delete all values first
      await tx.contactCustomValue.deleteMany({
        where: {
          fieldId: { in: validIds },
          accountId,
        },
      });

      // Soft delete fields
      await tx.contactCustomField.updateMany({
        where: {
          id: { in: validIds },
          accountId,
        },
        data: {
          isDeleted: true,
        },
      });
    });

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Custom fields deleted successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        deletedCount: validIds.length,
      },
    });
  } catch (error) {
    console.error("Bulk delete custom fields error:", error);

    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
