const buildInvoiceNumber = (subscriptionId) =>
  `INV-${subscriptionId.slice(0, 8).toUpperCase()}`;

const formatInvoiceStatus = (isActive) => (isActive ? "PAID" : "ARCHIVED");

async function fetchInvoiceSubscriptions(prisma, filters = {}) {
  const {
    search = "",
    resellerId,
    customerId,
    status,
    skip,
    take,
  } = filters;

  const where = {
    ...(status === "paid"
      ? { isActive: true }
      : status === "archived"
        ? { isActive: false }
        : {}),
    ...(customerId ? { accountId: customerId } : {}),
    account: {
      isDeleted: false,
      ...(resellerId ? { resellerId } : {}),
      ...(search
        ? {
            OR: [
              { companyName: { contains: search, mode: "insensitive" } },
              {
                reseller: {
                  companyName: { contains: search, mode: "insensitive" },
                },
              },
            ],
          }
        : {}),
    },
  };

  return prisma.subscription.findMany({
    where,
    include: {
      plan: {
        select: {
          id: true,
          name: true,
          price: true,
          currency: true,
        },
      },
      account: {
        select: {
          id: true,
          companyName: true,
          reseller: {
            select: {
              id: true,
              companyName: true,
              commissionRate: true,
            },
          },
        },
      },
    },
    orderBy: {
      startDate: "desc",
    },
    ...(typeof skip === "number" ? { skip } : {}),
    ...(typeof take === "number" ? { take } : {}),
  });
}

async function countInvoiceSubscriptions(prisma, filters = {}) {
  const { search = "", resellerId, customerId, status } = filters;

  return prisma.subscription.count({
    where: {
      ...(status === "paid"
        ? { isActive: true }
        : status === "archived"
          ? { isActive: false }
          : {}),
      ...(customerId ? { accountId: customerId } : {}),
      account: {
        isDeleted: false,
        ...(resellerId ? { resellerId } : {}),
        ...(search
          ? {
              OR: [
                { companyName: { contains: search, mode: "insensitive" } },
                {
                  reseller: {
                    companyName: { contains: search, mode: "insensitive" },
                  },
                },
              ],
            }
          : {}),
      },
    },
  });
}

function mapSubscriptionToInvoice(subscription) {
  const amount = subscription.plan?.price || 0;
  const commissionRate = subscription.account?.reseller?.commissionRate || 0;
  const commissionAmount = Number(((amount * commissionRate) / 100).toFixed(2));

  return {
    id: subscription.id,
    invoiceNumber: buildInvoiceNumber(subscription.id),
    customerId: subscription.account?.id || null,
    customerName: subscription.account?.companyName || "Unknown Customer",
    resellerId: subscription.account?.reseller?.id || null,
    resellerName: subscription.account?.reseller?.companyName || "Direct",
    planName: subscription.plan?.name || "Unknown Plan",
    amount,
    currency: subscription.plan?.currency || "INR",
    commissionRate,
    commissionAmount,
    issuedAt: subscription.startDate,
    endDate: subscription.endDate,
    status: formatInvoiceStatus(subscription.isActive),
  };
}

module.exports = {
  buildInvoiceNumber,
  fetchInvoiceSubscriptions,
  countInvoiceSubscriptions,
  mapSubscriptionToInvoice,
};
