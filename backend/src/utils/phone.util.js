const normalizeWhatsAppPhone = (phone) => {
  if (!phone) {
    return "";
  }

  let value = String(phone).trim();
  if (value.startsWith("whatsapp:")) {
    value = value.replace("whatsapp:", "");
  }
  value = value.replace(/[\s()-]/g, "");

  if (value.startsWith("+")) {
    return `whatsapp:${value}`;
  }

  const digits = value.replace(/\D/g, "");
  const countryCode = process.env.DEFAULT_COUNTRY_CODE || "91";

  if (digits.length === 10) {
    return `whatsapp:+${countryCode}${digits}`;
  }

  if (digits.startsWith(countryCode) && digits.length === 12) {
    return `whatsapp:+${digits}`;
  }

  if (digits.length > 10) {
    return `whatsapp:+${digits}`;
  }

  return "";
};

const isValidIndianPhone = (phone) => {
  const normalized = normalizeWhatsAppPhone(phone);
  return /^whatsapp:\+91[6-9]\d{9}$/.test(normalized);
};

module.exports = {
  normalizeWhatsAppPhone,
  isValidIndianPhone
};
