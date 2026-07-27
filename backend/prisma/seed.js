require("dotenv").config();
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { PrismaClient } = require("../generated/prisma/client");

const prisma = new PrismaClient();

const OWNER_ROLE_NAME = "CUSTOMER_OWNER";
const OWNER_EMAIL = "owner@chatflow-demo.com";
const OWNER_PHONE = "919876543210";
const OWNER_USERNAME = "chatflow_owner_demo";
const OWNER_PASSWORD = "Owner@123";
const COMPANY_NAME = "ChatFlow Demo Ventures";
const SUPER_ADMIN_ROLE_NAME = "SUPER_ADMIN";
const SUPER_ADMIN_EMAIL = "superadmin@chatflow-demo.com";
const SUPER_ADMIN_PHONE = "919811110000";
const SUPER_ADMIN_USERNAME = "chatflow_super_admin";
const SUPER_ADMIN_PASSWORD = "SuperAdmin@123";
const INTERNAL_ADMIN_ROLE_NAME = "OPERATIONS_MANAGER";
const RESELLER_COMPANY_NAME = "ChatFlow Partner Network";
const RESELLER_EMAIL = "reseller@chatflow-demo.com";
const RESELLER_PHONE = "919899887766";
const RESELLER_USERNAME = "chatflow_reseller_demo";
const RESELLER_PASSWORD = "Reseller@123";
const PERMISSION_NAMES = [
  "VIEW_CUSTOMERS",
  "VIEW_CUSTOMER",
  "UPDATE_CUSTOMER",
  "UPDATE_CUSTOMER_STATUS",
  "VERIFY_CUSTOMER",
  "DELETE_CUSTOMER",
  "VIEW_CUSTOMER_STATS",
  "FORCE_LOGOUT_CUSTOMER",
];
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
const RESELLER_CUSTOMER_DEFINITIONS = [
  {
    companyName: "Northstar Realty",
    ownerFirstName: "Arjun",
    ownerLastName: "Malhotra",
    ownerEmail: "arjun@northstar-demo.com",
    ownerPhone: "919700000111",
    userName: "northstar_owner_demo",
    password: "Owner@123",
    planName: "Starter",
    startDate: new Date("2026-02-01T00:00:00.000Z"),
    isActive: true,
  },
  {
    companyName: "BluePeak D2C",
    ownerFirstName: "Neha",
    ownerLastName: "Sethi",
    ownerEmail: "neha@bluepeak-demo.com",
    ownerPhone: "919700000222",
    userName: "bluepeak_owner_demo",
    password: "Owner@123",
    planName: "Growth",
    startDate: new Date("2026-03-01T00:00:00.000Z"),
    isActive: true,
  },
  {
    companyName: "PrimeCare Clinics",
    ownerFirstName: "Karan",
    ownerLastName: "Bedi",
    ownerEmail: "karan@primecare-demo.com",
    ownerPhone: "919700000333",
    userName: "primecare_owner_demo",
    password: "Owner@123",
    planName: "Scale",
    startDate: new Date("2026-04-01T00:00:00.000Z"),
    isActive: false,
  },
];

const TEAM_INVITE_DEFINITIONS = [
  {
    email: "team-admin@chatflow-demo.com",
    roleType: "CUSTOMER_ADMIN",
    expiresInHours: 48,
  },
  {
    email: "team-agent@chatflow-demo.com",
    roleType: "CUSTOMER_AGENT",
    expiresInHours: 48,
  },
];

const CUSTOMER_TEAM_MEMBERS = [
  {
    phone: "919810000006",
    firstName: "Anita",
    lastName: "Desai",
    email: "anita.desai@chatflow-demo.com",
    userName: "anita_admin_demo",
    password: "Team@123",
    roleType: "CUSTOMER_ADMIN",
    isActive: true,
  },
  {
    phone: "919810000007",
    firstName: "Rohit",
    lastName: "Verma",
    email: "rohit.verma@chatflow-demo.com",
    userName: "rohit_agent_demo",
    password: "Team@123",
    roleType: "CUSTOMER_AGENT",
    isActive: true,
  },
];

const RESELLER_TEAM_MEMBERS = [
  {
    firstName: "Nikhil",
    lastName: "Raj",
    email: "nikhil.raj@chatflow-demo.com",
    phone: "919899887700",
    password: "Team@123",
    roleType: "RESELLER_SUPPORT",
  },
  {
    firstName: "Meera",
    lastName: "Shah",
    email: "meera.shah@chatflow-demo.com",
    phone: "919899887701",
    password: "Team@123",
    roleType: "RESELLER_SUB_ADMIN",
  },
];

const INTERNAL_ADMINS = [
  {
    firstName: "Asha",
    lastName: "Menon",
    email: "ops.admin@chatflow-demo.com",
    phone: "919811110001",
    userName: "chatflow_ops_admin",
    password: "Admin@123",
  },
];

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
      body_text: [
        bodyVariables.map((token) => variableSamples[token] || token),
      ],
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

async function ensureReseller() {
  const hashedPassword = await bcrypt.hash(RESELLER_PASSWORD, 10);

  const existingReseller = await prisma.reseller.findFirst({
    where: {
      OR: [
        { email: RESELLER_EMAIL },
        { phone: RESELLER_PHONE },
        { userName: RESELLER_USERNAME },
      ],
    },
  });

  if (existingReseller) {
    return prisma.reseller.update({
      where: { id: existingReseller.id },
      data: {
        companyName: RESELLER_COMPANY_NAME,
        firstName: "Demo",
        lastName: "Reseller",
        email: RESELLER_EMAIL,
        phone: RESELLER_PHONE,
        userName: RESELLER_USERNAME,
        password: hashedPassword,
        commissionRate: 18,
        balance: 42500,
        isActive: true,
        isDeleted: false,
        isVerified: true,
      },
    });
  }

  return prisma.reseller.create({
    data: {
      companyName: RESELLER_COMPANY_NAME,
      firstName: "Demo",
      lastName: "Reseller",
      email: RESELLER_EMAIL,
      phone: RESELLER_PHONE,
      userName: RESELLER_USERNAME,
      password: hashedPassword,
      commissionRate: 18,
      balance: 42500,
      isActive: true,
      isDeleted: false,
      isVerified: true,
    },
  });
}

