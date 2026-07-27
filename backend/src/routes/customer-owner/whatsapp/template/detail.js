const RESPONSE_CODES = require("../../../../config/responseCode");
const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();
const express = require("express");
const router = express.Router({ mergeParams: true });

router.get("/", async (req, res) => {
  try {
    const { accountId } = req.auth;
    const { templateId } = req.params;

    const template = await prisma.template.findFirst({
      where: {
        id: templateId,
        accountId,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        category: true,
        language: true,
        body: true,
        header: true,
        footer: true,
        buttons: true,
        components: true,
        mediaFiles: true,
        builderData: true,
        metaTemplateId: true,
        rejectReason: true,
        status: true,
        isActive: true,
        createdByUserId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!template) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Template not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Template fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: template,
    });
  } catch (error) {
    console.log("Template Detail Error:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
