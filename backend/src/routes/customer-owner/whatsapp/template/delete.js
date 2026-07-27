const RESPONSE_CODES = require("../../../../config/responseCode");
const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();
const express = require("express");
const router = express.Router();

router.delete("/", async (req, res) => {
  try {
    const { accountId } = req.auth;
    const { templateId } = req.body;

    const template = await prisma.template.findFirst({
      where: {
        id: templateId,
        accountId,
        isDeleted: false,
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

    if (["SUBMITTED", "APPROVED"].includes(template.status)) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Submitted or approved templates cannot be deleted",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    await prisma.template.update({
      where: { id: templateId },
      data: {
        isDeleted: true,
        isActive: false,
      },
    });

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Template deleted successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {},
    });
  } catch (error) {
    console.log("Delete Template Error:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;

