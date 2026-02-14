import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import MailList from './components/MailList';
import MailView from './components/MailView';
import AuthHandler from './components/AuthHandler';
import MailComposer from './components/MailComposer';

function App() {
  const [activeSection, setActiveSection] = useState<'inbox' | 'envoi' | 'spam' | 'corbeille'>('inbox');
  const [selectedMailBody, setSelectedMailBody] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  return (
    <>
      <AuthHandler />

      <div className="d-flex vh-100">

        {/* SIDEBAR */}
        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          setIsComposing={setIsComposing}
          setSelectedMailBody={setSelectedMailBody}
        />

        {/* LISTE DES MAILS */}
          <div className="col-5 overflow-auto border-end">
            {activeSection === 'inbox' && (
              <MailList
                setSelectedMailBody={setSelectedMailBody}
                setIsComposing={setIsComposing}
              />
            )}

            {activeSection === 'envoi' && (
              <MailList
                setSelectedMailBody={setSelectedMailBody}
                setIsComposing={setIsComposing}
                label="SENT"
              />
            )}

            {activeSection === 'spam' && (
              <MailList
                setSelectedMailBody={setSelectedMailBody}
                setIsComposing={setIsComposing}
                label="SPAM"
              />
            )}

            {activeSection === 'corbeille' && (
              <MailList
                setSelectedMailBody={setSelectedMailBody}
                setIsComposing={setIsComposing}
                label="TRASH"
              />
            )}
          </div>


        {/* PANNEAU DE DROITE */}
        <div className="col-5 overflow-auto">
          {isComposing ? (
            <MailComposer />
          ) : (
            <MailView body={selectedMailBody} />
          )}
        </div>

      </div>
    </>
  );
}

export default App;
