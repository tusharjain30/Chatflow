const RESPONSE_CODES = require("../../../../config/responseCode");
const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();

router.delete("/", async (req, res) => {
  try {
    const { accountId } = req.auth;
    const params = req.validatedParams;
    const contactId = params.contactId;

    /* ---------- CHECK CONTACT OWNERSHIP ---------- */
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        accountId,
        isDeleted: false,
      },
      select: { id: true },
    });

    if (!contact) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Contact not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    /* ---------- TRANSACTION DELETE ---------- */
    await prisma.$transaction(async (tx) => {
      // Delete group mappings
      await tx.contactGroupMap.deleteMany({
        where: {
          accountId,
          contactId,
        },
      });

      // Delete custom field values
      await tx.contactCustomValue.deleteMany({
        where: {
          accountId,
          contactId,
        },
      });

      // Soft delete contact
      await tx.contact.update({
        where: {
          id: contactId,
          accountId,
        },
        data: { isDeleted: true },
      });
    });

    res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Contact deleted successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {},
    });
  } catch (err) {
    console.log("Delete contact error:", err);
    res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
