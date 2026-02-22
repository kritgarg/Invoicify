export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const getCurrencySymbol = (currency = 'USD') => {
  const parts = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).formatToParts(0);
  return parts.find((part) => part.type === 'currency')?.value || '$';
};
