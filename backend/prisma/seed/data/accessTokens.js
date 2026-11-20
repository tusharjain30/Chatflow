const ACCESS_TOKEN_DEFINITIONS = [
  {
    userEmail: null,
    useOwner: true,
    service: "TEMPLATE",
    rawToken: "seed-template-token-owner",
    limitValue: 100,
    usedValue: 12,
  },
  {
    userEmail: null,
    useOwner: true,
    service: "BOT",
    rawToken: "seed-bot-token-owner",
    limitValue: 25,
    usedValue: 3,
  },
  {
    userEmail: "anita.desai@chatflow-demo.com",
    useOwner: false,
    service: "MESSAGE",
    rawToken: "seed-message-token-admin",
    limitValue: 5000,
    usedValue: 428,
  },
];

module.exports = {
  ACCESS_TOKEN_DEFINITIONS,
};
