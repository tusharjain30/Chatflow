const buildTextPayload = (text, previewUrl = false) => ({
  type: "text",
  text: {
    body: text,
    preview_url: previewUrl
  }
});

const buildMediaPayload = ({ mediaType, mediaId, caption }) => {
  const key = mediaType.toLowerCase();

  const obj = {
    type: key,
    [key]: {
      id: mediaId
    }
  };

  if (caption) {
    obj[key].caption = caption;
  }

  return obj;
};

const buildButtonPayload = ({ bodyText, buttons }) => ({
  type: "interactive",
  interactive: {
    type: "button",
    body: { text: bodyText },
    action: {
      buttons: buttons.map(btn => ({
        type: "reply",
        reply: {
          id: btn.payload,
          title: btn.label
        }
      }))
    }
  }
});

const buildListPayload = ({ bodyText, buttonLabel, sections }) => ({
  type: "interactive",
  interactive: {
    type: "list",
    body: { text: bodyText },
    action: {
      button: buttonLabel,
      sections: sections.map(sec => ({
        title: sec.title,
        rows: sec.rows.map(row => ({
          id: row.rowId,
          title: row.title,
          description: row.description || undefined
        }))
      }))
    }
  }
});

const buildCtaPayload = ({ bodyText, text, url }) => ({
  type: "interactive",
  interactive: {
    type: "button",
    body: { text: bodyText },
    action: {
      buttons: [
        {
          type: "url",
          url: url,
          title: text
        }
      ]
    }
  }
});

module.exports = {
  buildTextPayload,
  buildMediaPayload,
  buildButtonPayload,
  buildListPayload,
  buildCtaPayload
};
