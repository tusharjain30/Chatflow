require("dotenv").config({ quiet: true });
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { PrismaClient } = require("../generated/prisma/client");
const {
  OWNER,
  SUPER_ADMIN,
  INTERNAL_ADMIN_ROLE_NAME,
  RESELLER,
  PRIMARY_SUBSCRIPTION_START_DATE,
  PRIMARY_PLAN_NAME,
  PERMISSION_NAMES,
  PLAN_DEFINITIONS,
  CONTACT_GROUPS,
  CUSTOM_FIELDS,
  CONTACT_DEFINITIONS,
  TEMPLATE_DEFINITIONS,
  TEAM_INVITE_DEFINITIONS,
  CUSTOMER_TEAM_MEMBERS,
  RESELLER_TEAM_MEMBERS,
  INTERNAL_ADMINS,
  RESELLER_CUSTOMER_DEFINITIONS,
  BOT_DEFINITIONS,
  CAMPAIGN_DEFINITIONS,
  BILLING_TRANSACTIONS,
  WHATSAPP_ACCOUNT,
  WABA_VERIFICATION,
  WEBHOOK_EVENTS,
  ACCESS_TOKEN_DEFINITIONS,
  MESSAGE_LOG_DEFINITIONS,
} = require("./seed/data");
const {
  buildTemplateComponents,
  hashValue,
  runOptionalSeed,
  buildResellerTeamUserName,
  metricsFromAudienceStatuses,
} = require("./seed/helpers");

const prisma = new PrismaClient();

async function ensureOwnerRole() {
  return prisma.role.upsert({
    where: { name: OWNER.roleName },
    update: {
      roleType: "CUSTOMER_OWNER",
      isActive: true,
      isDeleted: false,
    },
    create: {
      name: OWNER.roleName,
      roleType: "CUSTOMER_OWNER",
      isActive: true,
      isDeleted: false,
    },
  });
}

