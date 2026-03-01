import axios from "axios";
import { useState } from "react";
import { Editor } from "@tinymce/tinymce-react";

const MailComposer = () => {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [scanRequested, setScanRequested] = useState(true);
  const [scanResults, setScanResults] = useState<Array<{ file: File | Blob; safe: boolean; stats: any }>>([]);

  // ---------------------------
  // 1. Analyse VirusTotal
  // ---------------------------
  const scanFile = async (file: string | Blob) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await axios.post("http://localhost:3000/scan", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });

    return res.data; // { safe: true/false, stats: {...} }
  };

  const verifyAllAttachments = async () => {
    const results = [];

    for (const file of attachments) {
      const result = await scanFile(file);
      results.push({ file, ...result });
    }

    setScanResults(results);
    return results;
  };

  // ---------------------------
  // 2. Envoi du mail
  // ---------------------------
  const handleSend = async () => {
    const token = localStorage.getItem('access_token');

    let allSafe = true;

    if (scanRequested && attachments.length > 0) {
      const results = await verifyAllAttachments();
      allSafe = results.every(r => r.safe);

      if (!allSafe) {
        alert("Une ou plusieurs pièces jointes sont infectées. Envoi bloqué.");
        return;
      }
    }

    let finalBody = body;

    if (scanRequested && allSafe && attachments.length > 0) {
      finalBody += "<p><em>Pièces jointes vérifiées par VirusTotal.</em></p>";
    }

    const formData = new FormData();
    formData.append("to", to);
    formData.append("subject", subject);
    formData.append("body", finalBody);

    attachments.forEach((file) => {
      formData.append("attachments", file);
    });

    await axios.post(
      `http://localhost:3000/gmail/send?access_token=${token}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    setTo('');
    setSubject('');
    setBody('');
    setAttachments([]);
    setScanResults([]);

    alert("Mail envoyé !");
  };

  return (
    <div className="p-3">
      <h5>✉️ Nouveau message</h5>

      <input
        className="form-control mb-2"
        placeholder="À"
        value={to}
        onChange={(e) => setTo(e.target.value)}
      />

      <input
        className="form-control mb-2"
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
          toolbar:
            "undo redo | bold italic underline | bullist numlist | link | code | preview",
          content_style: "body { font-family:Arial; font-size:14px }",
        }}
      />

      <input
        type="file"
        multiple
        onChange={(e) => {
          const files = (e.target as HTMLInputElement).files;
          if (files) {
            setAttachments(Array.from(files));
          }
        }} //e.target.files est de type FileList, on le convertit en Array 
      />

      <label className="mt-2">
        <input
          type="checkbox"
          checked={scanRequested}
          onChange={() => setScanRequested(!scanRequested)}
        />
        Vérifier les pièces jointes avec VirusTotal
      </label>
      <p className="text-muted">
        (Les fichiers seront envoyés à un service externe de sécurité.)
      </p>

      <button className="btn btn-primary mt-3" onClick={handleSend}>
        Envoyer
      </button>
    </div>
  );
};

export default MailComposer;
