interface MailViewProps {
  subject: string;
  from: string;
  to: string;
  body: string;
  attachments: { filename: string; url: string }[];
  isUnread?: boolean;
  onReply: () => void;
  onForward: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onToggleUnread: () => void;
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

const handleIframeLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
  const iframe = e.currentTarget;
  const doc = iframe.contentDocument;
  if (doc?.body) {
    iframe.style.height = doc.body.scrollHeight + 32 + 'px';
  }
};

const MailView = ({
  subject, from, to, body, attachments,
  isUnread, onReply, onForward, onDelete, onArchive, onToggleUnread
}: MailViewProps) => {
  return (
    <div className="mailview">

      {/* TOPBAR */}
      <div className="mailview-topbar">
        <div className="left">
          <h5>{subject || 'Aucun message sélectionné'}</h5>
        </div>
        <div className="actions">

          {/* Répondre */}
          <button onClick={onReply} title="Répondre">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M6 3L2 7l4 4M2 7h8a3 3 0 0 1 3 3v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Transférer */}
          <button onClick={onForward} title="Transférer">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M9 3l4 4-4 4M13 7H5a3 3 0 0 0-3 3v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Marquer non lu / lu */}
          <button
            onClick={onToggleUnread}
            title={isUnread ? 'Marquer comme lu' : 'Marquer comme non lu'}
            className={isUnread ? 'btn-action--active' : ''}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <rect x="1" y="3" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M1 5l6.5 4.5L14 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              {isUnread && <circle cx="12" cy="4" r="2.5" fill="currentColor"/>}
            </svg>
          </button>

          {/* Archiver */}
          <button onClick={onArchive} title="Archiver">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <rect x="1" y="1.5" width="13" height="3" rx="1" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M2.5 4.5v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M5.5 7.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Supprimer */}
          <button onClick={onDelete} title="Supprimer">
            <svg width="14" height="15" viewBox="0 0 14 15" fill="none">
              <path d="M1 4h12M5 4V2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V4M3 4l.7 8.5a.5.5 0 0 0 .5.5h5.6a.5.5 0 0 0 .5-.5L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

        </div>
      </div>

      {/* CONTENU */}
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