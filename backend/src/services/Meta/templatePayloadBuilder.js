module.exports.buildTemplatePayload = ({ name, language, variables }) => ({
  type: "template",
  template: {
    name,
    language: { code: language },
    components: [
      {
        type: "body",
        parameters: variables.map(v => ({
          type: "text",
          text: v
        }))
      }
    ]
  }
});
