require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = process.env;

app.get('/auth/google', (req, res) => {
  const scope = encodeURIComponent('https://www.googleapis.com/auth/gmail.readonly');
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${scope}&access_type=offline`;
  res.redirect(url);
});

app.post('/auth/token', async (req, res) => {
  const { code } = req.body;
  console.log('[Backend] Code reçu:', code);

  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code'
    });
    console.log('[Backend] Token échangé avec succès:', response.data);
    res.json(response.data);
  } catch (err) {
    console.error('[Backend] Erreur lors de l’échange du token:', err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/gmail/messages', async (req, res) => {
  const { access_token } = req.query;
  try {
    const listResponse = await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/messages', {
      headers: { Authorization: `Bearer ${access_token}` },
      params: { maxResults: 20 } // Limite pour éviter trop d'appels
    });

    const messages = listResponse.data.messages || [];

    const detailedMessages = await Promise.all(messages.map(async (msg) => {
      const detailRes = await axios.get(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
        headers: { Authorization: `Bearer ${access_token}` }
      });

      const headers = detailRes.data.payload.headers;
      const subjectHeader = headers.find(h => h.name === 'Subject');
      const subject = subjectHeader ? subjectHeader.value : '(Sans sujet)';

      return { id: msg.id, subject };
    }));

    res.json(detailedMessages);
  } catch (err) {
    console.error('[Backend] Erreur Gmail API:', err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});



app.listen(3000, () => console.log('✅ Backend running on http://localhost:3000'));
