module.exports = function normalizeIncomingMessage(message) {
  const type = message.type;

  const normalized = {
    type,
    text: null,
    buttonPayload: null,
    listPayload: null,
    media: null,
    location: null
  };

  switch (type) {
    case "text":
      normalized.text = message.text?.body?.trim().toLowerCase() || null;
      break;

    case "button":
      normalized.buttonPayload = message.button?.payload || null;
      break;

    case "interactive":
      if (message.interactive?.button_reply) {
        normalized.buttonPayload = message.interactive.button_reply.id;
      }
      if (message.interactive?.list_reply) {
        normalized.listPayload = message.interactive.list_reply.id;
      }
      break;

    case "image":
    case "video":
    case "document":
    case "audio":
      normalized.media = {
        type,
        id: message[type]?.id,
        mimeType: message[type]?.mime_type
      };
      normalized.text = "__MEDIA__"; // for trigger system
      break;

    case "location":
      normalized.location = message.location;
      normalized.text = "__LOCATION__";
      break;
  }

  return normalized;
};
