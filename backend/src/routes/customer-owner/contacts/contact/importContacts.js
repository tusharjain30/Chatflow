const RESPONSE_CODES = require("../../../../config/responseCode");
const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();

const fs = require("fs");
const csv = require("csv-parser");

const uploadCsv = require("../../../../middleware/uploadCsv");

router.post(
  "/",
  (req, res, next) => {
    uploadCsv.single("file")(req, res, function (err) {
      if (err) {
        return res.status(RESPONSE_CODES.BAD_REQUEST).json({
          status: 0,
          message: err.message,
          statusCode: RESPONSE_CODES.BAD_REQUEST,
          data: {},
        });
      }
      next();
    });
  },

  async (req, res) => {
    const { accountId, userId } = req.auth;

    if (!req.file) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "CSV file is required",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    const groupIds = req.body.groupIds
      ? req.body.groupIds.split(",").map((id) => id.trim())
      : [];

    let total = 0;
    let skipped = 0;

    const contacts = [];

    try {
      /* ---------- VERIFY GROUPS ---------- */
      let validGroupIds = [];

      if (groupIds.length) {
        const groups = await prisma.contactGroup.findMany({
          where: {
            id: { in: groupIds },
            accountId,
            isDeleted: false,
          },
          select: { id: true },
        });

        validGroupIds = groups.map((g) => g.id);
      }

      /* ---------- READ CSV ---------- */
      await new Promise((resolve, reject) => {
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on("data", (row) => {
            total++;

            const phone = row.phone?.trim();
            if (!phone) {
              skipped++;
              return;
            }

            contacts.push({
              accountId,
              createdByUserId: userId || null,
              phone,
              firstName: row.firstName || null,
              lastName: row.lastName || null,
              email: row.email || null,
              country: row.country || null,
              languageCode: row.languageCode || null,
              isOptedOut: row.isOptedOut === "true" || row.isOptedOut === true,
            });
          })
          .on("end", resolve)
          .on("error", reject);
      });

      /* ---------- REMOVE DUPLICATES ---------- */
      const phones = contacts.map((c) => c.phone);

      const existing = await prisma.contact.findMany({
        where: {
          accountId,
          phone: { in: phones },
          isDeleted: false,
        },
        select: { phone: true },
      });

      const existingPhones = new Set(existing.map((c) => c.phone));

      const filteredContacts = contacts.filter((c) => {
        if (existingPhones.has(c.phone)) {
          skipped++;
          return false;
        }
        return true;
      });

      /* ---------- BULK INSERT ---------- */
      const created = await prisma.contact.createMany({
        data: filteredContacts,
        skipDuplicates: true,
      });

      /* ---------- FETCH CREATED CONTACTS ---------- */
      const createdContacts = await prisma.contact.findMany({
        where: {
          accountId,
          phone: { in: filteredContacts.map((c) => c.phone) },
        },
        select: { id: true },
      });

      /* ---------- GROUP ASSIGN ---------- */
      if (validGroupIds.length && createdContacts.length) {
        const mappings = [];

        for (const contact of createdContacts) {
          for (const groupId of validGroupIds) {
            mappings.push({
              accountId,
              contactId: contact.id,
              groupId,
            });
          }
        }

        await prisma.contactGroupMap.createMany({
          data: mappings,
          skipDuplicates: true,
        });
      }

      /* ---------- CLEANUP FILE ---------- */
      if (req.file?.path) {
        fs.unlink(req.file.path, () => {});
      }

      res.status(RESPONSE_CODES.POST).json({
        status: 1,
        message: "Contacts imported successfully",
        statusCode: RESPONSE_CODES.POST,
        data: {
          summary: {
            total,
            inserted: created.count,
            skipped,
          },
        },
      });
    } catch (err) {
      console.error("Import contacts error:", err);

      res.status(RESPONSE_CODES.ERROR).json({
        status: 0,
        message: "Internal server error",
        statusCode: RESPONSE_CODES.ERROR,
        data: {},
      });
    }
  },
);

module.exports = router;
