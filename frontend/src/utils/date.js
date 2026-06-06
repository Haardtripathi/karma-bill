export const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleDateString("en-GB");
};

export const toInputDate = (value = new Date()) => {
  const date = new Date(value);
  return date.toISOString().slice(0, 10);
};
