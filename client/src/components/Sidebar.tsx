import './Sidebar.css';

type Section = 'inbox' | 'envoi' | 'spam' | 'corbeille';

type SidebarProps = {
  activeSection: Section;
  setActiveSection: (section: Section) => void;
  setIsComposing: (value: boolean) => void;
  setSelectedMail: (mail: {
    id: string; subject: string; from: string;
    to: string; body: string;
    attachments: { filename: string; url: string }[];
  }) => void;
  unreadCount: number;
};

const navItems: { key: Section; label: string; icon: string }[] = [
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
  unreadCount,
}: SidebarProps) => {
  const isAuthenticated = !!localStorage.getItem('access_token');

  return (
    <div className="sidebar">
      <div>
        <div className="sidebar-logo">
          <img src="/logo.svg" alt="Doppler Webmail" style={{ width: '100%', display: 'block' }} />
        </div>

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
              <span className="nav-label">{label}</span>
              {/* Badge non lus uniquement sur Inbox */}
              {key === 'inbox' && unreadCount > 0 && (
                <span className="sidebar-unread-badge">{unreadCount}</span>
              )}
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
            window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/google`;
          }
        }}
      >
        {isAuthenticated ? 'Se déconnecter' : 'Connexion Gmail'}
      </button>
    </div>
  );
};

export default Sidebar;