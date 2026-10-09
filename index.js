const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Webhook verification (GET)
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
    } else {
        res.sendStatus(400);
    }
});

// Webhook message receiver (POST)
app.post('/webhook', async (req, res) => {
    res.sendStatus(200);

    console.log('Webhook POST received:', JSON.stringify(req.body, null, 2));

    try {
        const body = req.body;

        if (body.object === 'whatsapp_business_account') {
            const entry = body.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;
            const message = value?.messages?.[0];

            if (message && message.type === 'text') {
                const senderPhone = message.from;
                const userMessage = message.text.body;
                console.log(`Received message from ${senderPhone}: ${userMessage}`);

                // Direct Gemini API call via Axios (Bypassing SDK errors)
                const geminiResponse = await axios.post(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
                    {
                        contents: [
                            {
                                parts: [{ text: userMessage }]
                            }
                        ]
                    },
                    {
                        headers: { 'Content-Type': 'application/json' }
                    }
                );

                const aiReply = 
                    geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || 
                    "Main abhi iska jawab nahi de sakta.";

                // Send reply back to WhatsApp
                await axios.post(
                    `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`,
                    {
                        messaging_product: 'whatsapp',
                        to: senderPhone,
                        text: { body: aiReply },
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${WHATSAPP_TOKEN}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                console.log('AI Reply sent successfully!');
            }
        }
    } catch (error) {
        console.error('Error handling webhook:', error.response ? error.response.data : error);
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server is active and running on port ${PORT}`);
});
