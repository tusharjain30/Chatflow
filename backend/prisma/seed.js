const bcrypt = require("bcrypt");
const { PrismaClient } = require("../generated/prisma/client");

const prisma = new PrismaClient();

const OWNER_ROLE_NAME = "CUSTOMER_OWNER";
const OWNER_EMAIL = "owner@chatflow-demo.com";
const OWNER_PHONE = "919876543210";
const OWNER_USERNAME = "chatflow_owner_demo";
const OWNER_PASSWORD = "Owner@123";
const COMPANY_NAME = "ChatFlow Demo Ventures";

const CONTACT_GROUPS = [
  {
    title: "Hot Leads",
    description: "High-intent prospects ready for follow-up campaigns.",
  },
  {
    title: "Existing Customers",
    description: "Customers with successful onboarding and active engagement.",
  },
  {
    title: "Re-engagement",
    description: "Contacts who need follow-up after a period of inactivity.",
  },
];

const CUSTOM_FIELDS = [
  { name: "Lead Source", key: "lead_source", type: "text" },
  { name: "Customer Type", key: "customer_type", type: "text" },
  { name: "Budget", key: "budget", type: "number" },
  { name: "Last Follow Up", key: "last_follow_up", type: "date" },
];

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

const CONTACT_DEFINITIONS = [
  {
    phone: "919810000001",
    firstName: "Rahul",
    lastName: "Sharma",
    country: "India",
    languageCode: "en",
    email: "rahul.sharma@example.com",
    isOptedOut: false,
    groups: ["Hot Leads"],
    customFields: {
      lead_source: "Website Form",
      customer_type: "Prospect",
      budget: "150000",
      last_follow_up: "2026-03-28",
    },
  },
  {
    phone: "919810000002",
    firstName: "Priya",
    lastName: "Mehta",
    country: "India",
    languageCode: "en",
    email: "priya.mehta@example.com",
    isOptedOut: false,
    groups: ["Existing Customers"],
    customFields: {
      lead_source: "Referral",
      customer_type: "Customer",
      budget: "85000",
      last_follow_up: "2026-03-30",
    },
  },
  {
    phone: "919810000003",
    firstName: "Aman",
    lastName: "Khan",
    country: "India",
    languageCode: "hi",
    email: "aman.khan@example.com",
    isOptedOut: false,
    groups: ["Re-engagement"],
    customFields: {
      lead_source: "Instagram",
      customer_type: "Dormant",
      budget: "60000",
      last_follow_up: "2026-03-10",
    },
  },
  {
    phone: "919810000004",
    firstName: "Sneha",
    lastName: "Patel",
    country: "India",
    languageCode: "en",
    email: "sneha.patel@example.com",
    isOptedOut: false,
    groups: ["Hot Leads", "Existing Customers"],
    customFields: {
      lead_source: "Sales Call",
      customer_type: "Upsell",
      budget: "225000",
      last_follow_up: "2026-04-01",
    },
  },
  {
    phone: "919810000005",
    firstName: "Vikram",
    lastName: "Joshi",
    country: "India",
    languageCode: "hi",
    email: "vikram.joshi@example.com",
    isOptedOut: true,
    groups: ["Re-engagement"],
    customFields: {
      lead_source: "Old Database",
      customer_type: "Opted Out",
      budget: "40000",
      last_follow_up: "2026-02-14",
    },
  },
];

function extractVariables(text = "") {
  const regex = /\{\{\s*(\d+)\s*\}\}/g;
  const variables = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    variables.push(`{{${match[1]}}}`);
  }

  return variables.length ? variables : null;
}

