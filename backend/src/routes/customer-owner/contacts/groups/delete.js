const RESPONSE_CODES = require("../../../../config/responseCode");
const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();

router.delete("/", async (req, res) => {
  try {
    const { accountId } = req.auth;
    const { groupId } = req.validatedParams;

    const group = await prisma.contactGroup.findFirst({
      where: {
        id: groupId,
        accountId,
        isDeleted: false,
      },
    });

    if (!group) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Group not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    await prisma.$transaction([
      // 1. Soft delete group
      prisma.contactGroup.update({
        where: { id: groupId },
        data: {
          isDeleted: true,
          isArchived: false,
        },
      }),

      // 2. Remove all mappings
      prisma.contactGroupMap.deleteMany({
        where: { groupId },
      }),
    ]);

    res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Group deleted successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {},
    });
  } catch (error) {
    console.error("Delete group error:", error);
    res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
