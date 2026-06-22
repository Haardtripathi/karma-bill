require('dotenv').config();
const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function testWhatsApp() {
  try {
    console.log("Attempting to send a test WhatsApp message...");

    // REPLACE the 'to' number with your personal WhatsApp number in the format 'whatsapp:+919XXXXXXXXX'
    const message = await client.messages.create({
      from: 'whatsapp:+14155238886',
      to: 'whatsapp:+919978617307', // <--- UPDATE THIS LINE
      body: 'Test invoice from Karma Automobiles billing app',
    });

    console.log("Success! Message SID:", message.sid);
  } catch (error) {
    console.error("Failed to send message:", error);
  }
}

testWhatsApp();
