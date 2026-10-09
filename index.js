const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(bodyParser.json());

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

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

                // Generate smart reply using Gemini AI (Using gemini-2.0-flash)
                const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
                const result = await model.generateContent(userMessage);
                const aiReply = result.response.text() || "Main abhi iska jawab nahi de sakta.";

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
