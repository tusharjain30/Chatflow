const RESPONSE_CODES = require("../../../../config/responseCode");
const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();

router.post("/", async (req, res) => {
  try {
    const { accountId, userId } = req.auth;
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({
        status: 0,
        message: "Title is required",
      });
    }

    const normalizedTitle = title.trim();

    /* ================= CHECK EXISTING ================= */
    const existing = await prisma.contactGroup.findFirst({
      where: {
        accountId,
        title: {
          equals: normalizedTitle,
          mode: "insensitive",
        },
      },
    });

    // Active group exists
    if (existing && !existing.isDeleted) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Group with this title already exists",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    let group;

    /* ================= RESTORE OR CREATE ================= */
    if (existing && existing.isDeleted) {
      //  RESTORE + UPDATE
      group = await prisma.contactGroup.update({
        where: { id: existing.id },
        data: {
          isDeleted: false,
          isArchived: false,
          title: normalizedTitle,
          description,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          title: true,
          description: true,
          createdAt: true,
        },
      });

      return res.status(RESPONSE_CODES.POST).json({
        status: 1,
        message: "Group restored successfully",
        statusCode: RESPONSE_CODES.POST,
        data: group,
      });
    }

    /* ================= CREATE ================= */
    group = await prisma.contactGroup.create({
      data: {
        accountId,
        title: normalizedTitle,
        description,
        createdByUserId: userId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
      },
    });

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "Group created successfully",
      statusCode: RESPONSE_CODES.POST,
      data: group,
    });
  } catch (error) {
    console.log("Create/Restore Group Error:", error);

    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