function buildTemplateComponents({
  body,
  header,
  footer,
  buttons,
  variableSamples = {},
}) {
  const components = [];
  const bodyVariables = extractVariables(body);

  if (header) {
    if (header.type === "TEXT") {
      const headerComponent = {
        type: "HEADER",
        format: "TEXT",
        text: header.text,
      };

      const headerVariables = extractVariables(header.text || "");
      if (headerVariables?.length) {
        headerComponent.example = {
          header_text: headerVariables.map(
            (token) => variableSamples[token] || token,
          ),
        };
      }

      components.push(headerComponent);
    } else if (["IMAGE", "VIDEO", "DOCUMENT"].includes(header.type)) {
      components.push({
        type: "HEADER",
        format: header.type,
        example: {
          header_handle: [header.mediaHandle || "MEDIA_HANDLE_PENDING"],
        },
      });
    } else if (header.type === "LOCATION") {
      components.push({
        type: "HEADER",
        format: "LOCATION",
      });
    }
  }

  const bodyComponent = {
    type: "BODY",
    text: body,
  };

  if (bodyVariables?.length) {
    bodyComponent.example = {
      body_text: [bodyVariables.map((token) => variableSamples[token] || token)],
    };
  }

  components.push(bodyComponent);

  if (footer?.text) {
    components.push({
      type: "FOOTER",
      text: footer.text,
    });
  }

  if (Array.isArray(buttons) && buttons.length) {
    const mappedButtons = buttons
      .map((button) => {
        if (button.type === "URL") {
          return { type: "URL", text: button.text, url: button.url };
        }

        if (button.type === "QUICK_REPLY") {
          return { type: "QUICK_REPLY", text: button.text };
        }

        if (button.type === "CALL") {
          return {
            type: "PHONE_NUMBER",
            text: button.text,
            phone_number: button.phoneNumber,
          };
        }

        return null;
      })
      .filter(Boolean);

    if (mappedButtons.length) {
      components.push({
        type: "BUTTONS",
        buttons: mappedButtons,
      });
    }
  }

  return components;
}

async function ensureOwnerRole() {
  return prisma.role.upsert({
    where: { name: OWNER_ROLE_NAME },
    update: {
      roleType: "CUSTOMER_OWNER",
      isActive: true,
      isDeleted: false,
    },
    create: {
      name: OWNER_ROLE_NAME,
      roleType: "CUSTOMER_OWNER",
      isActive: true,
      isDeleted: false,
    },
  });
}

async function ensureOwnerAccount(roleId) {
  const hashedPassword = await bcrypt.hash(OWNER_PASSWORD, 10);

  const existingOwner = await prisma.user.findFirst({
    where: {
      OR: [
        { email: OWNER_EMAIL },
        { phone: OWNER_PHONE },
        { userName: OWNER_USERNAME },
      ],
    },
    include: {
      account: true,
    },
  });

  if (existingOwner?.accountId) {
    const owner = await prisma.user.update({
      where: { id: existingOwner.id },
      data: {
        firstName: "Demo",
        lastName: "Owner",
        email: OWNER_EMAIL,
        phone: OWNER_PHONE,
        userName: OWNER_USERNAME,
        password: hashedPassword,
        roleId,
        isActive: true,
        isDeleted: false,
        isVerified: true,
        termsAccepted: true,
      },
    });

    const account = await prisma.customerAccount.update({
      where: { id: existingOwner.accountId },
      data: {
        companyName: COMPANY_NAME,
        isActive: true,
        isDeleted: false,
      },
    });

    return { owner, account };
  }

  return prisma.$transaction(async (tx) => {
    const account = await tx.customerAccount.create({
      data: {
        companyName: COMPANY_NAME,
        isActive: true,
        isDeleted: false,
      },
    });

    const owner = await tx.user.create({
      data: {
        firstName: "Demo",
        lastName: "Owner",
        email: OWNER_EMAIL,
        phone: OWNER_PHONE,
        userName: OWNER_USERNAME,
        password: hashedPassword,
        roleId,
        accountId: account.id,
        isActive: true,
        isDeleted: false,
        isVerified: true,
        termsAccepted: true,
      },
    });

    return { owner, account };
  });
}

async function seedContactGroups(accountId, ownerId) {
  const groupsByTitle = new Map();

  for (const group of CONTACT_GROUPS) {
    const existing = await prisma.contactGroup.findFirst({
      where: {
        accountId,
        title: {
          equals: group.title,
          mode: "insensitive",
        },
      },
    });

    const savedGroup = existing
      ? await prisma.contactGroup.update({
          where: { id: existing.id },
          data: {
            description: group.description,
            createdByUserId: existing.createdByUserId || ownerId,
            isArchived: false,
            isDeleted: false,
          },
        })
      : await prisma.contactGroup.create({
          data: {
            accountId,
            createdByUserId: ownerId,
            title: group.title,
            description: group.description,
            isArchived: false,
            isDeleted: false,
          },
        });

    groupsByTitle.set(savedGroup.title, savedGroup);
  }

  return groupsByTitle;
}

async function seedCustomFields(accountId) {
  const fieldsByKey = new Map();

  for (const field of CUSTOM_FIELDS) {
    const savedField = await prisma.contactCustomField.upsert({
      where: {
        accountId_key: {
          accountId,
          key: field.key,
        },
      },
      update: {
        name: field.name,
        type: field.type,
        isDeleted: false,
      },
      create: {
        accountId,
        name: field.name,
        key: field.key,
        type: field.type,
        isDeleted: false,
      },
    });

    fieldsByKey.set(savedField.key, savedField);
  }

  return fieldsByKey;
}

