import axios from "axios";
import { useState } from "react";
import { Editor } from "@tinymce/tinymce-react";

const MailComposer = () => {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const handleSend = async () => {
    const token = localStorage.getItem('access_token');

    // Réinitialisation des champs 
    setTo(''); 
    setSubject(''); 
    setBody('');

    await axios.post(
      `http://localhost:3000/gmail/send?access_token=${token}`,
      { to, subject, body }
    );

    alert('Mail envoyé !');
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

      <button className="btn btn-primary mt-3" onClick={handleSend}>
        Envoyer
      </button>
    </div>
  );
};

export default MailComposer;
