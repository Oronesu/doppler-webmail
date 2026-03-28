import { useState } from 'react';
import Sidebar from './components/Sidebar';
import MailList from './components/MailList';
import MailView from './components/MailView';
import AuthHandler from './components/AuthHandler';
import MailComposer from './components/MailComposer';
import './App.css';
import api from './components/apiClient';
import SentList from './components/SentList';

interface SelectedMail {
  id: string;
  subject: string;
  from: string;
  to: string;
  body: string;
  isUnread: boolean;
  attachments: { filename: string; url: string }[];
}

const EMPTY_MAIL: SelectedMail = {
  id: '', subject: '', from: '', to: '', body: '', isUnread: false, attachments: []
};

function App() {
  const [activeSection, setActiveSection] = useState<'inbox' | 'envoi' | 'spam' | 'corbeille'>('inbox');
  const [isComposing, setIsComposing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedMail, setSelectedMail] = useState<SelectedMail>(EMPTY_MAIL);

  // ── Actions sur le mail sélectionné ──────────────────────────────────

  const deleteMail = async () => {
    if (!selectedMail.id) return;
    await api.post('/gmail/moveToTrash', null, { params: { id: selectedMail.id } });
    setSelectedMail(EMPTY_MAIL);
  };

  const archiveMail = async () => {
    if (!selectedMail.id) return;
    await api.post('/gmail/archive', null, { params: { id: selectedMail.id } });
    setSelectedMail(EMPTY_MAIL);
  };

  const toggleUnread = async () => {
    if (!selectedMail.id) return;
    if (selectedMail.isUnread) {
      // Marquer comme lu
      await api.post('/gmail/markAsRead', null, { params: { id: selectedMail.id } });
      setSelectedMail((m) => ({ ...m, isUnread: false }));
      setUnreadCount((c) => Math.max(0, c - 1));
    } else {
      // Marquer comme non lu
      await api.post('/gmail/markAsUnread', null, { params: { id: selectedMail.id } });
      setSelectedMail((m) => ({ ...m, isUnread: true }));
      setUnreadCount((c) => c + 1);
    }
  };

  return (
    <>
      <AuthHandler />
      <div className="main-layout">

        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          setIsComposing={setIsComposing}
          setSelectedMail={(m) => setSelectedMail({ ...m, isUnread: false })}
          unreadCount={unreadCount}
        />

        <div className="panel">
          {activeSection === 'envoi' ? (
            <SentList
              setSelectedMail={(m) => setSelectedMail({ ...m, isUnread: false })}
              setIsComposing={setIsComposing}
            />
          ) : (
            <MailList
              setSelectedMail={(m) => setSelectedMail(m)}
              setIsComposing={setIsComposing}
              label={
                activeSection === 'spam'      ? 'SPAM'  :
                activeSection === 'corbeille' ? 'TRASH' :
                undefined
              }
              onUnreadCount={setUnreadCount}
            />
          )}
        </div>

        <div className="panel">
          {isComposing ? (
            <MailComposer
              initialTo={selectedMail.to}
              initialSubject={selectedMail.subject}
              initialBody={selectedMail.body}
            />
          ) : (
            <MailView
              subject={selectedMail.subject}
              from={selectedMail.from}
              to={selectedMail.to}
              body={selectedMail.body}
              attachments={selectedMail.attachments}
              isUnread={selectedMail.isUnread}
              onReply={() => {
                setIsComposing(true);
                setSelectedMail({
                  ...EMPTY_MAIL,
                  subject: 'Re: ' + selectedMail.subject,
                  to: selectedMail.from,
                  body: `<br><br><blockquote style="border-left:2px solid #ccc;padding-left:10px;">${selectedMail.body}</blockquote>`,
                });
              }}
              onForward={() => {
                setIsComposing(true);
                setSelectedMail({
                  ...EMPTY_MAIL,
                  subject: 'Fwd: ' + selectedMail.subject,
                  body: `<br><br><hr/>${selectedMail.body}`,
                });
              }}
              onDelete={deleteMail}
              onArchive={archiveMail}
              onToggleUnread={toggleUnread}
            />
          )}
        </div>

      </div>
    </>
  );
}

export default App;