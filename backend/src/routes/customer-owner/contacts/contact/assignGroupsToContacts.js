const RESPONSE_CODES = require("../../../../config/responseCode");
const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();

router.post("/", async (req, res) => {
  try {
    const { accountId } = req.auth;
    const { contactIds, groupIds } = req.body;

    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "contactIds is required",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    if (!Array.isArray(groupIds) || groupIds.length === 0) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "groupIds is required",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    const contacts = await prisma.contact.findMany({
      where: {
        id: { in: contactIds },
        accountId,
        isDeleted: false,
      },
      select: { id: true },
    });

    if (contacts.length !== contactIds.length) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Some contacts not found",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    const groups = await prisma.contactGroup.findMany({
      where: {
        id: { in: groupIds },
        accountId,
        isDeleted: false,
      },
      select: { id: true },
    });

    if (groups.length !== groupIds.length) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Some groups not found",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    const rows = contactIds.flatMap((contactId) =>
      groupIds.map((groupId) => ({
        contactId,
        groupId,
        accountId,
      })),
    );

    const result = await prisma.contactGroupMap.createMany({
      data: rows,
      skipDuplicates: true,
    });

    res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "Groups assigned successfully",
      statusCode: RESPONSE_CODES.POST,
      data: {
        inserted: result.count,
        skipped: rows.length - result.count,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
