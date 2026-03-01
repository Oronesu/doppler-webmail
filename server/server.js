require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(cors());
app.use(express.json());

const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = process.env;

app.get('/auth/google', (req, res) => {
  const scope = encodeURIComponent([
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify'
].join(' '));
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

// Route pour récupérer le corps d'un email spécifique
app.get('/gmail/messages', async (req, res) => {
  const { access_token, labelIds } = req.query;

  try {
    const listResponse = await axios.get(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages',
      {
        headers: { Authorization: `Bearer ${access_token}` },
        params: {
          maxResults: 20,
          ...(labelIds ? { labelIds } : {})
        }
      }
    );

    const messages = listResponse.data.messages || [];

    const detailedMessages = await Promise.all(
      messages.map(async (msg) => {
        const detailRes = await axios.get(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
          {
            headers: { Authorization: `Bearer ${access_token}` }
          }
        );

        const headers = detailRes.data.payload.headers;

        const subject = headers.find(h => h.name === 'Subject')?.value || '(Sans sujet)';
        const from = headers.find(h => h.name === 'From')?.value || 'Expéditeur inconnu';
        const to = headers.find(h => h.name === 'To')?.value || '';
        const date = headers.find(h => h.name === 'Date')?.value || '';

        return {
          id: msg.id,
          subject,
          from,
          to,
          date
        };
      })
    );

    res.json(detailedMessages);
  } catch (err) {
    console.error('[Backend] Erreur Gmail API:', err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});


app.get('/gmail/message', async (req, res) => {
  const { access_token, id } = req.query;

  if (!access_token || !id) {
    return res.status(400).json({ error: 'access_token et id requis' });
  }

  try {
    const detailRes = await axios.get(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}`,
      {
        headers: { Authorization: `Bearer ${access_token}` }
      }
    );

    const payload = detailRes.data.payload;

    // Extraction directe sans fonction findBody
    let body = '';

    if (payload.body?.data) {
      body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    } else if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/html' && part.body?.data) {
          body = Buffer.from(part.body.data, 'base64').toString('utf-8');
          break;
        }
        if (part.mimeType === 'text/plain' && part.body?.data && !body) {
          body = Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
      }
    }

    res.json({ body });
  } catch (err) {
    console.error('[Backend] Erreur récupération corps mail:', err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});


// Route pour envoyer un email

app.post('/gmail/send', upload.array('attachments'), async (req, res) => {
  try {
    const { access_token } = req.query;
    const { to, subject, body } = req.body;
    const files = req.files || [];

    console.log("📨 Champs reçus :", req.body);
    console.log("📎 Fichiers reçus :", files.map(f => f.originalname));

    if (!to || !subject || !body) {
      return res.status(400).json({ error: "Champs manquants" });
    }

    // Construction du message MIME
    let boundary = "my_boundary_" + Date.now();

    let mimeParts = [];

    // Partie HTML
    mimeParts.push(
      `--${boundary}\r\n` +
      `Content-Type: text/html; charset="UTF-8"\r\n\r\n` +
      `${body}\r\n`
    );

    // Pièces jointes
    for (const file of files) {
      const base64File = file.buffer.toString("base64");

      mimeParts.push(
        `--${boundary}\r\n` +
        `Content-Type: ${file.mimetype}; name="${file.originalname}"\r\n` +
        `Content-Disposition: attachment; filename="${file.originalname}"\r\n` +
        `Content-Transfer-Encoding: base64\r\n\r\n` +
        `${base64File}\r\n`
      );
    }

    mimeParts.push(`--${boundary}--`);

    const rawMessage =
      `To: ${to}\r\n` +
      `Subject: ${subject}\r\n` +
      `MIME-Version: 1.0\r\n` +
      `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n` +
      mimeParts.join("");

    const encodedMessage = Buffer.from(rawMessage)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // Envoi via Gmail API
    await axios.post(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      { raw: encodedMessage },
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    res.json({ success: true });

  } catch (err) {
    console.error("[Backend] Erreur envoi mail:", err.response?.data || err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});




const crypto = require("crypto");

app.post('/scan', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "Aucun fichier reçu" });

    // SHA‑256 du fichier
    const sha256 = crypto.createHash("sha256").update(file.buffer).digest("hex");

    // Upload VirusTotal
    const formData = new FormData();
    formData.append("file", new Blob([file.buffer]), file.originalname);

    const uploadRes = await fetch("https://www.virustotal.com/api/v3/files", {
      method: "POST",
      headers: { "x-apikey": process.env.VIRUSTOTAL_API_KEY },
      body: formData
    });

    const uploadData = await uploadRes.json();
    const analysisId = uploadData.data.id;

    // Polling en attendant la fin de l'analyse
    let analysis;
    while (true) {
      const analysisRes = await fetch(
        `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
        { headers: { "x-apikey": process.env.VIRUSTOTAL_API_KEY } }
      );

      const analysisData = await analysisRes.json();
      if (analysisData.data.attributes.status === "completed") {
        analysis = analysisData.data.attributes.stats;
        break;
      }
      await new Promise(r => setTimeout(r, 1500));
    }

    const safe = analysis.malicious === 0 && analysis.suspicious === 0;

    res.json({
      safe,
      stats: analysis,
      sha256,
      analysisId
    });

  } catch (err) {
    console.error("Erreur VirusTotal:", err);
    res.status(500).json({ error: "Erreur analyse VirusTotal" });
  }
});




app.listen(3000, () => console.log('✅ Backend running on http://localhost:3000'));
