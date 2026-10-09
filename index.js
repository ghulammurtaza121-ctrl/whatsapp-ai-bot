app.post('/webhook', async (req, res) => {
    res.sendStatus(200);

    // Yeh line har aane wali request ko logs mein dikhayegi
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

                // Generate smart reply using Gemini AI
                const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            
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
        console.error('Error handling webhook:', error.response ? error.response.data : error.message);
    }
});
