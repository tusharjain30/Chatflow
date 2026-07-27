module.exports = ({ template, to, variables = [] }) => {
  const components = [];

  if (variables.length > 0) {
    components.push({
      type: "body",
      parameters: variables.map(v => ({
        type: "text",
        text: String(v)
      }))
    });
  }

  return {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: template.name,
      language: {
        code: template.language || "en_US"
      },
      components
    }
  };
};
