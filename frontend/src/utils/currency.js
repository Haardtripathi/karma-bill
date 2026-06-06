export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2
  }).format(Number(value || 0));

export const roundMoney = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
