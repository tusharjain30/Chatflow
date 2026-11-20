const BILLING_TRANSACTIONS = [
  {
    reference: "SEED-RECHARGE-001",
    type: "RECHARGE",
    amount: 15000,
    description: "Seeded opening recharge for primary demo account",
  },
  {
    reference: "SEED-COMMISSION-001",
    type: "COMMISSION",
    amount: 3200,
    description: "Seeded commission payout for April 2026",
  },
];

module.exports = {
  BILLING_TRANSACTIONS,
};
