const twilio = require("twilio");

const isTwilioConfigured = () =>
  Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);

const getTwilioClient = () => {
  if (!isTwilioConfigured()) {
    return null;
  }

  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
};

module.exports = {
  getTwilioClient,
  isTwilioConfigured
};
