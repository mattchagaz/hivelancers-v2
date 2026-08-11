const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing']);

export const CLIENT_FEE_PERCENT_BY_PLAN = {
  essential: 3,
  professional: 1.5,
  business: 0,
};

export const getActiveSubscriptionPlanId = (subscription) => (
  subscription && ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)
    ? subscription.planId
    : 'essential'
);

export const getClientFeePercent = (subscription) => (
  CLIENT_FEE_PERCENT_BY_PLAN[getActiveSubscriptionPlanId(subscription)]
  ?? CLIENT_FEE_PERCENT_BY_PLAN.essential
);

export const calculatePercentageCents = (amountCents, percent) =>
  Math.max(0, Math.round((Number(amountCents) || 0) * ((Number(percent) || 0) / 100)));

export const getClientCheckoutFees = (amountCents, subscription) => {
  const clientFeePercent = getClientFeePercent(subscription);
  const clientFeeCents = calculatePercentageCents(amountCents, clientFeePercent);
  return {
    clientFeePercent,
    clientFeeCents,
    totalCents: Math.max(0, Number(amountCents) || 0) + clientFeeCents,
  };
};
