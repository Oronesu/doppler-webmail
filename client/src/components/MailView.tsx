interface MailViewProps {
  subject: string;
  from: string;
  to: string;
  body: string;
  onReply: () => void;
  onForward: () => void;
}

const MailView = ({ subject, from, to, body, onReply, onForward }: MailViewProps) => {
  return (
    <div className="mailview-container">

      {/* BARRE D’EN-TÊTE */}
      <div className="mailview-header">
        <h4 className="mailview-subject">{subject}</h4>

        <div className="mailview-meta">
          <p><strong>De :</strong> {from}</p>
          <p><strong>À :</strong> {to}</p>
        </div>

        <div className="mailview-actions">
          <button className="btn btn-outline-primary" onClick={onReply}>↩ Répondre</button>
          <button className="btn btn-outline-secondary" onClick={onForward}>⤳ Transférer</button>
        </div>
      </div>

      {/* CONTENU DU MAIL */}
      <div className="mailview-body" dangerouslySetInnerHTML={{ __html: body }} />
    </div>
  );
};

export default MailView;
