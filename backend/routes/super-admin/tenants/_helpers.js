function pickOwner(users = []) {
  return (
    users.find((user) => user.role?.roleType === "CUSTOMER_OWNER") ||
    users.find((user) => user.role?.roleType === "CUSTOMER_ADMIN") ||
    users[0] ||
    null
  );
}

function mapStatus(account) {
  if (account.isDeleted) return "Deleted";
  if (account.lifecycleStatus === "EXPIRED" || account.statusReason === "ARCHIVED") {
    return "Archived";
  }
  if (!account.isActive || account.lifecycleStatus === "SUSPENDED") {
    return "Suspended";
  }
  if (account.lifecycleStatus === "TRIAL") return "Trial";
  if (account.lifecycleStatus === "PAUSED") return "Paused";
  if (account.lifecycleStatus === "PENDING_VERIFICATION") {
    return "Pending";
  }
  return account.isActive ? "Active" : "Suspended";
}

function mapTenantListItem(account, extras = {}) {
  const owner = pickOwner(account.users || []);
  const subscription = account.subscriptions?.[0] || null;

  return {
    id: account.id,
    organization: account.companyName,
    owner: owner
      ? {
          id: owner.id,
          name: `${owner.firstName || ""} ${owner.lastName || ""}`.trim(),
          firstName: owner.firstName,
          lastName: owner.lastName,
          email: owner.email,
          phone: owner.phone,
        }
      : null,
    email: owner?.email || null,
    plan: subscription?.plan
      ? {
          id: subscription.plan.id,
          name: subscription.plan.name,
          price: subscription.plan.price,
          currency: subscription.plan.currency,
        }
      : null,
    whatsappCount: extras.whatsappCount ?? account._count?.whatsAppAccounts ?? 0,
    usersCount: extras.usersCount ?? account._count?.users ?? (account.users || []).length,
    messagesCount: extras.messagesCount ?? account._count?.messageLogs ?? 0,
    status: mapStatus(account),
    lifecycleStatus: account.lifecycleStatus,
    isActive: account.isActive,
    isDeleted: account.isDeleted,
    trialEndsAt: account.trialEndsAt,
    createdAt: account.createdAt,
    reseller: account.reseller
      ? { id: account.reseller.id, companyName: account.reseller.companyName }
      : null,
  };
}

function requireSystemAdmin(req, res, RESPONSE_CODES) {
  if (req.admin.role?.roleType !== "SYSTEM_ADMIN") {
    res.status(RESPONSE_CODES.FORBIDDEN).json({
      status: 0,
      message: "Access denied",
      statusCode: RESPONSE_CODES.FORBIDDEN,
      data: {},
    });
    return false;
  }
  return true;
}

module.exports = {
  pickOwner,
  mapStatus,
  mapTenantListItem,
  requireSystemAdmin,
};
