const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const RESPONSE_CODES = require("../../../config/responseCode");

router.post("/", async (req, res) => {
  try {
    const { campaignId, contactIds = [], groupIds = [] } = req.body;
    const { accountId } = req.auth;

    // =========================
    // Basic Validation
    // =========================
    if (!campaignId) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "campaignId is required",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    if (!contactIds.length && !groupIds.length) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Provide at least contactIds or groupIds",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

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
        message: "Audience can only be added to draft campaigns",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    // =========================
    // Fetch Direct Contacts
    // =========================
    const contactsFromIds = await prisma.contact.findMany({
      where: {
        id: { in: contactIds },
        accountId,
        isDeleted: false,
      },
      select: { id: true },
    });

    // =========================
    // Fetch Group Contacts (validated)
    // =========================
    let groupContactIds = [];

    if (groupIds.length) {
      const groupMappings = await prisma.contactGroupMap.findMany({
        where: {
          groupId: { in: groupIds },
          accountId,
        },
        select: {
          contactId: true,
        },
      });

      const rawGroupIds = groupMappings.map((g) => g.contactId);

      // validate contacts again
      const validGroupContacts = await prisma.contact.findMany({
        where: {
          id: { in: rawGroupIds },
          accountId,
          isDeleted: false,
        },
        select: { id: true },
      });

      groupContactIds = validGroupContacts.map((c) => c.id);
    }

    // =========================
    // Merge + Unique
    // =========================
    const allContactIds = [
      ...contactsFromIds.map((c) => c.id),
      ...groupContactIds,
    ];

    const uniqueContactIds = [...new Set(allContactIds)];

    if (!uniqueContactIds.length) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "No valid contacts found",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    // =========================
    // Prepare Data
    // =========================
    const audienceData = uniqueContactIds.map((contactId) => ({
      campaignId,
      contactId,
      status: "PENDING",
    }));

    // =========================
    // Transaction (IMPORTANT)
    // =========================
    const result = await prisma.$transaction(async (tx) => {
      const insertResult = await tx.campaignAudience.createMany({
        data: audienceData,
        skipDuplicates: true,
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
          type: "INFO",
          message: `Audience added: ${insertResult.count}`,
        },
      });

      return {
        addedCount: insertResult.count,
        totalContacts,
      };
    });

    // =========================
    // Response
    // =========================
    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "Audience added successfully",
      statusCode: RESPONSE_CODES.POST,
      data: {
        requested: contactIds.length + groupIds.length,
        added: result.addedCount,
        totalContacts: result.totalContacts,
      },
    });
  } catch (error) {
    console.log("Add Audience Error:", error);

    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Something went wrong",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
