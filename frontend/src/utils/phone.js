export const normalizePhone = (phone) => String(phone || "").replace(/[^0-9+]/g, "");
