const BOT_DEFINITIONS = [
  {
    name: "welcome_keyword_bot",
    botType: "SIMPLE",
    triggerType: "KEYWORD",
    triggerValue: "hi",
    entryNodeKey: "welcome_start",
    flow: {
      version: 1,
      nodes: [
        { key: "welcome_start", label: "Welcome", type: "message" },
        { key: "offer_buttons", label: "Offer Buttons", type: "interactive" },
      ],
      edges: [{ from: "welcome_start", to: "offer_buttons" }],
    },
    templates: ["welcome_offer_template"],
    replies: [
      {
        name: "Welcome Text",
        nodeKey: "welcome_start",
        isStart: true,
        replyType: "SIMPLE",
        triggerType: "KEYWORD",
        triggerValue: "hi",
        bodyText:
          "Hi {{name}}, welcome to ChatFlow Demo Ventures. Reply below to continue.",
        footerText: "Seeded simple bot reply",
        nextNodeKey: "offer_buttons",
      },
      {
        name: "Offer Buttons",
        nodeKey: "offer_buttons",
        replyType: "INTERACTIVE",
        triggerType: "BUTTON",
        parentNodeKey: "welcome_start",
        interactiveType: "REPLY_BUTTONS",
        bodyText: "Choose what you want to do next.",
        buttons: [
          { label: "View Plans", payload: "VIEW_PLANS", order: 1 },
          { label: "Talk to Sales", payload: "TALK_SALES", order: 2 },
        ],
        isEnd: true,
      },
    ],
    flowVersion: 1,
    sessionContact: "919810000001",
    currentNodeKey: "offer_buttons",
    previousNodeKey: "welcome_start",
    state: { name: "Rahul", lastAction: "VIEW_PLANS" },
  },
  {
    name: "document_support_bot",
    botType: "FLOW",
    triggerType: "WELCOME",
    triggerValue: null,
    entryNodeKey: "share_brochure",
    flow: {
      version: 3,
      nodes: [
        { key: "share_brochure", label: "Share Brochure", type: "media" },
        { key: "open_site", label: "Open Site", type: "cta" },
        { key: "choose_department", label: "Department List", type: "list" },
      ],
      edges: [
        { from: "share_brochure", to: "open_site" },
        { from: "open_site", to: "choose_department" },
      ],
    },
    templates: ["payment_reminder_template"],
    replies: [
      {
        name: "Brochure Media",
        nodeKey: "share_brochure",
        isStart: true,
        replyType: "MEDIA",
        triggerType: "WELCOME",
        bodyText: "Here is the latest product brochure.",
        media: {
          mediaType: "DOCUMENT",
          fileUrl: "https://example.com/assets/chatflow-brochure.pdf",
          mimeType: "application/pdf",
        },
        nextNodeKey: "open_site",
      },
      {
        name: "Website CTA",
        nodeKey: "open_site",
        replyType: "INTERACTIVE",
        triggerType: "DEFAULT",
        parentNodeKey: "share_brochure",
        interactiveType: "CTA_URL",
        bodyText: "Open our catalog for the full breakdown.",
        ctaButton: {
          displayText: "Open Catalog",
          url: "https://example.com/catalog",
        },
        nextNodeKey: "choose_department",
      },
      {
        name: "Department List",
        nodeKey: "choose_department",
        replyType: "INTERACTIVE",
        triggerType: "DEFAULT",
        parentNodeKey: "open_site",
        interactiveType: "LIST",
        bodyText: "Choose a department and we will route you.",
        listMessage: {
          buttonLabel: "Choose Department",
          sections: [
            {
              title: "Sales",
              order: 1,
              rows: [
                {
                  rowId: "sales_real_estate",
                  title: "Real Estate",
                  description: "Property buying and selling",
                  order: 1,
                },
                {
                  rowId: "sales_d2c",
                  title: "D2C",
                  description: "Commerce and catalog support",
                  order: 2,
                },
              ],
            },
          ],
        },
        isEnd: true,
      },
    ],
    flowVersion: 3,
    sessionContact: "919810000002",
    currentNodeKey: "choose_department",
    previousNodeKey: "open_site",
    state: { lastListSelection: "sales_d2c" },
  },
];

module.exports = {
  BOT_DEFINITIONS,
};