async function seedPlans() {
  const plansByName = new Map();

  for (const planDef of PLAN_DEFINITIONS) {
    const plan = await prisma.plan.upsert({
      where: { name: planDef.name },
      update: {
        description: planDef.description,
        price: planDef.price,
        currency: planDef.currency,
        maxTemplates: planDef.maxTemplates,
        maxBots: planDef.maxBots,
        monthlyMessageLimit: planDef.monthlyMessageLimit,
        isActive: true,
        isDeleted: false,
      },
      create: {
        name: planDef.name,
        description: planDef.description,
        price: planDef.price,
        currency: planDef.currency,
        maxTemplates: planDef.maxTemplates,
        maxBots: planDef.maxBots,
        monthlyMessageLimit: planDef.monthlyMessageLimit,
        isActive: true,
        isDeleted: false,
      },
    });

    plansByName.set(plan.name, plan);
  }

  return plansByName;
}

async function ensureAccountSubscription(accountId, planId, startDate) {
  const existing = await prisma.subscription.findFirst({
    where: {
      accountId,
      isActive: true,
    },
  });

  if (existing) {
    return prisma.subscription.update({
      where: { id: existing.id },
      data: {
        planId,
        startDate,
        endDate: null,
        isActive: true,
      },
      include: {
        plan: true,
      },
    });
  }

  return prisma.subscription.create({
    data: {
      accountId,
      planId,
      startDate,
      isActive: true,
    },
    include: {
      plan: true,
    },
  });
}

async function seedResellerManagedCustomers(resellerId, roleId, plansByName) {
  for (const customerDef of RESELLER_CUSTOMER_DEFINITIONS) {
    const hashedPassword = await bcrypt.hash(customerDef.password, 10);

    const existingOwner = await prisma.user.findFirst({
      where: {
        OR: [
          { email: customerDef.ownerEmail },
          { phone: customerDef.ownerPhone },
          { userName: customerDef.userName },
        ],
      },
      include: {
        account: true,
      },
    });

    let accountId;

    if (existingOwner?.accountId) {
      const owner = await prisma.user.update({
        where: { id: existingOwner.id },
        data: {
          firstName: customerDef.ownerFirstName,
          lastName: customerDef.ownerLastName,
          email: customerDef.ownerEmail,
          phone: customerDef.ownerPhone,
          userName: customerDef.userName,
          password: hashedPassword,
          roleId,
          isActive: customerDef.isActive,
          isDeleted: false,
          isVerified: true,
          termsAccepted: true,
        },
      });

      const account = await prisma.customerAccount.update({
        where: { id: existingOwner.accountId },
        data: {
          companyName: customerDef.companyName,
          resellerId,
          isActive: customerDef.isActive,
          isDeleted: false,
        },
      });

      accountId = account.id;
      void owner;
    } else {
      const created = await prisma.$transaction(async (tx) => {
        const account = await tx.customerAccount.create({
          data: {
            companyName: customerDef.companyName,
            resellerId,
            isActive: customerDef.isActive,
            isDeleted: false,
          },
        });

        const owner = await tx.user.create({
          data: {
            firstName: customerDef.ownerFirstName,
            lastName: customerDef.ownerLastName,
            email: customerDef.ownerEmail,
            phone: customerDef.ownerPhone,
            userName: customerDef.userName,
            password: hashedPassword,
            roleId,
            accountId: account.id,
            isActive: customerDef.isActive,
            isDeleted: false,
            isVerified: true,
            termsAccepted: true,
          },
        });

        return { account, owner };
      });

      accountId = created.account.id;
    }

    const plan = plansByName.get(customerDef.planName);
    if (plan) {
      await ensureAccountSubscription(
        accountId,
        plan.id,
        customerDef.startDate,
      );
    }
  }
}

async function ensureRole(name, roleType) {
  return prisma.role.upsert({
    where: { name },
    update: {
      roleType,
      isActive: true,
      isDeleted: false,
    },
    create: {
      name,
      roleType,
      isActive: true,
      isDeleted: false,
    },
  });
}

async function seedCustomerTeamMembers(accountId, ownerId) {
  for (const memberDef of CUSTOMER_TEAM_MEMBERS) {
    const role = await ensureRole(memberDef.roleType, memberDef.roleType);
    const normalizedEmail = memberDef.email.trim().toLowerCase();
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { phone: memberDef.phone },
          { userName: memberDef.userName },
        ],
      },
    });

    const hashedPassword = await bcrypt.hash(memberDef.password, 10);

    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          firstName: memberDef.firstName,
          lastName: memberDef.lastName,
          email: normalizedEmail,
          phone: memberDef.phone,
          userName: memberDef.userName,
          password: hashedPassword,
          roleId: role.id,
          accountId,
          isActive: memberDef.isActive,
          isDeleted: false,
          isVerified: true,
          termsAccepted: true,
        },
      });
    } else {
      await prisma.user.create({
        data: {
          accountId,
          firstName: memberDef.firstName,
          lastName: memberDef.lastName,
          email: normalizedEmail,
          phone: memberDef.phone,
          userName: memberDef.userName,
          password: hashedPassword,
          roleId: role.id,
          isActive: memberDef.isActive,
          isDeleted: false,
          isVerified: true,
          termsAccepted: true,
        },
      });
    }
  }
}

