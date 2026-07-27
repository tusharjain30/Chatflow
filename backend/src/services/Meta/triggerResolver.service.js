module.exports = ({ text, buttonPayload, listPayload }) => {
  const conditions = [];

  if (buttonPayload) {
    conditions.push({
      triggerType: "BUTTON",
      triggerValue: buttonPayload
    });
  }

  if (listPayload) {
    conditions.push({
      triggerType: "LIST",
      triggerValue: listPayload
    });
  }

  if (text) {
    const normalizedText = text.trim().toLowerCase();

    conditions.push(
      { triggerType: "IS", triggerValue: normalizedText },
      { triggerType: "STARTS_WITH", triggerValue: normalizedText },
      { triggerType: "CONTAINS_WORD", triggerValue: normalizedText },
      { triggerType: "CONTAINS", triggerValue: normalizedText }
    );
  }

  // Always last
  conditions.push({ triggerType: "DEFAULT" });

  return conditions;
};
