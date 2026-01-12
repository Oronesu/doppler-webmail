import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import MailList from './components/MailList';
import MailView from './components/MailView';
import AuthHandler from './components/AuthHandler';
import MailComposer from './components/MailComposer';
import SentList from './components/SentList';



function App() {
  const [activeSection, setActiveSection] = useState<'inbox' | 'envoi'>('inbox');
  const [selectedMailBody, setSelectedMailBody] = useState('');

  return (
    <>
      <AuthHandler />

      <div className="d-flex vh-100">
        <div className="col-2">
          <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
        </div>

        <div className="col-5 overflow-auto border-end">
          {activeSection === 'inbox' ? (
            <MailList setSelectedMailBody={setSelectedMailBody} />
          ) : (
            <SentList />
          )}
        </div>

        <div className="col-5 overflow-auto">
          {activeSection === 'inbox' ? (
            <MailView body={selectedMailBody} />
          ) : (
            <MailComposer />
          )}
        </div>
      </div>
    </>
  );
}


export default App;
