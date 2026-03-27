import './Sidebar.css';

type SidebarProps = {
  activeSection: 'inbox' | 'envoi' | 'spam' | 'corbeille';
  setActiveSection: (section: 'inbox' | 'envoi' | 'spam' | 'corbeille') => void;
  setIsComposing: (value: boolean) => void;
  setSelectedMail: (mail: {
    id: string;
    subject: string;
    from: string;
    to: string;
    body: string;
    attachments: { filename: string; url: string }[];
  }) => void;
};

const navItems: { key: 'inbox' | 'envoi' | 'spam' | 'corbeille'; label: string; icon: string }[] = [
  { key: 'inbox',     label: 'Inbox',     icon: '↓' },
  { key: 'envoi',     label: 'Envoyés',   icon: '↑' },
  { key: 'spam',      label: 'Spam',      icon: '!' },
  { key: 'corbeille', label: 'Corbeille', icon: '×' },
];

const Sidebar = ({
  activeSection,
  setActiveSection,
  setIsComposing,
  setSelectedMail,
}: SidebarProps) => {
  const isAuthenticated = !!localStorage.getItem('access_token');

  return (
    <div className="sidebar">
      <div>
        <div className="sidebar-logo">Webmail</div>

        <button
          className="btn-compose"
          onClick={() => {
            setActiveSection('envoi');
            setIsComposing(true);
            setSelectedMail({ id: '', subject: '', from: '', to: '', body: '', attachments: [] });
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          Nouveau message
        </button>

        <nav className="sidebar-nav">
          {navItems.map(({ key, label, icon }) => (
            <button
              key={key}
              className={`sidebar-btn${activeSection === key ? ' active' : ''}`}
              onClick={() => setActiveSection(key)}
            >
              <span className="nav-icon">{icon}</span>
              {label}
            </button>
          ))}
        </nav>
      </div>

      <button
        className="btn-auth"
        onClick={() => {
          if (isAuthenticated) {
            localStorage.removeItem('access_token');
            window.location.href = '/';
          } else {
            window.location.href = 'http://localhost:3000/auth/google';
          }
        }}
      >
        {isAuthenticated ? 'Se déconnecter' : 'Connexion Gmail'}
      </button>
    </div>
  );
};

export default Sidebar;