const RESPONSE_CODES = require("../../../../config/responseCode");
const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();

router.patch("/", async (req, res) => {
  try {
    const { accountId } = req.auth;
    const { groupId } = req.body;

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

    const updated = await prisma.contactGroup.update({
      where: { id: groupId },
      data: {
        isArchived: !group.isArchived,
      },
    });

    res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: updated.isArchived
        ? "Group archived successfully"
        : "Group unarchived successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        id: updated.id,
        isArchived: updated.isArchived,
      },
    });
  } catch (error) {
    console.error("Toggle archive group error:", error);
    res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
