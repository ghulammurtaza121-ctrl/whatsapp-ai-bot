const express = require('express');
const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'my_secret_token_123';

// Root Route (Server Active check کرنے کے لیے)
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

// WhatsApp Messages Handling (POST Request)
// WhatsApp Messages Handling (POST Request)
app.post('/webhook', (req, res) => {
    console.log('Incoming webhook payload:', JSON.stringify(req.body, null, 2));
    res.sendStatus(200);
});

  res.sendStatus(200);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