async function seedContacts(accountId, ownerId, groupsByTitle, fieldsByKey) {
  const contacts = [];

  for (const contactDef of CONTACT_DEFINITIONS) {
    const contact = await prisma.contact.upsert({
      where: {
        accountId_phone: {
          accountId,
          phone: contactDef.phone,
        },
      },
      update: {
        createdByUserId: ownerId,
        firstName: contactDef.firstName,
        lastName: contactDef.lastName,
        country: contactDef.country,
        languageCode: contactDef.languageCode,
        email: contactDef.email,
        isOptedOut: contactDef.isOptedOut,
        isDeleted: false,
      },
      create: {
        accountId,
        createdByUserId: ownerId,
        firstName: contactDef.firstName,
        lastName: contactDef.lastName,
        country: contactDef.country,
        phone: contactDef.phone,
        languageCode: contactDef.languageCode,
        email: contactDef.email,
        isOptedOut: contactDef.isOptedOut,
        isDeleted: false,
      },
    });

    await prisma.contactGroupMap.deleteMany({
      where: {
        contactId: contact.id,
      },
    });

    const groupIds = contactDef.groups
      .map((title) => groupsByTitle.get(title))
      .filter(Boolean)
      .map((group) => group.id);

    if (groupIds.length) {
      await prisma.contactGroupMap.createMany({
        data: groupIds.map((groupId) => ({
          accountId,
          contactId: contact.id,
          groupId,
        })),
        skipDuplicates: true,
      });
    }

    for (const [fieldKey, value] of Object.entries(contactDef.customFields)) {
      const field = fieldsByKey.get(fieldKey);
      if (!field) {
        continue;
      }

      await prisma.contactCustomValue.upsert({
        where: {
          contactId_fieldId: {
            contactId: contact.id,
            fieldId: field.id,
          },
        },
        update: {
          accountId,
          value: String(value),
        },
        create: {
          accountId,
          contactId: contact.id,
          fieldId: field.id,
          value: String(value),
        },
      });
    }

    contacts.push(contact);
  }

  return contacts;
}

async function seedTemplates(accountId, ownerId) {
  const templatesByName = new Map();

  for (const templateDef of TEMPLATE_DEFINITIONS) {
    const components = buildTemplateComponents(templateDef);
    const builderData = {
      originalName: templateDef.name,
      normalizedName: templateDef.name,
      headerType: templateDef.header?.type || "NONE",
      headerText:
        templateDef.header?.type === "TEXT" ? templateDef.header.text || "" : "",
      footerText: templateDef.footer?.text || "",
      variableSamples: templateDef.variableSamples || {},
      locationDetails: {},
      buttons: templateDef.buttons || [],
      language: templateDef.language,
      category: templateDef.category,
      mediaPreview: null,
    };

    const template = await prisma.template.upsert({
      where: {
        accountId_name_language: {
          accountId,
          name: templateDef.name,
          language: templateDef.language,
        },
      },
      update: {
        createdByUserId: ownerId,
        category: templateDef.category,
        body: templateDef.body,
        header: templateDef.header,
        footer: templateDef.footer,
        buttons: templateDef.buttons,
        components,
        mediaFiles: null,
        builderData,
        status: templateDef.status,
        metaTemplateId: null,
        rejectReason: null,
        isActive: true,
        isDeleted: false,
      },
      create: {
        accountId,
        createdByUserId: ownerId,
        name: templateDef.name,
        category: templateDef.category,
        language: templateDef.language,
        body: templateDef.body,
        header: templateDef.header,
        footer: templateDef.footer,
        buttons: templateDef.buttons,
        components,
        mediaFiles: null,
        builderData,
        status: templateDef.status,
        metaTemplateId: null,
        rejectReason: null,
        isActive: true,
        isDeleted: false,
      },
    });

    templatesByName.set(template.name, template);
  }

  return templatesByName;
}

