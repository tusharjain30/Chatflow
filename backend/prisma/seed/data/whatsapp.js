const WHATSAPP_ACCOUNT = {
  id: "seed-whatsapp-account-primary",
  phoneNumberId: "phone_number_id_seed_primary",
  wabaId: "waba_id_seed_primary",
  businessId: "meta_business_seed_primary",
  accessToken: "meta_access_token_seed_primary",
  webhookVerifyToken: "meta_webhook_verify_seed_primary",
  // Keep seed disconnected so Dashboard shows Setup WhatsApp CTA
  isActive: false,
  status: "DISCONNECTED",
  tokenExpiresAt: null,
};

const WABA_VERIFICATION = {
  otp: null,
  otpExpires: null,
  status: "PENDING",
};

const WEBHOOK_EVENTS = [
  {
    eventType: "messages.upsert",
    payload: {
      object: "whatsapp_business_account",
      entry: [
        { changes: [{ field: "messages", value: { status: "received" } }] },
      ],
    },
    processed: true,
    attempts: 1,
    processedAt: new Date("2026-04-20T10:00:00.000Z"),
    lastError: null,
  },
  {
    eventType: "template.status",
    payload: {
      object: "whatsapp_business_account",
      entry: [
        {
          changes: [
            {
              field: "message_template_status_update",
              value: { status: "APPROVED" },
            },
          ],
        },
      ],
    },
    processed: false,
    attempts: 2,
    processedAt: null,
    lastError: "Seeded retry pending",
  },
];

module.exports = {
  WHATSAPP_ACCOUNT,
  WABA_VERIFICATION,
  WEBHOOK_EVENTS,
};
