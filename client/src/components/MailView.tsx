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

const mailHtml = (body: string) => `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  *, *::before, *::after { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 16px 20px;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 14px;
    line-height: 1.65;
    color: #1a1a1a;
    background: #fff;
    word-break: break-word;
    overflow: hidden;
  }
  img { max-width: 100%; height: auto; }
  a { color: #0066cc; }
  pre, code { white-space: pre-wrap; word-break: break-all; }
  body > *:first-child { margin-top: 0; }
  body > *:last-child  { margin-bottom: 0; }
</style>
</head>
<body>${body}</body>
</html>`;

// Un seul handler onLoad — lit scrollHeight une fois, c'est tout.
const handleIframeLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
  const iframe = e.currentTarget;
  const doc = iframe.contentDocument;
  if (doc?.body) {
    iframe.style.height = doc.body.scrollHeight + 32 + 'px'; // +32 = padding top+bottom
  }
};

const MailView = ({ subject, from, to, body, attachments, onReply, onForward, onDelete }: MailViewProps) => {
  return (
    <div className="mailview">

      {/* TOPBAR */}
      <div className="mailview-topbar">
        <div className="left">
          <h5>{subject || 'Aucun message sélectionné'}</h5>
        </div>
        <div className="actions">
          <button onClick={onReply} title="Répondre">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M6 3L2 7l4 4M2 7h8a3 3 0 0 1 3 3v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button onClick={onForward} title="Transférer">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M9 3l4 4-4 4M13 7H5a3 3 0 0 0-3 3v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button onClick={onDelete} title="Supprimer">
            <svg width="14" height="15" viewBox="0 0 14 15" fill="none">
              <path d="M1 4h12M5 4V2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V4M3 4l.7 8.5a.5.5 0 0 0 .5.5h5.6a.5.5 0 0 0 .5-.5L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* CONTENU : ce div scrolle, l'iframe est à sa hauteur naturelle */}
      <div className="mailview-content">
        <div className="mailview-meta">
          <p><strong>De :</strong> {from}</p>
          <p><strong>À :</strong> {to}</p>
        </div>

        {attachments.length > 0 && (
          <div className="attachments">
            {attachments.map((a, i) => (
              <a key={i} href={a.url} download={a.filename}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1v7M3 5l3 3 3-3M1 10h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {a.filename}
              </a>
            ))}
          </div>
        )}

        {body && (
          <iframe
            srcDoc={mailHtml(body)}
            sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            className="mailview-iframe"
            title="mail-body"
            onLoad={handleIframeLoad}
          />
        )}
      </div>

    </div>
  );
};

export default MailView;