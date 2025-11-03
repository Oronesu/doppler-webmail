import './Sidebar.css'; // Optionnel pour styles personnalisés

const isAuthenticated = !!localStorage.getItem('access_token');


const Sidebar = () => {
  const handleLogin = () => {
    window.location.href = 'http://localhost:3000/auth/google';
  };

  return (
    <div className="bg-dark text-white h-100 d-flex flex-column">
      <h4 className="text-center py-3">LOGO</h4>
      <a href="#" className="px-3 py-2 text-white text-decoration-none">Inbox</a>
      <a href="#" className="px-3 py-2 text-white text-decoration-none">Envoi</a>
      <a href="#" className="px-3 py-2 text-white text-decoration-none">Brouillon</a>
      <a href="#" className="px-3 py-2 text-white text-decoration-none">Spam</a>
      <a href="#" className="px-3 py-2 text-white text-decoration-none">Corbeille</a>
      
      <button
        onClick={() => {
          if (isAuthenticated) {
            localStorage.removeItem('access_token');
            window.location.href = '/'; // Déconnexion
          } else {
            window.location.href = 'http://localhost:3000/auth/google'; // Connexion
          }
        }}
        className="btn btn-primary"
      >
        {isAuthenticated ? 'Se déconnecter' : 'Se connecter avec Gmail'}
      </button>

    </div>
  );
};


export default Sidebar;
