const RESPONSE_CODES = require("../../../../config/responseCode");
const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();
const express = require("express");
const router = express.Router();

const extractVariables = (text = "") => {
  const regex = /\{\{\s*(\d+)\s*\}\}/g;
  const variables = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    variables.push(`{{${match[1]}}}`);
  }

  return variables.length ? variables : null;
};

const buildTemplateComponents = ({ body, header, footer, buttons, variableSamples = {} }) => {
  const components = [];
  const bodyVariables = extractVariables(body);

  if (header) {
    if (["IMAGE", "VIDEO", "DOCUMENT"].includes(header.type)) {
      components.push({
        type: "HEADER",
        format: header.type,
        example: {
          header_handle: [header.mediaHandle || "MEDIA_HANDLE_PENDING"],
        },
      });
    } else if (header.type === "TEXT") {
      const headerComponent = {
        type: "HEADER",
        format: "TEXT",
        text: header.text,
      };

      const headerVariables = extractVariables(header.text || "");
      if (headerVariables?.length) {
        headerComponent.example = {
          header_text: headerVariables.map((token) => variableSamples[token] || token),
        };
      }

      components.push(headerComponent);
    } else if (header.type === "LOCATION") {
      components.push({
        type: "HEADER",
        format: "LOCATION",
      });
    }
  }

  const bodyComponent = {
    type: "BODY",
    text: body,
  };

  if (bodyVariables?.length) {
    bodyComponent.example = {
      body_text: [bodyVariables.map((token) => variableSamples[token] || token)],
    };
  }

  components.push(bodyComponent);

  if (footer?.text) {
    components.push({
      type: "FOOTER",
      text: footer.text,
    });
  }

  if (Array.isArray(buttons) && buttons.length) {
    const mappedButtons = buttons
      .map((button) => {
        if (button.type === "URL") {
          return { type: "URL", text: button.text, url: button.url };
        }

        if (button.type === "QUICK_REPLY") {
          return { type: "QUICK_REPLY", text: button.text };
        }

        if (button.type === "CALL") {
          return {
            type: "PHONE_NUMBER",
            text: button.text,
            phone_number: button.phoneNumber,
          };
        }

        return null;
      })
      .filter(Boolean);

    if (mappedButtons.length) {
      components.push({
        type: "BUTTONS",
        buttons: mappedButtons,
      });
    }
  }

  return components;
};

const getDuplicateName = async ({ accountId, name, language, startCounter = 1 }) => {
  const normalizedBaseName = name.replace(/_copy(?:_\d+)?$/, "");
  const baseName = `${normalizedBaseName}_copy`;
  let counter = startCounter;

  while (true) {
    const nextName = counter === 1 ? baseName : `${baseName}_${counter}`;
    const existingTemplate = await prisma.template.findFirst({
      where: {
        accountId,
        name: nextName,
        language,
        isDeleted: false,
      },
      select: { id: true },
    });

    if (!existingTemplate) {
      return { duplicateName: nextName, nextCounter: counter + 1 };
    }

    counter += 1;
  }
};

router.post("/", async (req, res) => {
  try {
    const { accountId, userId } = req.auth;
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

    const currentBuilderData = template.builderData || {};
    const nextHeader =
      template.header && typeof template.header === "object" && !Array.isArray(template.header)
        ? Object.fromEntries(
            Object.entries(template.header).filter(([key, value]) => key !== "mediaHandle" && value !== undefined),
          )
        : template.header || null;

    let duplicatedTemplate = null;
    let duplicateName = null;
    let nextCounter = 1;

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const duplicateResult = await getDuplicateName({
        accountId,
        name: template.name,
        language: template.language,
        startCounter: nextCounter,
      });
      duplicateName = duplicateResult.duplicateName;
      nextCounter = duplicateResult.nextCounter;

      const nextBuilderData = {
        ...currentBuilderData,
        originalName: currentBuilderData.originalName
          ? currentBuilderData.originalName.replace(/ Copy(?: \d+)?$/, "") + " Copy"
          : duplicateName,
        normalizedName: duplicateName,
        mediaPreview: Array.isArray(template.mediaFiles)
          ? template.mediaFiles[0] || null
          : null,
      };

      const nextComponents = buildTemplateComponents({
        body: template.body,
        header: nextHeader,
        footer: template.footer,
        buttons: template.buttons,
        variableSamples: nextBuilderData.variableSamples || {},
      });

      const templatePayload = {
        accountId,
        createdByUserId: userId,
        name: duplicateName,
        category: template.category,
        language: template.language,
        body: template.body,
        header: nextHeader,
        footer: template.footer,
        buttons: template.buttons,
        components: nextComponents,
        mediaFiles: template.mediaFiles,
        builderData: nextBuilderData,
        status: "DRAFT",
        metaTemplateId: null,
        rejectReason: null,
        isActive: true,
        isDeleted: false,
      };

      const deletedTemplate = await prisma.template.findFirst({
        where: {
          accountId,
          name: duplicateName,
          language: template.language,
          isDeleted: true,
        },
      });

      try {
        duplicatedTemplate = deletedTemplate
          ? await prisma.template.update({
              where: { id: deletedTemplate.id },
              data: templatePayload,
            })
          : await prisma.template.create({
              data: templatePayload,
            });
        break;
      } catch (error) {
        if (error?.code !== "P2002") {
          throw error;
        }
      }
    }

    if (!duplicatedTemplate) {
      throw new Error("Unable to generate a unique duplicate template name");
    }

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "Template duplicated successfully",
      statusCode: RESPONSE_CODES.POST,
      data: duplicatedTemplate,
    });
  } catch (error) {
    console.log("Duplicate Template Error:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
