
import Sidebar from './components/Sidebar';
import MailList from './components/MailList';
import MailView from './components/MailView';
import AuthHandler from './components/AuthHandler';

function App() {
  return (
    <>
      <AuthHandler />
      <div className="container-fluid vh-100">
      <div className="row h-100">
        <div className="col-2 p-0">
          <Sidebar />
        </div>
        <div className="col-4 border-end p-0">
          <MailList />
        </div>
        <div className="col-6 p-0">
          <MailView />
        </div>
      </div>
    </div>
    </>
  );
}


export default App;
