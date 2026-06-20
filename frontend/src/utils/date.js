const isValidDate = (date) => date instanceof Date && !Number.isNaN(date.getTime());
const pad = (value) => String(value).padStart(2, "0");

export const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (!isValidDate(date)) return "";
  return date.toLocaleDateString("en-GB");
};

export const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (!isValidDate(date)) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(date).replace(/\b(am|pm)\b/i, (match) => match.toUpperCase());
};

export const toInputDate = (value = new Date()) => {
  const date = new Date(value);
  if (!isValidDate(date)) return "";
  return [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join("-");
};

export const toOptionalInputDate = (value) => value ? toInputDate(value) : "";

export const toInputTimeParts = (value = new Date()) => {
  const date = new Date(value);
  const safeDate = isValidDate(date) ? date : new Date();
  const hours = safeDate.getHours();
  return {
    hour: String(hours % 12 || 12),
    minute: pad(safeDate.getMinutes()),
    period: hours >= 12 ? "PM" : "AM"
  };
};

export const combineDateAndTime = (dateValue, timeParts = {}) => {
  if (!dateValue) return null;
  const [year, month, day] = dateValue.split("-").map(Number);
  if (!year || !month || !day) return null;
  const hour12 = Math.min(Math.max(Number(timeParts.hour || 12), 1), 12);
  const minute = Math.min(Math.max(Number(timeParts.minute || 0), 0), 59);
  const period = timeParts.period === "AM" ? "AM" : "PM";
  const hour = (hour12 % 12) + (period === "PM" ? 12 : 0);
  return new Date(year, month - 1, day, hour, minute).toISOString();
};

export const dateOnlyToPayload = (dateValue) => {
  if (!dateValue) return null;
  const [year, month, day] = dateValue.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 12, 0, 0, 0).toISOString();
};
