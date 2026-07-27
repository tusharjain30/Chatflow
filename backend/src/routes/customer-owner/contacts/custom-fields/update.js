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

router.put("/", async (req, res) => {
  try {
    const { accountId } = req.auth;
    const { fieldId, name, type } = req.body;

    const formattedName = name
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const newKey = slugify(formattedName);

    if (!newKey) {
      return res.status(400).json({
        status: 0,
        message: "Invalid field name",
      });
    }

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

    try {
      const updated = await prisma.contactCustomField.update({
        where: { id: fieldId },
        data: {
          name: formattedName,
          key: newKey,
          type,
        },
      });

      res.status(200).json({
        status: 1,
        message: "Custom field updated successfully",
        data: updated,
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
    console.error("Update Custom Field Error:", err);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
    });
  }
});

module.exports = router;
