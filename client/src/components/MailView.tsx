


interface MailViewProps {
  subject: string;
  from: string;
  to: string;
  body: string;
  attachments: { filename: string; url: string }[];
  onReply: () => void;
  onForward: () => void;
  onDelete: () => void;
}



const MailView = ({ subject, from, to, body, attachments, onReply, onForward, onDelete }: MailViewProps) => {
  return (
    <div className="mailview-container">

      <div className="mailview-header">
        <h4 className="mailview-subject">{subject}</h4>

        <div className="mailview-meta">
          <p><strong>De :</strong> {from}</p>
          <p><strong>À :</strong> {to}</p>
        </div>

        <div className="mailview-actions">
          <button className="btn btn-outline-primary" onClick={onReply}>↩ Répondre</button>
          <button className="btn btn-outline-secondary" onClick={onForward}>⤳ Transférer</button>
          <button className="btn btn-outline-danger" onClick={onDelete}>🗑 Supprimer</button>
        </div>

      </div>
      {attachments && attachments.length > 0 && (
        <div className="mailview-attachments">
          <h6>📎 Pièces jointes</h6>
          <ul>
            {attachments.map((att, index) => (
              <li key={index}>
                <a href={att.url} download={att.filename}>
                  {att.filename}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}


      <div className="mailview-body" dangerouslySetInnerHTML={{ __html: body }} />
    </div>
  );
};


export default MailView;
