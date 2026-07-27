const RESPONSE_CODES = require("../../../../config/responseCode");
const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();

router.patch("/", async (req, res) => {
  try {
    const { accountId } = req.auth;
    const { groupIds } = req.body;

    // Fetch all groups of this user
    const groups = await prisma.contactGroup.findMany({
      where: {
        id: { in: groupIds },
        accountId,
        isDeleted: false,
      },
      select: {
        id: true,
        isArchived: true,
      },
    });

    if (!groups.length) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "No valid groups found",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    const toArchive = groups.filter((g) => !g.isArchived).map((g) => g.id);
    const toUnarchive = groups.filter((g) => g.isArchived).map((g) => g.id);

    /* ---------- BUILD TRANSACTION ARRAY ---------- */
    const tx = [];

    if (toArchive.length) {
      tx.push(
        prisma.contactGroup.updateMany({
          where: { id: { in: toArchive } },
          data: { isArchived: true },
        })
      );
    }

    if (toUnarchive.length) {
      tx.push(
        prisma.contactGroup.updateMany({
          where: { id: { in: toUnarchive } },
          data: { isArchived: false },
        })
      );
    }

    /* ---------- EXECUTE TRANSACTION ---------- */
    const results = await prisma.$transaction(tx);

    const updatedCount = results.reduce((sum, r) => sum + r.count, 0);

    res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Selected groups archive status toggled successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        updatedCount,
        archived: toArchive.length,
        unarchived: toUnarchive.length,
      },
    });
  } catch (error) {
    console.log("Bulk toggle archive error:", error);
    res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