async function seedTeamInvites(accountId, createdByUserId) {
  for (const inviteDef of TEAM_INVITE_DEFINITIONS) {
    const normalizedEmail = inviteDef.email.trim().toLowerCase();
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(
      Date.now() + inviteDef.expiresInHours * 60 * 60 * 1000,
    );

    const existingInvite = await prisma.teamInvite.findFirst({
      where: {
        email: normalizedEmail,
        accountId,
        isAccepted: false,
        isDeleted: false,
      },
    });

    if (existingInvite) {
      await prisma.teamInvite.update({
        where: { id: existingInvite.id },
        data: {
          roleType: inviteDef.roleType,
          token,
          expiresAt,
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.teamInvite.create({
        data: {
          email: normalizedEmail,
          roleType: inviteDef.roleType,
          accountId,
          token,
          expiresAt,
          createdByUserId,
        },
      });
    }
  }
}

function buildResellerTeamUserName(email) {
  return `${email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 12)}${Date.now().toString().slice(-4)}`;
}

async function seedResellerTeamMembers(resellerId) {
  for (const memberDef of RESELLER_TEAM_MEMBERS) {
    const normalizedEmail = memberDef.email.trim().toLowerCase();
    const existingMember = await prisma.resellerMember.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { phone: memberDef.phone }],
      },
    });

    const hashedPassword = await bcrypt.hash(memberDef.password, 10);
    const userName =
      existingMember?.userName || buildResellerTeamUserName(normalizedEmail);

    if (existingMember) {
      await prisma.resellerMember.update({
        where: { id: existingMember.id },
        data: {
          resellerId,
          firstName: memberDef.firstName,
          lastName: memberDef.lastName,
          email: normalizedEmail,
          phone: memberDef.phone,
          password: hashedPassword,
          roleType: memberDef.roleType,
          userName,
          isActive: true,
          isDeleted: false,
          isVerified: true,
        },
      });
    } else {
      await prisma.resellerMember.create({
        data: {
          resellerId,
          firstName: memberDef.firstName,
          lastName: memberDef.lastName,
          email: normalizedEmail,
          phone: memberDef.phone,
          password: hashedPassword,
          roleType: memberDef.roleType,
          userName,
          isActive: true,
          isDeleted: false,
          isVerified: true,
        },
      });
    }
  }
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
        templateDef.header?.type === "TEXT"
          ? templateDef.header.text || ""
          : "",
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