async function ensureOwnerAccount(roleId) {
  const hashedPassword = await bcrypt.hash(OWNER.password, 10);

  const existingOwner = await prisma.user.findFirst({
    where: {
      OR: [
        { email: OWNER.email },
        { phone: OWNER.phone },
        { userName: OWNER.userName },
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
        firstName: OWNER.firstName,
        lastName: OWNER.lastName,
        email: OWNER.email,
        phone: OWNER.phone,
        userName: OWNER.userName,
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
        companyName: OWNER.companyName,
        isActive: true,
        isDeleted: false,
      },
    });

    return { owner, account };
  }

  return prisma.$transaction(async (tx) => {
    const account = await tx.customerAccount.create({
      data: {
        companyName: OWNER.companyName,
        isActive: true,
        isDeleted: false,
      },
    });

    const owner = await tx.user.create({
      data: {
        firstName: OWNER.firstName,
        lastName: OWNER.lastName,
        email: OWNER.email,
        phone: OWNER.phone,
        userName: OWNER.userName,
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
  const hashedPassword = await bcrypt.hash(RESELLER.password, 10);

  const existingReseller = await prisma.reseller.findFirst({
    where: {
      OR: [
        { email: RESELLER.email },
        { phone: RESELLER.phone },
        { userName: RESELLER.userName },
      ],
    },
  });

  if (existingReseller) {
    return prisma.reseller.update({
      where: { id: existingReseller.id },
      data: {
        companyName: RESELLER.companyName,
        firstName: RESELLER.firstName,
        lastName: RESELLER.lastName,
        email: RESELLER.email,
        phone: RESELLER.phone,
        userName: RESELLER.userName,
        password: hashedPassword,
        commissionRate: RESELLER.commissionRate,
        balance: RESELLER.balance,
        isActive: true,
        isDeleted: false,
        isVerified: true,
      },
    });
  }

  return prisma.reseller.create({
    data: {
      companyName: RESELLER.companyName,
      firstName: RESELLER.firstName,
      lastName: RESELLER.lastName,
      email: RESELLER.email,
      phone: RESELLER.phone,
      userName: RESELLER.userName,
      password: hashedPassword,
      commissionRate: RESELLER.commissionRate,
      balance: RESELLER.balance,
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

async function seedCustomerTeamMembers(accountId) {
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
  const contactsByPhone = new Map(
    contacts.map((contact) => [contact.phone, contact]),
  );

  const getContactIds = (phones = []) =>
    phones.map((phone) => contactsByPhone.get(phone)?.id).filter(Boolean);

  for (const campaignDef of CAMPAIGN_DEFINITIONS) {
    const template = templatesByName.get(campaignDef.templateName);
    if (!template?.id) {
      continue;
    }

    const audienceGroup = campaignDef.audienceGroupTitle
      ? groupsByTitle.get(campaignDef.audienceGroupTitle) ||
        groupsByTitle.get("Hot Leads")
      : null;

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
            templateId: template.id,
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
            templateId: template.id,
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

    let audienceContactIds = getContactIds(campaignDef.audiencePhones || []);

    if (!audienceContactIds.length && audienceGroup?.id) {
      const mappings = await prisma.contactGroupMap.findMany({
        where: {
          accountId,
          groupId: audienceGroup.id,
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
  const superAdminRole = await ensureRole(SUPER_ADMIN.roleName, "SYSTEM_ADMIN");
  const internalAdminRole = await ensureRole(
    INTERNAL_ADMIN_ROLE_NAME,
    "INTERNAL_ADMIN",
  );

  await assignPermissionsToRole(superAdminRole.id, permissions);
  await assignPermissionsToRole(internalAdminRole.id, permissions);

  const superAdmin = await upsertAdminAccount(
    {
      firstName: SUPER_ADMIN.firstName,
      lastName: SUPER_ADMIN.lastName,
      email: SUPER_ADMIN.email,
      phone: SUPER_ADMIN.phone,
      userName: SUPER_ADMIN.userName,
      password: SUPER_ADMIN.password,
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
  for (const transaction of BILLING_TRANSACTIONS) {
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
          accountId,
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
          accountId,
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
      id: WHATSAPP_ACCOUNT.id,
    },
    update: {
      accountId,
      phoneNumber: OWNER.phone,
      phoneNumberId: WHATSAPP_ACCOUNT.phoneNumberId,
      wabaId: WHATSAPP_ACCOUNT.wabaId,
      businessId: WHATSAPP_ACCOUNT.businessId,
      accessToken: WHATSAPP_ACCOUNT.accessToken,
      webhookVerifyToken: WHATSAPP_ACCOUNT.webhookVerifyToken,
      displayName: OWNER.companyName,
      isActive: WHATSAPP_ACCOUNT.isActive,
      status: WHATSAPP_ACCOUNT.status,
      tokenExpiresAt: WHATSAPP_ACCOUNT.tokenExpiresAt,
      metaBusinessName: OWNER.companyName,
    },
    create: {
      id: WHATSAPP_ACCOUNT.id,
      accountId,
      phoneNumber: OWNER.phone,
      phoneNumberId: WHATSAPP_ACCOUNT.phoneNumberId,
      wabaId: WHATSAPP_ACCOUNT.wabaId,
      businessId: WHATSAPP_ACCOUNT.businessId,
      accessToken: WHATSAPP_ACCOUNT.accessToken,
      webhookVerifyToken: WHATSAPP_ACCOUNT.webhookVerifyToken,
      displayName: OWNER.companyName,
      isActive: WHATSAPP_ACCOUNT.isActive,
      status: WHATSAPP_ACCOUNT.status,
      tokenExpiresAt: WHATSAPP_ACCOUNT.tokenExpiresAt,
      metaBusinessName: OWNER.companyName,
    },
  });

  await prisma.wabaVerification.upsert({
    where: { userId: ownerId },
    update: {
      clientPhone: OWNER.phone,
      otp: WABA_VERIFICATION.otp,
      otpExpires: WABA_VERIFICATION.otpExpires,
      status: WABA_VERIFICATION.status,
      wabaPhoneId: whatsAppAccount.phoneNumberId,
      wabaWabaId: whatsAppAccount.wabaId,
    },
    create: {
      userId: ownerId,
      clientPhone: OWNER.phone,
      otp: WABA_VERIFICATION.otp,
      otpExpires: WABA_VERIFICATION.otpExpires,
      status: WABA_VERIFICATION.status,
      wabaPhoneId: whatsAppAccount.phoneNumberId,
      wabaWabaId: whatsAppAccount.wabaId,
    },
  });

  for (const eventDef of WEBHOOK_EVENTS) {
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
  for (const tokenDef of ACCESS_TOKEN_DEFINITIONS) {
    let userId = ownerId;

    if (!tokenDef.useOwner && tokenDef.userEmail) {
      const teamUser = await prisma.user.findFirst({
        where: {
          accountId,
          email: tokenDef.userEmail,
        },
      });
      userId = teamUser?.id || ownerId;
    }

    const payload = {
      userId,
      service: tokenDef.service,
      tokenHash: hashValue(tokenDef.rawToken),
      limitValue: tokenDef.limitValue,
      usedValue: tokenDef.usedValue,
    };

    const existing = await prisma.accessToken.findFirst({
      where: {
        userId: payload.userId,
        service: payload.service,
      },
    });

    if (existing) {
      await prisma.accessToken.update({
        where: { id: existing.id },
        data: payload,
      });
    } else {
      await prisma.accessToken.create({
        data: {
          ...payload,
          isActive: true,
        },
      });
    }
  }
}

async function seedMessageLogs(accountId, ownerId, templatesByName, contacts) {
  const contactByPhone = new Map(
    contacts.map((contact) => [contact.phone, contact]),
  );

  const logs = [];
  for (const messageDef of MESSAGE_LOG_DEFINITIONS) {
    const template = messageDef.templateName
      ? templatesByName.get(messageDef.templateName)
      : null;

    const existing = await prisma.messageLog.findUnique({
      where: {
        metaMessageId: messageDef.metaMessageId,
      },
    });

    const to = messageDef.toOwner ? OWNER.phone : messageDef.to;
    const from = messageDef.fromOwner ? OWNER.phone : messageDef.from;

    const logData = {
      accountId,
      sentByUserId: messageDef.direction === "OUTBOUND" ? ownerId : null,
      to,
      from,
      metaMessageId: messageDef.metaMessageId,
      type: messageDef.type,
      direction: messageDef.direction,
      templateName: template?.name || messageDef.templateName,
      payload: {
        ...messageDef.payload,
        contactId:
          contactByPhone.get(
            messageDef.direction === "INBOUND" ? from : to,
          )?.id || null,
      },
      status: messageDef.status,
      createdAt: messageDef.createdAt,
      conversationId: messageDef.conversationId,
      messageText: messageDef.messageText,
      templateId: template?.id || null,
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

async function seedSupportTickets(accountId, ownerId) {
  const tickets = [
    {
      ref: "SUP-000001-260821",
      subject: "Not Able To Send Messages",
      description: "Unable to send outbound WhatsApp messages from inbox.",
      category: "WHATSAPP_ISSUE",
      priority: "CRITICAL",
      status: "RESOLVED",
      createdAt: new Date("2026-08-21T08:17:00.000Z"),
      updatedAt: new Date("2026-08-21T08:27:38.000Z"),
    },
    {
      ref: "SUP-000002-260820",
      subject: "Template approval delay",
      description: "Marketing template is stuck in pending for several days.",
      category: "CAMPAIGNS",
      priority: "NOT_SET",
      status: "OPEN",
      createdAt: new Date("2026-08-20T10:12:00.000Z"),
      updatedAt: new Date("2026-08-20T10:12:00.000Z"),
    },
    {
      ref: "SUP-000003-260819",
      subject: "Billing invoice request",
      description: "Please share last month invoice for company records.",
      category: "BILLING",
      priority: "MEDIUM",
      status: "CLOSED",
      createdAt: new Date("2026-08-19T14:05:00.000Z"),
      updatedAt: new Date("2026-08-19T16:40:00.000Z"),
    },
  ];

  for (const ticket of tickets) {
    await prisma.supportTicket.upsert({
      where: {
        accountId_ref: {
          accountId,
          ref: ticket.ref,
        },
      },
      update: {
        subject: ticket.subject,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        isDeleted: false,
        updatedAt: ticket.updatedAt,
      },
      create: {
        accountId,
        createdByUserId: ownerId,
        ref: ticket.ref,
        subject: ticket.subject,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
      },
    });
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
  const primaryPlan =
    plansByName.get(PRIMARY_PLAN_NAME) || plansByName.values().next().value;
  if (primaryPlan) {
    await ensureAccountSubscription(
      account.id,
      primaryPlan.id,
      PRIMARY_SUBSCRIPTION_START_DATE,
    );
  }
  await seedResellerManagedCustomers(reseller.id, role.id, plansByName);
  await seedCustomerTeamMembers(account.id);
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
  await runOptionalSeed("support ticket seed", "SupportTicket", () =>
    seedSupportTickets(account.id, owner.id),
  );

  console.log("Seed completed successfully.");
  console.log(`Super admin email: ${SUPER_ADMIN.email}`);
  console.log(`Super admin phone: ${SUPER_ADMIN.phone}`);
  console.log(`Super admin password: ${SUPER_ADMIN.password}`);
  console.log(
    `Seeded permissions: ${permissions.map((item) => item.name).join(", ")}`,
  );
  console.log(
    `Internal admin emails: ${internalAdmins.map((item) => item.email).join(", ")}`,
  );
  console.log(`Reseller email: ${RESELLER.email}`);
  console.log(`Reseller phone: ${RESELLER.phone}`);
  console.log(`Reseller password: ${RESELLER.password}`);
  console.log(`Reseller company: ${RESELLER.companyName}`);
  console.log(`Plans seeded: ${Array.from(plansByName.keys()).join(", ")}`);
  console.log(`Owner email: ${OWNER.email}`);
  console.log(`Owner phone: ${OWNER.phone}`);
  console.log(`Owner password: ${OWNER.password}`);
  console.log(`Account: ${OWNER.companyName}`);
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
