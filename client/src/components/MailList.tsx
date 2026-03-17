import { useEffect, useState } from 'react';
import axios from 'axios';

interface MailListProps {
  setSelectedMail: (mail: FullMail) => void;
  setIsComposing: (value: boolean) => void;
  label?: string;
}


interface FullMail {
  id: string;
  subject: string;
  from: string;
  to: string;
  body: string;
  attachments: { filename: string; url: string }[];
}





const MailList = ({ setSelectedMail, setIsComposing, label }: MailListProps) => {

  const [messages, setMessages] = useState([]);

  const formatDate = (rawDate: string) => {
  const date = new Date(rawDate);
  if (isNaN(date.getTime())) return "Date invalide";

  const now = new Date();

  const isSameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const isSameYear = date.getFullYear() === now.getFullYear();

  if (isSameDay) {
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  if (isSameYear) {
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short"
    });
  }

  return date.toLocaleDateString("fr-FR");
};

useEffect(() => {
  const token = localStorage.getItem('access_token');

  if (token) {
    axios
      .get(`http://localhost:3000/gmail/messages?access_token=${token}${label ? `&labelIds=${label}` : ''}`)
      .then((res) => {
        let msgs = res.data;

        // Inbox = uniquement les mails avec label INBOX
        if (!label) {
          msgs = msgs.filter((m: any) => m.labelIds?.includes("INBOX"));
        }

        setMessages(msgs);
      })
      .catch((err) => console.error(err));
  }
}, [label]);


  const handleClick = async (id: string) => {
    setIsComposing(false);
    const token = localStorage.getItem('access_token');

    const res = await axios.get(
      `http://localhost:3000/gmail/message?access_token=${token}&id=${id}`
    );

  setSelectedMail({
    id: res.data.id,
    subject: res.data.subject,
    from: res.data.from,
    to: res.data.to,
    body: res.data.body,
    attachments: res.data.attachments || []
  });


  };

  return (
    <div className="container mt-4">
      <h5 className="mb-3">
        {label === 'SPAM' && '🚫 Spam'}
        {label === 'TRASH' && '🗑️ Corbeille'}
        {!label && '📥 Inbox'}
      </h5>

      {messages.length > 0 ? (
        <div className="list-group">
          {messages.map((msg: any) => (
            <div
              key={msg.id}
              className="list-group-item list-group-item-action"
              onClick={() => handleClick(msg.id)}
            >
              <div className="d-flex justify-content-between">
                <h6 className="mb-1">{msg.subject || '(Sans sujet)'}</h6>
                <small className="text-muted">{formatDate(msg.date)}</small>
              </div>
              <p className="mb-0 text-secondary">
                <strong>De :</strong> {msg.from}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-secondary">Aucun message à afficher</div>
      )}
    </div>
  );
};

export default MailList;
