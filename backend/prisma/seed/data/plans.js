const PLAN_DEFINITIONS = [
  {
    name: "Starter",
    description: "Best for new businesses starting WhatsApp engagement.",
    price: 1499,
    currency: "INR",
    maxTemplates: 10,
    maxBots: 2,
    monthlyMessageLimit: 5000,
  },
  {
    name: "Growth",
    description:
      "Balanced plan for scaling customer conversations and broadcasts.",
    price: 3499,
    currency: "INR",
    maxTemplates: 40,
    maxBots: 8,
    monthlyMessageLimit: 20000,
  },
  {
    name: "Scale",
    description:
      "For mature teams managing high-volume campaigns and automation.",
    price: 6999,
    currency: "INR",
    maxTemplates: 100,
    maxBots: 20,
    monthlyMessageLimit: 75000,
  },
];

module.exports = {
  PLAN_DEFINITIONS,
};
