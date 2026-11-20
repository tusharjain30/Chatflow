const crypto = require("crypto");

function extractVariables(text = "") {
  const regex = /\{\{\s*(\d+)\s*\}\}/g;
  const variables = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    variables.push(`{{${match[1]}}}`);
  }

  return variables.length ? variables : null;
}

function buildTemplateComponents({
  body,
  header,
  footer,
  buttons,
  variableSamples = {},
}) {
  const components = [];
  const bodyVariables = extractVariables(body);

  if (header) {
    if (header.type === "TEXT") {
      const headerComponent = {
        type: "HEADER",
        format: "TEXT",
        text: header.text,
      };

      const headerVariables = extractVariables(header.text || "");
      if (headerVariables?.length) {
        headerComponent.example = {
          header_text: headerVariables.map(
            (token) => variableSamples[token] || token,
          ),
        };
      }

      components.push(headerComponent);
    } else if (["IMAGE", "VIDEO", "DOCUMENT"].includes(header.type)) {
      components.push({
        type: "HEADER",
        format: header.type,
        example: {
          header_handle: [header.mediaHandle || "MEDIA_HANDLE_PENDING"],
        },
      });
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
      body_text: [
        bodyVariables.map((token) => variableSamples[token] || token),
      ],
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
}

function hashValue(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function isMissingTableError(error, modelNames) {
  if (error?.code !== "P2021") {
    return false;
  }

  const names = Array.isArray(modelNames) ? modelNames : [modelNames];
  return names.includes(error?.meta?.modelName);
}

async function runOptionalSeed(
  label,
  modelNames,
  callback,
  fallbackValue = null,
) {
  try {
    return await callback();
  } catch (error) {
    if (isMissingTableError(error, modelNames)) {
      const missingModel = error?.meta?.modelName || "unknown model";
      console.warn(`Skipping ${label}: ${missingModel} table not found.`);
      return fallbackValue;
    }

    throw error;
  }
}

function buildResellerTeamUserName(email) {
  return `${email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 12)}${Date.now().toString().slice(-4)}`;
}

function metricsFromAudienceStatuses(audienceStatuses = []) {
  return {
    totalContacts: audienceStatuses.length,
    sentCount: audienceStatuses.filter((status) =>
      ["SENT", "DELIVERED", "READ", "FAILED"].includes(status),
    ).length,
    deliveredCount: audienceStatuses.filter((status) =>
      ["DELIVERED", "READ"].includes(status),
    ).length,
    readCount: audienceStatuses.filter((status) => status === "READ").length,
    failedCount: audienceStatuses.filter((status) => status === "FAILED").length,
  };
}

module.exports = {
  extractVariables,
  buildTemplateComponents,
  hashValue,
  isMissingTableError,
  runOptionalSeed,
  buildResellerTeamUserName,
  metricsFromAudienceStatuses,
};
