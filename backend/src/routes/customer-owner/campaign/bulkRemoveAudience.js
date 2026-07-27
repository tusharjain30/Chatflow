const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const RESPONSE_CODES = require("../../../config/responseCode");

router.post("/", async (req, res) => {
  try {
    const { campaignId, contactIds, groupIds } = req.body;
    const { accountId } = req.auth;

    // =========================
    // Validate Campaign
    // =========================
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        accountId,
        isDeleted: false,
      },
    });

    if (!campaign) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Campaign not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    // =========================
    // Only DRAFT allowed
    // =========================
    if (campaign.status !== "DRAFT") {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Audience can only be removed from draft campaigns",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    // =========================
    // Fetch Direct Contacts
    // =========================
    const directContacts = await prisma.contact.findMany({
      where: {
        id: { in: contactIds },
        accountId,
        isDeleted: false,
      },
      select: { id: true },
    });

    // =========================
    // Fetch Group Contacts
    // =========================
    let groupContactIds = [];

    if (groupIds.length) {
      const groupMappings = await prisma.contactGroupMap.findMany({
        where: {
          groupId: { in: groupIds },
          accountId,
        },
        select: { contactId: true },
      });

      const rawIds = groupMappings.map((g) => g.contactId);

      const validContacts = await prisma.contact.findMany({
        where: {
          id: { in: rawIds },
          accountId,
          isDeleted: false,
        },
        select: { id: true },
      });

      groupContactIds = validContacts.map((c) => c.id);
    }

    // =========================
    // Merge + Unique
    // =========================
    const allContactIds = [
      ...directContacts.map((c) => c.id),
      ...groupContactIds,
    ];

    const uniqueIds = [...new Set(allContactIds)];

    if (!uniqueIds.length) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "No valid contacts found",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    // =========================
    // Transaction
    // =========================
    const result = await prisma.$transaction(async (tx) => {
      const deleted = await tx.campaignAudience.deleteMany({
        where: {
          campaignId,
          contactId: { in: uniqueIds },
        },
      });

      const totalContacts = await tx.campaignAudience.count({
        where: { campaignId },
      });

      await tx.campaign.update({
        where: { id: campaignId },
        data: { totalContacts },
      });

      await tx.campaignLog.create({
        data: {
          campaignId,
          type: "WARNING",
          message: `Bulk audience removed: ${deleted.count}`,
        },
      });

      return {
        removed: deleted.count,
        totalContacts,
      };
    });

    // =========================
    // Response
    // =========================
    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Bulk audience removed successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        requested: (contactIds.length || 0) + (groupIds.length || 0),
        removed: result.removed,
        skipped: contactIds.length + groupIds.length - result.removed,
        totalContacts: result.totalContacts,
      },
    });
  } catch (error) {
    console.log("Bulk Remove Audience Error:", error);

    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Something went wrong",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
