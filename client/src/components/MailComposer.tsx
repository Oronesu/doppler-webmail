import axios from "axios";
import { useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import Modal from "./Modal";

const MailComposer = ({ initialTo = "", initialSubject = "", initialBody = "" }) => {
  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [scanRequested, setScanRequested] = useState(true);
  const [scanResults, setScanResults] = useState<Array<{ file: File; safe: boolean; stats: any; sha256: string; analysisId: string }>>([]);
  const [showPrivacyPopup, setShowPrivacyPopup] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendCompleted, setSendCompleted] = useState(false);

  const scanFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await axios.post("http://localhost:3000/scan", formData, {
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
    setScanResults(results);
    return results;
  };

  const handleSend = async (confirmed: boolean) => {
    const token = localStorage.getItem("access_token");
    if (scanRequested && attachments.length > 0 && !confirmed) return;

    setIsSending(true);
    setSendCompleted(false);

    let allSafe = true;
    let results: any[] = [];

    if (scanRequested && attachments.length > 0) {
      results = await verifyAllAttachments();
      allSafe = results.every((r) => r.safe);
      if (!allSafe) { setIsSending(false); return; }
    }

    let finalBody = body;
    if (scanRequested && allSafe && results.length > 0) {
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

    await axios.post(
      `http://localhost:3000/gmail/send?access_token=${token}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    setTo(""); setSubject(""); setBody(""); setAttachments([]); setScanResults([]);
    setSendCompleted(true);
  };

  return (
    <>
      {/* MODAL CONFIDENTIALITÉ */}
      {showPrivacyPopup && (
        <Modal>
          <button className="modal-close" onClick={() => setShowPrivacyPopup(false)}>×</button>
          <h4>Vérification VirusTotal</h4>
          <p>
            La vérification des pièces jointes utilise l'API VirusTotal.
            Les fichiers envoyés peuvent être conservés par des partenaires antivirus.
            N'utilisez cette option que si les pièces jointes ne contiennent pas de données personnelles.
          </p>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setShowPrivacyPopup(false)}>Annuler</button>
            <button className="btn btn-primary" onClick={() => { setShowPrivacyPopup(false); handleSend(true); }}>
              Confirmer
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL ENVOI */}
      {isSending && (
        <Modal>
          {!sendCompleted ? (
            <h4>{scanRequested ? "Vérification et envoi..." : "Envoi..."}</h4>
          ) : (
            <>
              <button className="modal-close" onClick={() => { setIsSending(false); setSendCompleted(false); }}>×</button>
              <h4>Mail envoyé</h4>
            </>
          )}
        </Modal>
      )}

      {/* FORMULAIRE */}
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
            content_style: "body { font-family:'DM Sans',sans-serif; font-size:14px; color:#f0edf5; background:transparent; }",
            skin: "oxide-dark",
            content_css: "dark",
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
                checked={scanRequested}
                onChange={() => setScanRequested(!scanRequested)}
              />
              Vérifier avec VirusTotal
            </label>
          </div>

          <button
            className="btn-send"
            onClick={() => {
              if (scanRequested && attachments.length > 0) {
                setShowPrivacyPopup(true);
              } else {
                handleSend(false);
              }
            }}
          >
            Envoyer
          </button>
        </div>
      </div>
    </>
  );
};

export default MailComposer;