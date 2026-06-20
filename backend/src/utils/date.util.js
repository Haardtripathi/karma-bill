const dayjs = require("dayjs");

const formatDate = (date) => dayjs(date || new Date()).format("DD/MM/YYYY");
const formatDateTime = (date) => dayjs(date || new Date()).format("DD/MM/YYYY hh:mm A");
const startOfToday = () => dayjs().startOf("day").toDate();
const endOfToday = () => dayjs().endOf("day").toDate();

module.exports = {
  formatDate,
  formatDateTime,
  startOfToday,
  endOfToday
};