async function seedCampaigns(accountId, ownerId, templatesByName, contacts, groupsByTitle) {
  const welcomeTemplate = templatesByName.get("welcome_offer_template");
  const reminderTemplate = templatesByName.get("payment_reminder_template");
  const hotLeadsGroup = groupsByTitle.get("Hot Leads");
  const reEngagementGroup = groupsByTitle.get("Re-engagement");

  const campaignDefinitions = [
    {
      name: "April Welcome Drive",
      description: "Welcome campaign for new and high-intent leads.",
      templateId: welcomeTemplate?.id,
      isScheduled: false,
      scheduledAt: null,
      batchSize: 25,
      delayInSeconds: 3,
      status: "DRAFT",
      logMessage: "Campaign created from seed data",
      audienceContactIds: contacts
        .filter((contact) =>
          ["919810000001", "919810000004"].includes(contact.phone),
        )
        .map((contact) => contact.id),
    },
    {
      name: "Payment Reminder Wave",
      description: "Scheduled reminders for customers with pending dues.",
      templateId: reminderTemplate?.id,
      isScheduled: true,
      scheduledAt: new Date("2026-04-10T10:00:00.000Z"),
      batchSize: 20,
      delayInSeconds: 5,
      status: "SCHEDULED",
      logMessage: "Campaign scheduled from seed data",
      audienceGroupId: reEngagementGroup?.id || hotLeadsGroup?.id || null,
    },
  ];

  for (const campaignDef of campaignDefinitions) {
    if (!campaignDef.templateId) {
      continue;
    }

    const existing = await prisma.campaign.findFirst({
      where: {
        accountId,
        name: campaignDef.name,
        isDeleted: false,
      },
    });

    const campaign = existing
      ? await prisma.campaign.update({
          where: { id: existing.id },
          data: {
            description: campaignDef.description,
            templateId: campaignDef.templateId,
            isScheduled: campaignDef.isScheduled,
            scheduledAt: campaignDef.scheduledAt,
            batchSize: campaignDef.batchSize,
            delayInSeconds: campaignDef.delayInSeconds,
            status: campaignDef.status,
            createdByUserId: ownerId,
            isDeleted: false,
          },
        })
      : await prisma.campaign.create({
          data: {
            accountId,
            name: campaignDef.name,
            description: campaignDef.description,
            templateId: campaignDef.templateId,
            isScheduled: campaignDef.isScheduled,
            scheduledAt: campaignDef.scheduledAt,
            batchSize: campaignDef.batchSize,
            delayInSeconds: campaignDef.delayInSeconds,
            status: campaignDef.status,
            createdByUserId: ownerId,
            isDeleted: false,
          },
        });

    await prisma.campaignAudience.deleteMany({
      where: {
        campaignId: campaign.id,
      },
    });

    let audienceContactIds = campaignDef.audienceContactIds || [];

    if (!audienceContactIds.length && campaignDef.audienceGroupId) {
      const mappings = await prisma.contactGroupMap.findMany({
        where: {
          accountId,
          groupId: campaignDef.audienceGroupId,
        },
        select: {
          contactId: true,
        },
      });

      audienceContactIds = mappings.map((mapping) => mapping.contactId);
    }

    const uniqueAudienceContactIds = [...new Set(audienceContactIds)];

    if (uniqueAudienceContactIds.length) {
      await prisma.campaignAudience.createMany({
        data: uniqueAudienceContactIds.map((contactId) => ({
          campaignId: campaign.id,
          contactId,
          status: "PENDING",
        })),
      });
    }

    const totalContacts = uniqueAudienceContactIds.length;

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        totalContacts,
      },
    });

    const existingLog = await prisma.campaignLog.findFirst({
      where: {
        campaignId: campaign.id,
        message: campaignDef.logMessage,
      },
    });

    if (!existingLog) {
      await prisma.campaignLog.create({
        data: {
          campaignId: campaign.id,
          type: "INFO",
          message: campaignDef.logMessage,
        },
      });
    }
  }
}

async function main() {
  const role = await ensureOwnerRole();
  const { owner, account } = await ensureOwnerAccount(role.id);
  const groupsByTitle = await seedContactGroups(account.id, owner.id);
  const fieldsByKey = await seedCustomFields(account.id);
  const contacts = await seedContacts(
    account.id,
    owner.id,
    groupsByTitle,
    fieldsByKey,
  );
  const templatesByName = await seedTemplates(account.id, owner.id);

  await seedCampaigns(
    account.id,
    owner.id,
    templatesByName,
    contacts,
    groupsByTitle,
  );

  console.log("Seed completed successfully.");
  console.log(`Owner email: ${OWNER_EMAIL}`);
  console.log(`Owner phone: ${OWNER_PHONE}`);
  console.log(`Owner password: ${OWNER_PASSWORD}`);
  console.log(`Account: ${COMPANY_NAME}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
