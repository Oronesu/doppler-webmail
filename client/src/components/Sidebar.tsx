import './Sidebar.css'; // Optionnel pour styles personnalisés

const isAuthenticated = !!localStorage.getItem('access_token');


const Sidebar = ({ activeSection }: { activeSection: string }) => {
  return (
    <div className="d-flex flex-column justify-content-between vh-100 bg-dark text-white p-3">
      <div>
        <div className="mb-4 fw-bold">📩 LOGO</div>
        <button className={`btn btn-sm w-100 text-start mb-2 ${activeSection === 'inbox' ? 'btn-primary' : 'btn-outline-light'}`}>
          Inbox
        </button>
        <button className="btn btn-sm w-100 text-start mb-2 btn-outline-light">Envoi</button>
        <button className="btn btn-sm w-100 text-start mb-2 btn-outline-light">Spam</button>
        <button className="btn btn-sm w-100 text-start mb-2 btn-outline-light">Corbeille</button>
      </div>
      <button
        onClick={() => {
          if (isAuthenticated) {
            localStorage.removeItem('access_token');
            window.location.href = '/'; // Déconnexion
          } else {
            window.location.href = 'http://localhost:3000/auth/google'; // Connexion
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
