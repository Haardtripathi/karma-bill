require('dotenv').config();
const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function checkMessage() {
  try {
    const message = await client.messages('MM4d06643c0cc73b0890c81854ebc0808c').fetch();
    console.log("Message Status:", message.status);
    console.log("Error Code:", message.errorCode);
    console.log("Error Message:", message.errorMessage);
  } catch (error) {
    console.error("Failed to fetch message:", error);
  }
}

checkMessage();
