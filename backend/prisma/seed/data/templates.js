const TEMPLATE_DEFINITIONS = [
  {
    name: "welcome_offer_template",
    category: "MARKETING",
    language: "en_US",
    status: "APPROVED",
    body: "Hi {{1}}, welcome to ChatFlow Demo Ventures. Your dedicated advisor is ready to help you with the next best offer.",
    header: {
      type: "TEXT",
      text: "Exclusive offer for {{1}}",
    },
    footer: {
      text: "Reply STOP to opt out.",
    },
    buttons: [
      {
        type: "QUICK_REPLY",
        text: "Talk to advisor",
      },
      {
        type: "URL",
        text: "View plans",
        url: "https://example.com/plans",
      },
    ],
    variableSamples: {
      "{{1}}": "Rahul",
    },
  },
  {
    name: "payment_reminder_template",
    category: "UTILITY",
    language: "en_US",
    status: "APPROVED",
    body: "Hello {{1}}, your pending balance is Rs {{2}}. Please clear it before {{3}} to avoid service interruption.",
    header: {
      type: "TEXT",
      text: "Payment reminder",
    },
    footer: {
      text: "Need help? Reply on WhatsApp.",
    },
    buttons: [
      {
        type: "URL",
        text: "Pay now",
        url: "https://example.com/pay",
      },
    ],
    variableSamples: {
      "{{1}}": "Priya",
      "{{2}}": "12500",
      "{{3}}": "15 April 2026",
    },
  },
  {
    name: "verification_code_template",
    category: "AUTHENTICATION",
    language: "en_US",
    status: "DRAFT",
    body: "Your verification code is {{1}}. Do not share this code with anyone.",
    header: null,
    footer: {
      text: "Code valid for 10 minutes.",
    },
    buttons: null,
    variableSamples: {
      "{{1}}": "482931",
    },
  },
];

module.exports = {
  TEMPLATE_DEFINITIONS,
};
