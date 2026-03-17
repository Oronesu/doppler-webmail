


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
<div className="mailview">

  {/* TOPBAR */}
  <div className="mailview-topbar">
    <div className="left">
      <span className="logo">📩</span>
      <h5>{subject || "Aucun message sélectionné"}</h5>
    </div>

    <div className="actions">
      <button onClick={onReply}>↩</button>
      <button onClick={onForward}>⤳</button>
      <button onClick={onDelete}>🗑</button>
    </div>

  </div>

  {/* CONTENU */}
  <div className="mailview-content">
    <p><strong>De :</strong> {from}</p>
    <p><strong>À :</strong> {to}</p>

    {attachments.length > 0 && (
      <div className="attachments">
        {attachments.map((a, i) => (
          <a key={i} href={a.url} download={a.filename}>{a.filename}</a>
        ))}
      </div>
    )}

    <div
      className="mailview-body"
      dangerouslySetInnerHTML={{ __html: body }}
    />
  </div>

</div>
  );
};


export default MailView;
