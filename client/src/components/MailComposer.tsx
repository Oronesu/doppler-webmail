import api from "./apiClient";
import { useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import Modal from "./Modal";

type SendStatus = 'idle' | 'sending' | 'success' | 'error';

const MailComposer = ({ initialTo = "", initialSubject = "", initialBody = "" }) => {
  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [attachments, setAttachments] = useState<File[]>([]);

  // VirusTotal OFF par défaut
  const [scanEnabled, setScanEnabled] = useState(false);

  // Modal affiché quand on coche VirusTotal (avertissement confidentialité)
  const [showVtWarning, setShowVtWarning] = useState(false);

  // Modal confidentialité avant envoi avec scan (quand on clique Envoyer)
  const [showPrivacyPopup, setShowPrivacyPopup] = useState(false);

  // État d'envoi : idle | sending | success | error
  const [sendStatus, setSendStatus] = useState<SendStatus>('idle');
  const [sendError, setSendError] = useState('');

  // — Scan VirusTotal —
  const scanFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post("/scan", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  };

  const verifyAllAttachments = async () => {
    const results = [];
    for (const file of attachments) {
      const result = await scanFile(file);
      results.push({ file, safe: result.safe, stats: result.stats, sha256: result.sha256, analysisId: result.analysisId });
    }
    return results;
  };

  // — Envoi —
  const handleSend = async () => {
    // Validation basique côté client
    if (!to.trim()) {
      setSendError("Veuillez renseigner un destinataire.");
      setSendStatus('error');
      return;
    }

    setSendStatus('sending');
    setSendError('');

    try {
      const token = localStorage.getItem("access_token");
      let finalBody = body;
      let results: any[] = [];

      if (scanEnabled && attachments.length > 0) {
        results = await verifyAllAttachments();
        const allSafe = results.every((r) => r.safe);
        if (!allSafe) {
          setSendError("Un ou plusieurs fichiers ont été détectés comme malveillants. Envoi annulé.");
          setSendStatus('error');
          return;
        }
        finalBody += `
          <h3>Pièces jointes vérifiées avec VirusTotal</h3>
          ${results.map((r) => `
            <p>
              Rapport : <a href="https://www.virustotal.com/gui/file-analysis/${r.analysisId}" target="_blank">Voir l'analyse</a><br/>
              SHA‑256 : <code>${r.sha256}</code>
            </p>
          `).join("")}
        `;
      }

      const formData = new FormData();
      formData.append("to", to);
      formData.append("subject", subject);
      formData.append("body", finalBody);
      attachments.forEach((file) => formData.append("attachments", file));

      await api.post(
        '/gmail/send',
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setTo(""); setSubject(""); setBody(""); setAttachments([]);
      setSendStatus('success');

    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Erreur lors de l'envoi.";
      setSendError(msg);
      setSendStatus('error');
    }
  };

  const closeSendModal = () => {
    setSendStatus('idle');
    setSendError('');
  };

  // Quand on coche la case VirusTotal
  const handleVtToggle = () => {
    if (!scanEnabled) {
      // On active → on montre l'avertissement d'abord
      setShowVtWarning(true);
    } else {
      // On désactive directement
      setScanEnabled(false);
    }
  };

  // Quand on clique Envoyer
  const handleSendClick = () => {
    if (scanEnabled && attachments.length > 0) {
      // Confirmation confidentialité avant d'envoyer vers VirusTotal
      setShowPrivacyPopup(true);
    } else {
      handleSend();
    }
  };

  return (
    <>
      {/* — MODAL AVERTISSEMENT ACTIVATION VT — */}
      {showVtWarning && (
        <Modal>
          <button className="modal-close" onClick={() => setShowVtWarning(false)}>×</button>
          <h4>Vérification VirusTotal</h4>
          <p>
            La vérification utilise l'API VirusTotal, un service tiers.
            Les fichiers analysés peuvent être accessibles aux partenaires antivirus de VirusTotal.
          </p>
          <p style={{ marginTop: 10 }}>
            <strong>N'activez cette option que si vos pièces jointes ne contiennent pas de données sensibles ou personnelles.</strong>
          </p>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setShowVtWarning(false)}>
              Annuler
            </button>
            <button className="btn btn-primary" onClick={() => { setScanEnabled(true); setShowVtWarning(false); }}>
              Activer quand même
            </button>
          </div>
        </Modal>
      )}

      {/* — MODAL CONFIRMATION CONFIDENTIALITÉ AVANT ENVOI — */}
      {showPrivacyPopup && (
        <Modal>
          <button className="modal-close" onClick={() => setShowPrivacyPopup(false)}>×</button>
          <h4>Confirmer l'envoi avec scan</h4>
          <p>
            Vos pièces jointes vont être transmises à VirusTotal pour analyse avant envoi.
            Confirmez que ces fichiers ne contiennent pas d'informations sensibles.
          </p>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setShowPrivacyPopup(false)}>
              Annuler
            </button>
            <button className="btn btn-primary" onClick={() => { setShowPrivacyPopup(false); handleSend(); }}>
              Confirmer et envoyer
            </button>
          </div>
        </Modal>
      )}

      {/* — MODAL ENVOI EN COURS / SUCCÈS / ERREUR — */}
      {sendStatus !== 'idle' && (
        <Modal>
          {sendStatus === 'sending' && (
            <h4>{scanEnabled && attachments.length > 0 ? "Vérification et envoi..." : "Envoi en cours..."}</h4>
          )}
          {sendStatus === 'success' && (
            <>
              <button className="modal-close" onClick={closeSendModal}>×</button>
              <h4>Mail envoyé</h4>
            </>
          )}
          {sendStatus === 'error' && (
            <>
              <button className="modal-close" onClick={closeSendModal}>×</button>
              <h4>Échec de l'envoi</h4>
              <p style={{ marginTop: 8 }}>{sendError}</p>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={closeSendModal}>Fermer</button>
              </div>
            </>
          )}
        </Modal>
      )}

      {/* — FORMULAIRE — */}
      <div className="composer-topbar">
        <div className="left">
          <h5>Nouveau message</h5>
        </div>
      </div>

      <div className="composer-container">
        <input
          className="composer-input"
          placeholder="À"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        <input
          className="composer-input"
          placeholder="Sujet"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />

        <Editor
          apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
          value={body}
          onEditorChange={(content) => setBody(content)}
          init={{
            height: 300,
            menubar: false,
            plugins: "link lists code table autolink preview",
            toolbar: "undo redo | bold italic underline | bullist numlist | link | code | preview",
            // Skin dark natif TinyMCE — texte blanc lisible
            skin: "oxide-dark",
            content_css: "dark",
            // Style injecté dans l'iframe TinyMCE pour que le texte soit lisible
            content_style: `
              body {
                font-family: Arial, Helvetica, sans-serif;
                font-size: 14px;
                color: #e8e4f0;
                background: #1e1c26;
                margin: 12px 16px;
                line-height: 1.6;
              }
            `,
          }}
        />

        <div className="composer-footer">
          <div className="left">
            <input
              type="file"
              multiple
              onChange={(e) => {
                const files = (e.target as HTMLInputElement).files;
                if (files) setAttachments(Array.from(files));
              }}
            />
            <label className="vt-check">
              <input
                type="checkbox"
                checked={scanEnabled}
                onChange={handleVtToggle}
              />
              Vérifier avec VirusTotal
            </label>
          </div>

          <button className="btn-send" onClick={handleSendClick}>
            Envoyer
          </button>
        </div>
      </div>
    </>
  );
};

export default MailComposer;