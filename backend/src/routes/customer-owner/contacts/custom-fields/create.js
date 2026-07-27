const RESPONSE_CODES = require("../../../../config/responseCode");
const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();

const slugify = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
};

router.post("/", async (req, res) => {
  try {
    const { accountId } = req.auth;
    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        status: 0,
        message: "Name and type are required",
      });
    }

    const normalizedName = name.toLowerCase().trim();
    const key = slugify(normalizedName);

    if (!key) {
      return res.status(400).json({
        status: 0,
        message: "Invalid field name",
      });
    }

    /* ================= CHECK EXISTING ================= */
    const existing = await prisma.contactCustomField.findFirst({
      where: {
        accountId,
        key,
      },
    });

    // ❌ Active exists
    if (existing && !existing.isDeleted) {
      return res.status(400).json({
        status: 0,
        message: "Custom field already exists",
      });
    }

    /* ================= TRANSACTION ================= */
    let field;

    if (existing && existing.isDeleted) {
      // 🔁 RESTORE + UPDATE
      field = await prisma.contactCustomField.update({
        where: { id: existing.id },
        data: {
          isDeleted: false,
          name,
          type,
          updatedAt: new Date(),
        },
      });

      return res.status(RESPONSE_CODES.POST).json({
        status: 1,
        message: "Custom field restored successfully",
        statusCode: RESPONSE_CODES.POST,
        data: field,
      });
    }

    /* ================= LIMIT CHECK (ONLY FOR NEW CREATE) ================= */
    const count = await prisma.contactCustomField.count({
      where: { accountId, isDeleted: false },
    });

    if (count >= 50) {
      return res.status(400).json({
        status: 0,
        message: "Maximum 50 custom fields allowed",
      });
    }

    /* ================= CREATE ================= */
    try {
      field = await prisma.contactCustomField.create({
        data: {
          accountId,
          name,
          key,
          type,
        },
      });

      return res.status(RESPONSE_CODES.POST).json({
        status: 1,
        message: "Custom field created successfully",
        statusCode: RESPONSE_CODES.POST,
        data: field,
      });
    } catch (err) {
      if (err.code === "P2002") {
        return res.status(400).json({
          status: 0,
          message: "Custom field already exists",
        });
      }
      throw err;
    }
  } catch (err) {
    console.error("Create/Restore custom field error:", err);

    return res.status(500).json({
      status: 0,
      message: "Internal server error",
    });
  }
});

module.exports = router;