async function seedCampaigns(
  accountId,
  ownerId,
  templatesByName,
  contacts,
  groupsByTitle,
) {
  const welcomeTemplate = templatesByName.get("welcome_offer_template");
  const reminderTemplate = templatesByName.get("payment_reminder_template");
  const hotLeadsGroup = groupsByTitle.get("Hot Leads");
  const reEngagementGroup = groupsByTitle.get("Re-engagement");
  const existingCustomersGroup = groupsByTitle.get("Existing Customers");

  const contactsByPhone = new Map(
    contacts.map((contact) => [contact.phone, contact]),
  );

  const getContactIds = (phones = []) =>
    phones.map((phone) => contactsByPhone.get(phone)?.id).filter(Boolean);

  const metricsFromAudienceStatuses = (audienceStatuses = []) => ({
    totalContacts: audienceStatuses.length,
    sentCount: audienceStatuses.filter((status) =>
      ["SENT", "DELIVERED", "READ", "FAILED"].includes(status),
    ).length,
    deliveredCount: audienceStatuses.filter((status) =>
      ["DELIVERED", "READ"].includes(status),
    ).length,
    readCount: audienceStatuses.filter((status) => status === "READ").length,
    failedCount: audienceStatuses.filter((status) => status === "FAILED")
      .length,
  });

  const campaignDefinitions = [
    {
      name: "April Welcome Draft",
      description: "Draft welcome campaign ready for audience curation.",
      templateId: welcomeTemplate?.id,
      isScheduled: false,
      scheduledAt: null,
      startedAt: null,
      completedAt: null,
      batchSize: 25,
      delayInSeconds: 3,
      status: "DRAFT",
      logMessage: "Draft campaign created from seed data",
      audienceContactIds: getContactIds([
        "919810000001",
        "919810000004",
        "919810000005",
      ]),
      audienceStatuses: ["PENDING", "PENDING", "PENDING"],
    },
    {
      name: "Payment Reminder Scheduled",
      description: "Scheduled reminders for customers with pending dues.",
      templateId: reminderTemplate?.id,
      isScheduled: true,
      scheduledAt: new Date("2026-04-10T10:00:00.000Z"),
      startedAt: null,
      completedAt: null,
      batchSize: 20,
      delayInSeconds: 5,
      status: "SCHEDULED",
      logMessage: "Scheduled campaign created from seed data",
      audienceGroupId: reEngagementGroup?.id || hotLeadsGroup?.id || null,
      audienceStatuses: ["PENDING", "PENDING"],
    },
    {
      name: "Hot Leads Live Run",
      description: "Active campaign currently processing hot leads.",
      templateId: welcomeTemplate?.id,
      isScheduled: false,
      scheduledAt: null,
      startedAt: new Date("2026-04-04T09:00:00.000Z"),
      completedAt: null,
      batchSize: 15,
      delayInSeconds: 2,
      status: "RUNNING",
      logMessage: "Running campaign created from seed data",
      audienceContactIds: getContactIds([
        "919810000001",
        "919810000002",
        "919810000003",
        "919810000004",
        "919810000005",
      ]),
      audienceStatuses: ["READ", "DELIVERED", "SENT", "FAILED", "PENDING"],
    },
    {
      name: "Existing Customers Paused",
      description: "Paused campaign with pending audience left to resume.",
      templateId: reminderTemplate?.id,
      isScheduled: false,
      scheduledAt: null,
      startedAt: new Date("2026-04-03T07:30:00.000Z"),
      completedAt: null,
      batchSize: 10,
      delayInSeconds: 4,
      status: "PAUSED",
      logMessage: "Paused campaign created from seed data",
      audienceGroupId: existingCustomersGroup?.id || hotLeadsGroup?.id || null,
      audienceStatuses: ["READ", "DELIVERED", "PENDING"],
    },
    {
      name: "March Closure Broadcast",
      description: "Completed campaign sent to all selected contacts.",
      templateId: welcomeTemplate?.id,
      isScheduled: false,
      scheduledAt: null,
      startedAt: new Date("2026-03-28T06:30:00.000Z"),
      completedAt: new Date("2026-03-28T08:00:00.000Z"),
      batchSize: 30,
      delayInSeconds: 2,
      status: "COMPLETED",
      logMessage: "Completed campaign created from seed data",
      audienceContactIds: getContactIds([
        "919810000001",
        "919810000002",
        "919810000003",
        "919810000004",
      ]),
      audienceStatuses: ["READ", "READ", "DELIVERED", "FAILED"],
    },
    {
      name: "Dormant User Recovery Failed",
      description:
        "Campaign failed after delivery issues during recovery attempts.",
      templateId: reminderTemplate?.id,
      isScheduled: false,
      scheduledAt: null,
      startedAt: new Date("2026-03-25T05:00:00.000Z"),
      completedAt: new Date("2026-03-25T05:45:00.000Z"),
      batchSize: 12,
      delayInSeconds: 6,
      status: "FAILED",
      logMessage: "Failed campaign created from seed data",
      audienceContactIds: getContactIds(["919810000003", "919810000005"]),
      audienceStatuses: ["FAILED", "FAILED"],
    },
    {
      name: "Cancelled Follow-up Blast",
      description:
        "Campaign cancelled before all queued audience could be reached.",
      templateId: welcomeTemplate?.id,
      isScheduled: false,
      scheduledAt: null,
      startedAt: new Date("2026-04-02T08:15:00.000Z"),
      completedAt: null,
      batchSize: 10,
      delayInSeconds: 3,
      status: "CANCELLED",
      logMessage: "Cancelled campaign created from seed data",
      audienceContactIds: getContactIds([
        "919810000001",
        "919810000002",
        "919810000004",
      ]),
      audienceStatuses: ["READ", "SENT", "PENDING"],
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

    const audienceMetrics = metricsFromAudienceStatuses(
      campaignDef.audienceStatuses || [],
    );

    const campaign = existing
      ? await prisma.campaign.update({
          where: { id: existing.id },
          data: {
            description: campaignDef.description,
            templateId: campaignDef.templateId,
            isScheduled: campaignDef.isScheduled,
            scheduledAt: campaignDef.scheduledAt,
            startedAt: campaignDef.startedAt,
            completedAt: campaignDef.completedAt,
            batchSize: campaignDef.batchSize,
            delayInSeconds: campaignDef.delayInSeconds,
            status: campaignDef.status,
            totalContacts: audienceMetrics.totalContacts,
            sentCount: audienceMetrics.sentCount,
            deliveredCount: audienceMetrics.deliveredCount,
            readCount: audienceMetrics.readCount,
            failedCount: audienceMetrics.failedCount,
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
            startedAt: campaignDef.startedAt,
            completedAt: campaignDef.completedAt,
            batchSize: campaignDef.batchSize,
            delayInSeconds: campaignDef.delayInSeconds,
            status: campaignDef.status,
            totalContacts: audienceMetrics.totalContacts,
            sentCount: audienceMetrics.sentCount,
            deliveredCount: audienceMetrics.deliveredCount,
            readCount: audienceMetrics.readCount,
            failedCount: audienceMetrics.failedCount,
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
    const audienceStatuses = campaignDef.audienceStatuses || [];

    if (uniqueAudienceContactIds.length) {
      await prisma.campaignAudience.createMany({
        data: uniqueAudienceContactIds.map((contactId, index) => {
          const status = audienceStatuses[index] || "PENDING";
          const baseTime =
            campaignDef.startedAt || campaignDef.scheduledAt || new Date();
          const sentAt = ["SENT", "DELIVERED", "READ", "FAILED"].includes(
            status,
          )
            ? new Date(baseTime.getTime() + index * 60000)
            : null;
          const deliveredAt = ["DELIVERED", "READ"].includes(status)
            ? new Date(baseTime.getTime() + index * 60000 + 30000)
            : null;
          const readAt =
            status === "READ"
              ? new Date(baseTime.getTime() + index * 60000 + 60000)
              : null;
          const failedAt =
            status === "FAILED"
              ? new Date(baseTime.getTime() + index * 60000 + 45000)
              : null;

          return {
            campaignId: campaign.id,
            contactId,
            status,
            sentAt,
            deliveredAt,
            readAt,
            failedAt,
            errorMessage:
              status === "FAILED" ? "Seeded delivery failure" : null,
          };
        }),
      });
    }

    await prisma.campaignLog.deleteMany({
      where: {
        campaignId: campaign.id,
      },
    });

    await prisma.campaignLog.createMany({
      data: [
        {
          campaignId: campaign.id,
          type: "INFO",
          message: campaignDef.logMessage,
        },
        {
          campaignId: campaign.id,
          type: campaignDef.status === "FAILED" ? "ERROR" : "INFO",
          message: `Campaign seeded with ${campaignDef.status.toLowerCase()} status`,
        },
      ],
    });
  }
}

function hashValue(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function isMissingTableError(error, modelNames) {
  if (error?.code !== "P2021") {
    return false;
  }

  const names = Array.isArray(modelNames) ? modelNames : [modelNames];
  return names.includes(error?.meta?.modelName);
}

async function runOptionalSeed(
  label,
  modelNames,
  callback,
  fallbackValue = null,
) {
  try {
    return await callback();
  } catch (error) {
    if (isMissingTableError(error, modelNames)) {
      const missingModel = error?.meta?.modelName || "unknown model";
      console.warn(`Skipping ${label}: ${missingModel} table not found.`);
      return fallbackValue;
    }

    throw error;
  }
}

async function seedPermissions() {
  const permissions = [];

  for (const name of PERMISSION_NAMES) {
    const permission = await prisma.permission.upsert({
      where: { name },
      update: {
        isActive: true,
        isDeleted: false,
      },
      create: {
        name,
        isActive: true,
        isDeleted: false,
      },
    });

    permissions.push(permission);
  }

  return permissions;
}

async function assignPermissionsToRole(roleId, permissions) {
  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId: permission.id,
        },
      },
      update: {
        isDeleted: false,
      },
      create: {
        roleId,
        permissionId: permission.id,
        isDeleted: false,
      },
    });
  }
}

