const RESPONSE_CODES = require("../../../../config/responseCode");
const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();

router.delete("/", async (req, res) => {
  try {
    const { accountId } = req.auth;
    const { contactIds } = req.body;

    // Ensure numbers
    const ids = contactIds;

    /* ---------- FIND USER CONTACTS ONLY ---------- */
    const contacts = await prisma.contact.findMany({
      where: {
        id: { in: ids },
        accountId,
        isDeleted: false,
      },
      select: { id: true },
    });

    if (contacts.length === 0) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "No valid contacts found to delete",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    const validIds = contacts.map((c) => c.id);

    /* ---------- TRANSACTION ---------- */
    await prisma.$transaction(async (tx) => {
      // Delete group mappings
      await tx.contactGroupMap.deleteMany({
        where: {
          contactId: { in: validIds },
        },
      });

      // Delete custom field values
      await tx.contactCustomValue.deleteMany({
        where: {
          accountId,
          contactId: { in: validIds },
        },
      });

      // Soft delete contacts
      await tx.contact.updateMany({
        where: {
          id: { in: validIds },
          accountId,
        },
        data: {
          isDeleted: true,
        },
      });
    });

    res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Contacts deleted successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        requested: ids.length,
        deleted: validIds.length,
        skipped: ids.length - validIds.length,
      },
    });
  } catch (err) {
    console.error("Bulk delete contacts error:", err);
    res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
