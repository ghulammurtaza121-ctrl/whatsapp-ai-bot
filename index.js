const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || '12345';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

// Root Route (Server Active check)
app.get('/', (req, res) => {
    res.send('Server is active and running!');
});

// Meta Webhook Verification (GET Request)
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

// WhatsApp Messages Handling & AI Reply (POST Request)
app.post('/webhook', async (req, res) => {
    res.sendStatus(200); // Meta ko foran acknowledge karne ke liye

    try {
        const body = req.body;
        
        if (body.object) {
            if (
                body.entry &&
                body.entry[0].changes &&
                body.entry[0].changes[0].value.messages &&
                body.entry[0].changes[0].value.messages[0]
            ) {
                const message = body.entry[0].changes[0].value.messages[0];
                const from = message.from; // User ka WhatsApp number
                const msgBody = message.text ? message.text.body : ''; // User ka bheja hua message

                console.log(`Received message from ${from}: ${msgBody}`);

                if (msgBody) {
                    // Filhal aik smart automated/AI jaisa response taiyar karte hain
                    const aiReplyText = `Aap ne kaha: "${msgBody}". Main aik AI assistant hoon, aap ka paigham mil gaya hai!`;

                    // WhatsApp Cloud API ke zariye wapas message bhejna
                    await axios({
                        method: 'POST',
                        url: `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`,
                        headers: {
                            'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                            'Content-Type': 'application/json',
                        },
                        data: {
                            messaging_product: 'whatsapp',
                            to: from,
                            text: { body: aiReplyText },
                        },
                    });

                    console.log('Reply sent successfully!');
                }
            }
        }
    } catch (error) {
        console.error('Error handling webhook:', error.response ? error.response.data : error.message);
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