async function upsertAdminAccount(adminDef, roleId) {
  const normalizedEmail = adminDef.email.trim().toLowerCase();
  const hashedPassword = await bcrypt.hash(adminDef.password, 10);
  const existingAdmin = await prisma.admin.findFirst({
    where: {
      OR: [
        { email: normalizedEmail },
        { phone: adminDef.phone },
        { userName: adminDef.userName },
      ],
    },
  });

  if (existingAdmin) {
    return prisma.admin.update({
      where: { id: existingAdmin.id },
      data: {
        firstName: adminDef.firstName,
        lastName: adminDef.lastName,
        email: normalizedEmail,
        phone: adminDef.phone,
        userName: adminDef.userName,
        password: hashedPassword,
        roleId,
        isActive: true,
        isDeleted: false,
        isVerified: true,
      },
    });
  }

  return prisma.admin.create({
    data: {
      firstName: adminDef.firstName,
      lastName: adminDef.lastName,
      email: normalizedEmail,
      phone: adminDef.phone,
      userName: adminDef.userName,
      password: hashedPassword,
      roleId,
      isActive: true,
      isDeleted: false,
      isVerified: true,
    },
  });
}

async function seedAdminModules() {
  const permissions = await seedPermissions();
  const superAdminRole = await ensureRole(
    SUPER_ADMIN_ROLE_NAME,
    "SYSTEM_ADMIN",
  );
  const internalAdminRole = await ensureRole(
    INTERNAL_ADMIN_ROLE_NAME,
    "INTERNAL_ADMIN",
  );

  await assignPermissionsToRole(superAdminRole.id, permissions);
  await assignPermissionsToRole(internalAdminRole.id, permissions);

  const superAdmin = await upsertAdminAccount(
    {
      firstName: "Super",
      lastName: "Admin",
      email: SUPER_ADMIN_EMAIL,
      phone: SUPER_ADMIN_PHONE,
      userName: SUPER_ADMIN_USERNAME,
      password: SUPER_ADMIN_PASSWORD,
    },
    superAdminRole.id,
  );

  const internalAdmins = [];
  for (const adminDef of INTERNAL_ADMINS) {
    internalAdmins.push(
      await upsertAdminAccount(adminDef, internalAdminRole.id),
    );
  }

  return {
    superAdmin,
    internalAdmins,
    permissions,
  };
}

async function seedBillingTransactions(resellerId, accountId) {
  const transactions = [
    {
      reference: "SEED-RECHARGE-001",
      type: "RECHARGE",
      amount: 15000,
      description: "Seeded opening recharge for primary demo account",
      accountId,
    },
    {
      reference: "SEED-COMMISSION-001",
      type: "COMMISSION",
      amount: 3200,
      description: "Seeded commission payout for April 2026",
      accountId,
    },
  ];

  for (const transaction of transactions) {
    const existing = await prisma.billingTransaction.findFirst({
      where: {
        resellerId,
        reference: transaction.reference,
      },
    });

    if (existing) {
      await prisma.billingTransaction.update({
        where: { id: existing.id },
        data: {
          accountId: transaction.accountId,
          type: transaction.type,
          amount: transaction.amount,
          currency: "INR",
          description: transaction.description,
        },
      });
    } else {
      await prisma.billingTransaction.create({
        data: {
          resellerId,
          accountId: transaction.accountId,
          type: transaction.type,
          amount: transaction.amount,
          currency: "INR",
          description: transaction.description,
          reference: transaction.reference,
        },
      });
    }
  }
}

