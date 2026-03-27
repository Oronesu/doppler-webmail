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


// Rafraîchir l'access token via le refresh token
app.post('/auth/refresh', async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(400).json({ error: 'refresh_token manquant' });

  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token,
      grant_type: 'refresh_token'
    });
    // Google ne renvoie pas de nouveau refresh_token ici, on garde l'ancien
    res.json({
      access_token: response.data.access_token,
      expires_in: response.data.expires_in
    });
  } catch (err) {
    console.error('[Backend] Erreur refresh token:', err.response?.data || err.message);
    res.status(401).json({ error: 'Refresh token invalide ou expiré' });
  }
});

// Route pour récupérer le corps d'un email spécifique
app.get('/gmail/messages', async (req, res) => {
  const { access_token, labelIds, pageToken, q } = req.query;

  try {
    // Étape 1 : liste des IDs (légère, pas de corps)
    const listResponse = await axios.get(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages',
      {
        headers: { Authorization: `Bearer ${access_token}` },
        params: {
          maxResults: 25,
          ...(labelIds ? { labelIds } : {}),
          ...(pageToken ? { pageToken } : {}),
          ...(q ? { q } : {})
        }
      }
    );

    const messages = listResponse.data.messages || [];
    const nextPageToken = listResponse.data.nextPageToken || null;

    // Étape 2 : headers uniquement via format=metadata — beaucoup plus léger que full
    // On traite par batch de 10 pour ne pas saturer le rate limit
    const BATCH = 10;
    const detailedMessages = [];

    for (let i = 0; i < messages.length; i += BATCH) {
      const chunk = messages.slice(i, i + BATCH);
      const chunkResults = await Promise.all(
        chunk.map(async (msg) => {
          const detailRes = await axios.get(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
            {
              headers: { Authorization: `Bearer ${access_token}` },
              params: {
                format: 'metadata',
                metadataHeaders: ['Subject', 'From', 'To', 'Date']
              }
            }
          );

          const headers = detailRes.data.payload.headers;
          const subject = headers.find(h => h.name === 'Subject')?.value || '(Sans sujet)';
          const from    = headers.find(h => h.name === 'From')?.value    || 'Expéditeur inconnu';
          const to      = headers.find(h => h.name === 'To')?.value      || '';
          const date    = headers.find(h => h.name === 'Date')?.value    || '';
          const snippet = detailRes.data.snippet || '';
          const labelIdsMsg = detailRes.data.labelIds || [];

          return { id: msg.id, subject, from, to, date, snippet, labelIds: labelIdsMsg };
        })
      );
      detailedMessages.push(...chunkResults);
    }

    res.json({ messages: detailedMessages, nextPageToken });
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
    const headers = payload.headers || [];

    const subject = headers.find(h => h.name === 'Subject')?.value || '(Sans sujet)';
    const from = headers.find(h => h.name === 'From')?.value || 'Expéditeur inconnu';
    const to = headers.find(h => h.name === 'To')?.value || '';

    // Corps
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

    // Pièces jointes
    let attachments = [];

    function extractAttachments(parts) {
      if (!parts) return;
      for (const part of parts) {
        if (part.filename && part.body && part.body.attachmentId) {
          attachments.push({
            filename: part.filename,
            mimeType: part.mimeType,
            url: `http://localhost:3000/gmail/attachment?access_token=${access_token}&messageId=${id}&attachmentId=${part.body.attachmentId}&filename=${encodeURIComponent(part.filename)}&mimeType=${encodeURIComponent(part.mimeType)}`
          });
        }
        if (part.parts) extractAttachments(part.parts);
      }
    }

    extractAttachments(payload.parts);

    res.json({
      id,
      subject,
      from,
      to,
      body,
      attachments
    });

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


app.post('/gmail/moveToTrash', async (req, res) => {
  const { access_token, id } = req.query;

  try {
    await axios.post(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/trash`,
      {},
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Erreur suppression:", err.response?.data || err);
    res.status(500).json({ error: "Erreur suppression" });
  }
});


// Marquer un mail comme lu (retire le label UNREAD)
app.post('/gmail/markAsRead', async (req, res) => {
  const { access_token, id } = req.query;
  try {
    await axios.post(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`,
      { removeLabelIds: ['UNREAD'] },
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Erreur markAsRead:", err.response?.data || err);
    res.status(500).json({ error: "Erreur markAsRead" });
  }
});




// Archiver un mail (retire INBOX sans mettre à la corbeille)
app.post('/gmail/archive', async (req, res) => {
  const { access_token, id } = req.query;
  try {
    await axios.post(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`,
      { removeLabelIds: ['INBOX'] },
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur archive:', err.response?.data || err);
    res.status(500).json({ error: 'Erreur archive' });
  }
});

// Marquer un mail comme non lu (remet le label UNREAD)
app.post('/gmail/markAsUnread', async (req, res) => {
  const { access_token, id } = req.query;
  try {
    await axios.post(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`,
      { addLabelIds: ['UNREAD'] },
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur markAsUnread:', err.response?.data || err);
    res.status(500).json({ error: 'Erreur markAsUnread' });
  }
});

// Proxy téléchargement pièce jointe — décode le base64 et sert le vrai fichier
app.get('/gmail/attachment', async (req, res) => {
  const { access_token, messageId, attachmentId, filename, mimeType } = req.query;
  try {
    const r = await axios.get(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    // Gmail encode en base64url (- et _ au lieu de + et /)
    const base64 = r.data.data.replace(/-/g, '+').replace(/_/g, '/');
    const buffer = Buffer.from(base64, 'base64');
    res.setHeader('Content-Type', mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    console.error('Erreur téléchargement pièce jointe:', err.response?.data || err);
    res.status(500).json({ error: 'Erreur téléchargement' });
  }
});

app.listen(3000, () => console.log('✅ Backend running on http://localhost:3000'));