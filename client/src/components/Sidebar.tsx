import './Sidebar.css';

type SidebarProps = {
  activeSection: 'inbox' | 'envoi' | 'spam' | 'corbeille';
  setActiveSection: (section: 'inbox' | 'envoi' | 'spam' | 'corbeille') => void;
};

const Sidebar = ({ activeSection, setActiveSection }: SidebarProps) => {
  const isAuthenticated = !!localStorage.getItem('access_token');

  return (
    <div className="d-flex flex-column justify-content-between vh-100 bg-dark text-white p-3">
      <div>
        <div className="mb-4 fw-bold">📩 LOGO</div>

        <button
          className={`btn btn-sm w-100 text-start mb-2 ${
            activeSection === 'inbox' ? 'btn-primary' : 'btn-outline-light'
          }`}
          onClick={() => setActiveSection('inbox')}
        >
          Inbox
        </button>

        <button
          className={`btn btn-sm w-100 text-start mb-2 ${
            activeSection === 'envoi' ? 'btn-primary' : 'btn-outline-light'
          }`}
          onClick={() => setActiveSection('envoi')}
        >
          Envoi
        </button>

        <button
          className={`btn btn-sm w-100 text-start mb-2 ${activeSection === 'spam' ? 'btn-primary' : 'btn-outline-light'}`}
          onClick={() => setActiveSection('spam')}
        >
          Spam
        </button>

        <button
          className={`btn btn-sm w-100 text-start mb-2 ${activeSection === 'corbeille' ? 'btn-primary' : 'btn-outline-light'}`}
          onClick={() => setActiveSection('corbeille')}
        >
          Corbeille
        </button>
      </div>

      <button
        onClick={() => {
          if (isAuthenticated) {
            localStorage.removeItem('access_token');
            window.location.href = '/';
          } else {
            window.location.href = 'http://localhost:3000/auth/google';
          }
        }}
        className="btn btn-primary mt-auto"
      >
        {isAuthenticated ? 'Se déconnecter' : 'Se connecter avec Gmail'}
      </button>
    </div>
  );
};

export default Sidebar;
