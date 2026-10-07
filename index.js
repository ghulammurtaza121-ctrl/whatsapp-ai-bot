const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Meta Webhook Verification Token & Constants
const VERIFY_TOKEN = "my_secret_token_123";
const PHONE_NUMBER_ID = "145537020394512";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN; // Render Environment Variables se aayega

// Webhook Verification (Meta Verification for setup)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// Incoming Messages Handler
app.post('/webhook', async (req, res) => {
  const body = req.body;

  if (body.object) {
    if (
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0].value.messages &&
      body.entry[0].changes[0].value.messages[0]
    ) {
      const from = body.entry[0].changes[0].value.messages[0].from;
      const msgText = body.entry[0].changes[0].value.messages[0].text ? body.entry[0].changes[0].value.messages[0].text.body : '';

      if (msgText) {
        try {
          // Pollinations AI Call
          const aiResponse = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(msgText)}`);
          const reply = aiResponse.data || "Sorry, I couldn't process that.";

          // Send Reply Back to WhatsApp
          await axios.post(
            `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
            {
              messaging_product: "whatsapp",
              to: from,
              text: { body: reply }
            },
            {
              headers: {
                Authorization: `Bearer ${WHATSAPP_TOKEN}`,
                "Content-Type": "application/json"
              }
            }
          );
        } catch (error) {
          console.error("Error processing message:", error.message);
        }
      }
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// Root route for Health Check
app.get('/', (req, res) => {
  res.send('WhatsApp AI Bot is running smoothly!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