async function seedWhatsAppSetup(accountId, ownerId) {
  const whatsAppAccount = await prisma.whatsAppAccount.upsert({
    where: {
      id: "seed-whatsapp-account-primary",
    },
    update: {
      accountId,
      phoneNumber: OWNER_PHONE,
      phoneNumberId: "phone_number_id_seed_primary",
      wabaId: "waba_id_seed_primary",
      businessId: "meta_business_seed_primary",
      accessToken: "meta_access_token_seed_primary",
      webhookVerifyToken: "meta_webhook_verify_seed_primary",
      displayName: COMPANY_NAME,
      isActive: true,
      status: "ACTIVE",
      tokenExpiresAt: new Date("2026-12-31T00:00:00.000Z"),
      metaBusinessName: COMPANY_NAME,
    },
    create: {
      id: "seed-whatsapp-account-primary",
      accountId,
      phoneNumber: OWNER_PHONE,
      phoneNumberId: "phone_number_id_seed_primary",
      wabaId: "waba_id_seed_primary",
      businessId: "meta_business_seed_primary",
      accessToken: "meta_access_token_seed_primary",
      webhookVerifyToken: "meta_webhook_verify_seed_primary",
      displayName: COMPANY_NAME,
      isActive: true,
      status: "ACTIVE",
      tokenExpiresAt: new Date("2026-12-31T00:00:00.000Z"),
      metaBusinessName: COMPANY_NAME,
    },
  });

  await prisma.wabaVerification.upsert({
    where: { userId: ownerId },
    update: {
      clientPhone: OWNER_PHONE,
      otp: "123456",
      otpExpires: new Date("2026-12-31T00:10:00.000Z"),
      status: "VERIFIED",
      wabaPhoneId: whatsAppAccount.phoneNumberId,
      wabaWabaId: whatsAppAccount.wabaId,
    },
    create: {
      userId: ownerId,
      clientPhone: OWNER_PHONE,
      otp: "123456",
      otpExpires: new Date("2026-12-31T00:10:00.000Z"),
      status: "VERIFIED",
      wabaPhoneId: whatsAppAccount.phoneNumberId,
      wabaWabaId: whatsAppAccount.wabaId,
    },
  });

  const webhookEvents = [
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

  for (const eventDef of webhookEvents) {
    const existing = await prisma.webhookEvent.findFirst({
      where: {
        accountId,
        eventType: eventDef.eventType,
      },
    });

    if (existing) {
      await prisma.webhookEvent.update({
        where: { id: existing.id },
        data: eventDef,
      });
    } else {
      await prisma.webhookEvent.create({
        data: {
          accountId,
          ...eventDef,
        },
      });
    }
  }

  return whatsAppAccount;
}

async function seedAccessTokens(ownerId, accountId) {
  const teamAdmin = await prisma.user.findFirst({
    where: {
      accountId,
      email: "anita.desai@chatflow-demo.com",
    },
  });

  const tokenDefs = [
    {
      userId: ownerId,
      service: "TEMPLATE",
      tokenHash: hashValue("seed-template-token-owner"),
      limitValue: 100,
      usedValue: 12,
    },
    {
      userId: ownerId,
      service: "BOT",
      tokenHash: hashValue("seed-bot-token-owner"),
      limitValue: 25,
      usedValue: 3,
    },
    {
      userId: teamAdmin?.id || ownerId,
      service: "MESSAGE",
      tokenHash: hashValue("seed-message-token-admin"),
      limitValue: 5000,
      usedValue: 428,
    },
  ];

  for (const tokenDef of tokenDefs) {
    const existing = await prisma.accessToken.findFirst({
      where: {
        userId: tokenDef.userId,
        service: tokenDef.service,
      },
    });

    if (existing) {
      await prisma.accessToken.update({
        where: { id: existing.id },
        data: tokenDef,
      });
    } else {
      await prisma.accessToken.create({
        data: {
          ...tokenDef,
          isActive: true,
        },
      });
    }
  }
}

async function seedMessageLogs(accountId, ownerId, templatesByName, contacts) {
  const template = templatesByName.get("welcome_offer_template");
  const contactByPhone = new Map(
    contacts.map((contact) => [contact.phone, contact]),
  );
  const messageDefs = [
    {
      metaMessageId: "wamid.seed.outbound.001",
      to: "919810000001",
      from: OWNER_PHONE,
      type: "TEMPLATE",
      direction: "OUTBOUND",
      templateName: template?.name || "welcome_offer_template",
      templateId: template?.id || null,
      payload: {
        to: "919810000001",
        template: template?.name || "welcome_offer_template",
        variables: ["Rahul"],
      },
      status: "DELIVERED",
      conversationId: "seed-conversation-rahul",
      messageText: "Welcome offer sent to Rahul",
      price: 0.82,
      currency: "INR",
      createdAt: new Date("2026-04-18T09:30:00.000Z"),
    },
    {
      metaMessageId: "wamid.seed.inbound.001",
      to: OWNER_PHONE,
      from: "919810000001",
      type: "TEXT",
      direction: "INBOUND",
      templateName: null,
      templateId: null,
      payload: {
        from: "919810000001",
        text: "I want to talk to an advisor",
      },
      status: "READ",
      conversationId: "seed-conversation-rahul",
      messageText: "I want to talk to an advisor",
      price: null,
      currency: null,
      createdAt: new Date("2026-04-18T09:32:00.000Z"),
    },
    {
      metaMessageId: "wamid.seed.outbound.002",
      to: "919810000002",
      from: OWNER_PHONE,
      type: "TEXT",
      direction: "OUTBOUND",
      templateName: null,
      templateId: null,
      payload: {
        to: "919810000002",
        text: "Your onboarding checklist is ready.",
      },
      status: "SENT",
      conversationId: "seed-conversation-priya",
      messageText: "Your onboarding checklist is ready.",
      price: 0.21,
      currency: "INR",
      createdAt: new Date("2026-04-19T14:15:00.000Z"),
    },
  ];

  const logs = [];
  for (const messageDef of messageDefs) {
    const existing = await prisma.messageLog.findUnique({
      where: {
        metaMessageId: messageDef.metaMessageId,
      },
    });

    const logData = {
      accountId,
      sentByUserId: messageDef.direction === "OUTBOUND" ? ownerId : null,
      to: messageDef.to,
      from: messageDef.from,
      metaMessageId: messageDef.metaMessageId,
      type: messageDef.type,
      direction: messageDef.direction,
      templateName: messageDef.templateName,
      payload: {
        ...messageDef.payload,
        contactId:
          contactByPhone.get(
            messageDef.direction === "INBOUND"
              ? messageDef.from
              : messageDef.to,
          )?.id || null,
      },
      status: messageDef.status,
      createdAt: messageDef.createdAt,
      conversationId: messageDef.conversationId,
      messageText: messageDef.messageText,
      templateId: messageDef.templateId,
      mediaUrl: null,
      errorMessage: null,
      price: messageDef.price,
      currency: messageDef.currency,
    };

    const log = existing
      ? await prisma.messageLog.update({
          where: { id: existing.id },
          data: logData,
        })
      : await prisma.messageLog.create({
          data: logData,
        });

    logs.push(log);
  }

  return logs;
}

async function seedBots(accountId, ownerId, templatesByName) {
  const bots = [];

  for (const botDef of BOT_DEFINITIONS) {
    const existingBot = await prisma.bot.findFirst({
      where: {
        accountId,
        name: botDef.name,
        isDeleted: false,
      },
    });

    const bot = existingBot
      ? await prisma.bot.update({
          where: { id: existingBot.id },
          data: {
            createdByUserId: ownerId,
            botType: botDef.botType,
            triggerType: botDef.triggerType,
            triggerValue: botDef.triggerValue,
            flow: botDef.flow,
            entryNodeKey: botDef.entryNodeKey,
            isActive: true,
            isDeleted: false,
          },
        })
      : await prisma.bot.create({
          data: {
            accountId,
            createdByUserId: ownerId,
            name: botDef.name,
            botType: botDef.botType,
            triggerType: botDef.triggerType,
            triggerValue: botDef.triggerValue,
            flow: botDef.flow,
            entryNodeKey: botDef.entryNodeKey,
            isActive: true,
            isDeleted: false,
          },
        });

    await prisma.botFlow.upsert({
      where: {
        botId_version: {
          botId: bot.id,
          version: botDef.flowVersion,
        },
      },
      update: {
        flowDefinition: botDef.flow,
        isPublished: true,
      },
      create: {
        botId: bot.id,
        flowDefinition: botDef.flow,
        version: botDef.flowVersion,
        isPublished: true,
      },
    });

    for (const templateName of botDef.templates) {
      const template = templatesByName.get(templateName);
      if (!template) {
        continue;
      }

      await prisma.botTemplate.upsert({
        where: {
          botId_templateId: {
            botId: bot.id,
            templateId: template.id,
          },
        },
        update: {
          accountId,
        },
        create: {
          accountId,
          botId: bot.id,
          templateId: template.id,
        },
      });
    }

    for (const replyDef of botDef.replies) {
      const existingReply = await prisma.botReply.findUnique({
        where: {
          botId_nodeKey: {
            botId: bot.id,
            nodeKey: replyDef.nodeKey,
          },
        },
      });

      const reply = existingReply
        ? await prisma.botReply.update({
            where: { id: existingReply.id },
            data: {
              accountId,
              templateId: null,
              name: replyDef.name,
              isStart: replyDef.isStart || false,
              isEnd: replyDef.isEnd || false,
              replyType: replyDef.replyType,
              triggerType: replyDef.triggerType,
              triggerValue: replyDef.triggerValue || null,
              parentNodeKey: replyDef.parentNodeKey || null,
              bodyText: replyDef.bodyText || null,
              footerText: replyDef.footerText || null,
              interactiveType: replyDef.interactiveType || null,
              nextNodeKey: replyDef.nextNodeKey || null,
              isActive: true,
              isDeleted: false,
            },
          })
        : await prisma.botReply.create({
            data: {
              botId: bot.id,
              accountId,
              templateId: null,
              name: replyDef.name,
              nodeKey: replyDef.nodeKey,
              isStart: replyDef.isStart || false,
              isEnd: replyDef.isEnd || false,
              replyType: replyDef.replyType,
              triggerType: replyDef.triggerType,
              triggerValue: replyDef.triggerValue || null,
              parentNodeKey: replyDef.parentNodeKey || null,
              bodyText: replyDef.bodyText || null,
              footerText: replyDef.footerText || null,
              interactiveType: replyDef.interactiveType || null,
              nextNodeKey: replyDef.nextNodeKey || null,
              isActive: true,
              isDeleted: false,
            },
          });

      await prisma.botReplyButton.deleteMany({
        where: { replyId: reply.id },
      });

      if (replyDef.buttons?.length) {
        await prisma.botReplyButton.createMany({
          data: replyDef.buttons.map((button) => ({
            accountId,
            replyId: reply.id,
            label: button.label,
            payload: button.payload || null,
            order: button.order,
          })),
        });
      }

      if (replyDef.media) {
        await prisma.botReplyMedia.upsert({
          where: { replyId: reply.id },
          update: {
            accountId,
            mediaType: replyDef.media.mediaType,
            fileUrl: replyDef.media.fileUrl || null,
            mimeType: replyDef.media.mimeType || null,
            metaMediaId: replyDef.media.metaMediaId || null,
          },
          create: {
            accountId,
            replyId: reply.id,
            mediaType: replyDef.media.mediaType,
            fileUrl: replyDef.media.fileUrl || null,
            mimeType: replyDef.media.mimeType || null,
            metaMediaId: replyDef.media.metaMediaId || null,
          },
        });
      } else {
        await prisma.botReplyMedia.deleteMany({
          where: { replyId: reply.id },
        });
      }

      if (replyDef.ctaButton) {
        await prisma.botReplyCTA.upsert({
          where: { replyId: reply.id },
          update: {
            accountId,
            displayText: replyDef.ctaButton.displayText,
            url: replyDef.ctaButton.url,
          },
          create: {
            accountId,
            replyId: reply.id,
            displayText: replyDef.ctaButton.displayText,
            url: replyDef.ctaButton.url,
          },
        });
      } else {
        await prisma.botReplyCTA.deleteMany({
          where: { replyId: reply.id },
        });
      }

      const existingList = await prisma.botReplyList.findUnique({
        where: { replyId: reply.id },
        include: {
          sections: {
            include: {
              rows: true,
            },
          },
        },
      });

      if (existingList) {
        const rowIds = existingList.sections.flatMap((section) =>
          section.rows.map((row) => row.id),
        );
        const sectionIds = existingList.sections.map((section) => section.id);

        if (rowIds.length) {
          await prisma.botReplyListRow.deleteMany({
            where: {
              id: { in: rowIds },
            },
          });
        }

        if (sectionIds.length) {
          await prisma.botReplyListSection.deleteMany({
            where: {
              id: { in: sectionIds },
            },
          });
        }

        await prisma.botReplyList.delete({
          where: { id: existingList.id },
        });
      }

      if (replyDef.listMessage) {
        const list = await prisma.botReplyList.create({
          data: {
            accountId,
            replyId: reply.id,
            buttonLabel: replyDef.listMessage.buttonLabel,
          },
        });

        for (const sectionDef of replyDef.listMessage.sections) {
          const section = await prisma.botReplyListSection.create({
            data: {
              accountId,
              listId: list.id,
              title: sectionDef.title,
              order: sectionDef.order,
            },
          });

          if (sectionDef.rows?.length) {
            await prisma.botReplyListRow.createMany({
              data: sectionDef.rows.map((row) => ({
                accountId,
                sectionId: section.id,
                title: row.title,
                description: row.description || null,
                rowId: row.rowId,
                order: row.order,
              })),
            });
          }
        }
      }
    }

    await prisma.botSession.upsert({
      where: {
        accountId_botId_contact_isActive: {
          accountId,
          botId: bot.id,
          contact: botDef.sessionContact,
          isActive: true,
        },
      },
      update: {
        currentNodeKey: botDef.currentNodeKey,
        previousNodeKey: botDef.previousNodeKey || null,
        state: botDef.state,
        triggerType: botDef.triggerType,
        botType: botDef.botType,
        flowVersion: String(botDef.flowVersion),
        isAIHandled: botDef.botType === "AI",
        lastMessageAt: new Date("2026-04-22T11:30:00.000Z"),
        expiresAt: new Date("2026-04-29T11:30:00.000Z"),
      },
      create: {
        accountId,
        contact: botDef.sessionContact,
        botId: bot.id,
        currentNodeKey: botDef.currentNodeKey,
        previousNodeKey: botDef.previousNodeKey || null,
        state: botDef.state,
        triggerType: botDef.triggerType,
        botType: botDef.botType,
        flowVersion: String(botDef.flowVersion),
        isActive: true,
        isAIHandled: botDef.botType === "AI",
        lastMessageAt: new Date("2026-04-22T11:30:00.000Z"),
        expiresAt: new Date("2026-04-29T11:30:00.000Z"),
      },
    });

    bots.push(bot);
  }

  return bots;
}

async function seedCampaignOperationalData(accountId, messageLogs) {
  const campaigns = await prisma.campaign.findMany({
    where: {
      accountId,
      isDeleted: false,
    },
    include: {
      audiences: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  for (const campaign of campaigns) {
    await prisma.campaignJob.deleteMany({
      where: { campaignId: campaign.id },
    });

    await prisma.campaignMessage.deleteMany({
      where: { campaignId: campaign.id },
    });

    if (campaign.audiences.length) {
      const splitPoint = Math.max(1, Math.ceil(campaign.audiences.length / 2));
      const firstBatch = campaign.audiences.slice(0, splitPoint);
      const secondBatch = campaign.audiences.slice(splitPoint);

      const jobs = [
        {
          campaignId: campaign.id,
          batchNumber: 1,
          totalRecords: firstBatch.length,
          status: campaign.status === "FAILED" ? "FAILED" : "COMPLETED",
          startedAt: campaign.startedAt || campaign.createdAt,
          completedAt:
            campaign.status === "FAILED"
              ? null
              : campaign.completedAt || new Date(),
          errorMessage:
            campaign.status === "FAILED"
              ? "Seeded campaign batch failed during processing"
              : null,
        },
      ];

      if (secondBatch.length) {
        jobs.push({
          campaignId: campaign.id,
          batchNumber: 2,
          totalRecords: secondBatch.length,
          status:
            campaign.status === "RUNNING" || campaign.status === "SCHEDULED"
              ? "PROCESSING"
              : campaign.status === "FAILED"
                ? "PENDING"
                : "COMPLETED",
          startedAt:
            campaign.status === "RUNNING"
              ? campaign.startedAt || campaign.createdAt
              : null,
          completedAt:
            campaign.status === "COMPLETED" || campaign.status === "CANCELLED"
              ? campaign.completedAt || new Date()
              : null,
          errorMessage: null,
        });
      }

      await prisma.campaignJob.createMany({ data: jobs });

      await prisma.campaignMessage.createMany({
        data: campaign.audiences.map((audience, index) => ({
          campaignId: campaign.id,
          contactId: audience.contactId,
          messageLogId: messageLogs[index % messageLogs.length]?.id || null,
          status: audience.status,
        })),
      });
    }
  }
}

async function main() {
  const { superAdmin, internalAdmins, permissions } = await seedAdminModules();
  const reseller = await ensureReseller();
  const role = await ensureOwnerRole();
  const plansByName = await seedPlans();
  const { owner, account } = await ensureOwnerAccount(role.id);
  await prisma.customerAccount.update({
    where: { id: account.id },
    data: {
      resellerId: reseller.id,
      isActive: true,
      isDeleted: false,
    },
  });
  const growthPlan =
    plansByName.get("Growth") || plansByName.values().next().value;
  if (growthPlan) {
    await ensureAccountSubscription(
      account.id,
      growthPlan.id,
      new Date("2026-01-15T00:00:00.000Z"),
    );
  }
  await seedResellerManagedCustomers(reseller.id, role.id, plansByName);
  await seedCustomerTeamMembers(account.id, owner.id);
  await seedTeamInvites(account.id, owner.id);
  await runOptionalSeed("reseller team seed", "ResellerMember", () =>
    seedResellerTeamMembers(reseller.id),
  );

  const groupsByTitle = await seedContactGroups(account.id, owner.id);
  const fieldsByKey = await seedCustomFields(account.id);
  const contacts = await seedContacts(
    account.id,
    owner.id,
    groupsByTitle,
    fieldsByKey,
  );
  const templatesByName = await seedTemplates(account.id, owner.id);
  await runOptionalSeed("billing transaction seed", "BillingTransaction", () =>
    seedBillingTransactions(reseller.id, account.id),
  );
  await runOptionalSeed(
    "WhatsApp setup seed",
    ["WhatsAppAccount", "WabaVerification", "WebhookEvent"],
    () => seedWhatsAppSetup(account.id, owner.id),
  );
  await runOptionalSeed("access token seed", "AccessToken", () =>
    seedAccessTokens(owner.id, account.id),
  );
  await runOptionalSeed(
    "bot seed",
    [
      "Bot",
      "BotFlow",
      "BotTemplate",
      "BotReply",
      "BotReplyMedia",
      "BotReplyButton",
      "BotReplyCTA",
      "BotReplyList",
      "BotReplyListSection",
      "BotReplyListRow",
      "BotSession",
    ],
    () => seedBots(account.id, owner.id, templatesByName),
  );
  const messageLogs =
    (await runOptionalSeed(
      "message log seed",
      "MessageLog",
      () => seedMessageLogs(account.id, owner.id, templatesByName, contacts),
      [],
    )) || [];

  await seedCampaigns(
    account.id,
    owner.id,
    templatesByName,
    contacts,
    groupsByTitle,
  );
  await runOptionalSeed(
    "campaign operational seed",
    ["CampaignJob", "CampaignMessage"],
    () => seedCampaignOperationalData(account.id, messageLogs),
  );

  console.log("Seed completed successfully.");
  console.log(`Super admin email: ${SUPER_ADMIN_EMAIL}`);
  console.log(`Super admin phone: ${SUPER_ADMIN_PHONE}`);
  console.log(`Super admin password: ${SUPER_ADMIN_PASSWORD}`);
  console.log(
    `Seeded permissions: ${permissions.map((item) => item.name).join(", ")}`,
  );
  console.log(
    `Internal admin emails: ${internalAdmins.map((item) => item.email).join(", ")}`,
  );
  console.log(`Reseller email: ${RESELLER_EMAIL}`);
  console.log(`Reseller phone: ${RESELLER_PHONE}`);
  console.log(`Reseller password: ${RESELLER_PASSWORD}`);
  console.log(`Reseller company: ${RESELLER_COMPANY_NAME}`);
  console.log(`Plans seeded: ${Array.from(plansByName.keys()).join(", ")}`);
  console.log(`Owner email: ${OWNER_EMAIL}`);
  console.log(`Owner phone: ${OWNER_PHONE}`);
  console.log(`Owner password: ${OWNER_PASSWORD}`);
  console.log(`Account: ${COMPANY_NAME}`);
  console.log(`Primary admin id: ${superAdmin.id}`);
  console.log(
    `Additional reseller customers: ${RESELLER_CUSTOMER_DEFINITIONS.map((item) => item.companyName).join(", ")}`,
  );
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
