const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

const twoDigits = (num) => {
  if (num < 20) return ones[num];
  return `${tens[Math.floor(num / 10)]} ${ones[num % 10]}`.trim();
};

const threeDigits = (num) => {
  const hundred = Math.floor(num / 100);
  const rest = num % 100;
  return `${hundred ? `${ones[hundred]} Hundred` : ""} ${rest ? twoDigits(rest) : ""}`.trim();
};

const amountToWords = (amount) => {
  let rupees = Math.floor(Number(amount || 0));
  const paise = Math.round((Number(amount || 0) - rupees) * 100);

  if (rupees === 0 && paise === 0) return "Zero Rupees Only";

  const parts = [];
  const crore = Math.floor(rupees / 10000000);
  rupees %= 10000000;
  const lakh = Math.floor(rupees / 100000);
  rupees %= 100000;
  const thousand = Math.floor(rupees / 1000);
  rupees %= 1000;

  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);
  if (rupees) parts.push(threeDigits(rupees));

  const rupeeWords = `${parts.join(" ")} Rupees`.trim();
  const paiseWords = paise ? ` and ${twoDigits(paise)} Paise` : "";
  return `${rupeeWords}${paiseWords} Only`;
};

module.exports = amountToWords;
