import axios from "axios";
import { useState } from "react";


const MailComposer = () => {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const handleSend = async () => {
    const token = localStorage.getItem('access_token');
    await axios.post(`http://localhost:3000/gmail/send?access_token=${token}`, {
      to,
      subject,
      body,
    });
    alert('Mail envoyé !');
  };

  return (
    <div className="p-3">
      <h5>✉️ Nouveau message</h5>
      <input className="form-control mb-2" placeholder="À" value={to} onChange={(e) => setTo(e.target.value)} />
      <input className="form-control mb-2" placeholder="Sujet" value={subject} onChange={(e) => setSubject(e.target.value)} />
      <textarea className="form-control mb-2" rows={10} placeholder="Message..." value={body} onChange={(e) => setBody(e.target.value)} />
      <button className="btn btn-primary" onClick={handleSend}>Envoyer</button>
    </div>
  );
};

export default MailComposer;