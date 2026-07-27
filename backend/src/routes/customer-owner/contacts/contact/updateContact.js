const RESPONSE_CODES = require("../../../../config/responseCode");
const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();

router.put("/", async (req, res) => {
  try {
    const { accountId } = req.auth;

    const {
      contactId,
      firstName,
      lastName,
      country,
      languageCode,
      email,
      isOptedOut,
      groups,
      customFields,
    } = req.body;

    // Check contact exists
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, accountId, isDeleted: false },
    });

    if (!contact) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Contact not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update main contact
      await tx.contact.update({
        where: { id: contactId },
        data: {
          ...(firstName !== undefined && { firstName }),
          ...(lastName !== undefined && { lastName }),
          ...(country !== undefined && { country }),
          ...(languageCode !== undefined && { languageCode }),
          ...(email !== undefined && { email }),
          ...(isOptedOut !== undefined && { isOptedOut }),
        },
      });

      /* ===============================
            UPDATE GROUPS (REPLACE MODE)
            =============================== */
      if (groups !== undefined) {
        if (!Array.isArray(groups)) {
          throw new Error("GROUPS_MUST_BE_ARRAY");
        }

        if (groups.length) {
          const existingGroups = await tx.contactGroup.findMany({
            where: {
              accountId,
              id: { in: groups },
              isDeleted: false,
            },
            select: { id: true },
          });

          const validIds = existingGroups.map((g) => g.id);
          const invalid = groups.filter((id) => !validIds.includes(id));

          if (invalid.length) {
            throw new Error("INVALID_GROUP_IDS:" + invalid.join(","));
          }

          await tx.contactGroupMap.deleteMany({
            where: {
              contactId,
              contact: {
                accountId,
              },
            },
          });

          await tx.contactGroupMap.createMany({
            data: validIds.map((gid) => ({
              contactId,
              groupId: gid,
              accountId,
            })),
          });
        } else {
          // Empty array => remove all groups
          await tx.contactGroupMap.deleteMany({
            where: {
              contactId,
              contact: {
                accountId,
              },
            },
          });
        }
      }

      /* ===============================
            UPDATE CUSTOM FIELDS (REPLACE MODE)
      =============================== */
      if (customFields !== undefined) {
        if (typeof customFields !== "object") {
          throw new Error("CUSTOM_FIELDS_INVALID");
        }

        await tx.contactCustomValue.deleteMany({
          where: {
            contactId,
            contact: {
              accountId,
            },
          },
        });

        const keys = Object.keys(customFields || {});

        if (keys.length) {
          const fields = await tx.contactCustomField.findMany({
            where: {
              accountId,
              key: { in: keys },
              isDeleted: false,
            },
          });

          const fieldMap = new Map(fields.map((f) => [f.key, f.id]));

          const invalidKeys = keys.filter((k) => !fieldMap.has(k));
          if (invalidKeys.length) {
            throw new Error("INVALID_CUSTOM_FIELDS:" + invalidKeys.join(","));
          }

          await tx.contactCustomValue.createMany({
            data: keys.map((key) => ({
              contactId,
              fieldId: fieldMap.get(key),
              value: String(customFields[key]),
            })),
          });
        }
      }

      /* ===============================
                RETURN FULL UPDATED CONTACT
            =============================== */
      return tx.contact.findFirst({
        where: { id: contactId },
        include: {
          groups: {
            include: { group: true },
          },
          customValues: {
            include: { field: true },
          },
        },
      });
    });

    res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Contact updated successfully",
      statusCode: RESPONSE_CODES.GET,
      data: result,
    });
  } catch (error) {
    if (error.message === "GROUPS_MUST_BE_ARRAY") {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "groups must be an array",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    if (error.message === "CUSTOM_FIELDS_INVALID") {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "customFields must be an object",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    if (error.message?.startsWith("INVALID_GROUP_IDS:")) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Some group IDs are invalid",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {
          invalidGroupIds: error.message
            .replace("INVALID_GROUP_IDS:", "")
            .split(","),
        },
      });
    }

    if (error.message?.startsWith("INVALID_CUSTOM_FIELDS:")) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Some custom field keys are invalid",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {
          invalidKeys: error.message
            .replace("INVALID_CUSTOM_FIELDS:", "")
            .split(","),
        },
      });
    }

    console.log("Update contact error:", error);
    res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
