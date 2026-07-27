const RESPONSE_CODES = require("../../../../config/responseCode");
const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();
const submitTemplateToMeta = require("../../../../services/Meta/submitTemplateToMeta.service");
const uploadTemplateMediaToMeta = require("../../../../services/Meta/uploadTemplateMediaToMeta");

const express = require("express");
const fs = require("fs");
const router = express.Router();

const extractVariables = (body) => {
  const regex = /\{\{\s*(\d+)\s*\}\}/g;
  const vars = [];
  let match;

  while ((match = regex.exec(body)) !== null) {
    vars.push(`{{${match[1]}}}`);
  }

  return vars.length ? vars : null;
};

router.post("/", async (req, res) => {
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

    if (template.status === "SUBMITTED") {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Template already submitted",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    if (template.status === "APPROVED") {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Approved template cannot be submitted again",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    if (template.category === "AUTHENTICATION" && Array.isArray(template.buttons) && template.buttons.length) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Buttons not allowed in AUTHENTICATION templates",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    const components = [];
    const variables = extractVariables(template.body);
    let nextHeader = template.header;
    const mediaFiles = Array.isArray(template.mediaFiles) ? template.mediaFiles : [];

    if (template.header) {
      if (["IMAGE", "VIDEO", "DOCUMENT"].includes(template.header.type)) {
        const mediaFile = mediaFiles[0];

        if (!mediaFile?.localPath || !fs.existsSync(mediaFile.localPath)) {
          return res.status(RESPONSE_CODES.BAD_REQUEST).json({
            status: 0,
            message: "Template media file not found for submission",
            statusCode: RESPONSE_CODES.BAD_REQUEST,
            data: {},
          });
        }

        const mediaHandle = await uploadTemplateMediaToMeta({
          filePath: mediaFile.localPath,
          accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
        });

        nextHeader = {
          ...template.header,
          mediaHandle,
        };

        components.push({
          type: "HEADER",
          format: template.header.type,
          example: {
            header_handle: [mediaHandle],
          },
        });
      } else if (template.header.type === "TEXT") {
        const headerComp = {
          type: "HEADER",
          format: "TEXT",
          text: template.header.text,
        };

        if (template.header.text?.includes("{{")) {
          headerComp.example = { header_text: ["Example"] };
        }

        components.push(headerComp);
      } else if (template.header.type === "LOCATION") {
        components.push({
          type: "HEADER",
          format: "LOCATION",
        });
      }
    }

    const bodyComp = {
      type: "BODY",
      text: template.body,
    };

    if (variables?.length) {
      bodyComp.example = {
        body_text: [variables.map(() => "Example")],
      };
    }

    components.push(bodyComp);

    if (template.footer?.text) {
      components.push({
        type: "FOOTER",
        text: template.footer.text,
      });
    }

    if (Array.isArray(template.buttons) && template.buttons.length) {
      const metaButtons = template.buttons
        .map((btn) => {
          if (btn.type === "URL") {
            return { type: "URL", text: btn.text, url: btn.url };
          }

          if (btn.type === "QUICK_REPLY") {
            return { type: "QUICK_REPLY", text: btn.text };
          }

          if (btn.type === "CALL") {
            return {
              type: "PHONE_NUMBER",
              text: btn.text,
              phone_number: btn.phoneNumber,
            };
          }

          return null;
        })
        .filter(Boolean);

      if (metaButtons.length) {
        components.push({ type: "BUTTONS", buttons: metaButtons });
      }
    }

    let metaResponse;
    try {
      metaResponse = await submitTemplateToMeta(
        template.name,
        template.category,
        template.language,
        components,
      );
    } catch (err) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: err.message || "Meta template submission failed",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    const updatedTemplate = await prisma.$transaction(async (tx) => {
      const updated = await tx.template.update({
        where: { id: template.id },
        data: {
          header: nextHeader,
          components,
          status: "SUBMITTED",
          metaTemplateId: metaResponse.id,
          rejectReason: null,
        },
      });

      return updated;
    });

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "Template submitted for Meta approval",
      statusCode: RESPONSE_CODES.POST,
      data: updatedTemplate,
    });
  } catch (error) {
    console.log("Submit Template Error:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;

