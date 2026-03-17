import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import MailList from './components/MailList';
import MailView from './components/MailView';
import AuthHandler from './components/AuthHandler';
import MailComposer from './components/MailComposer';
import './App.css';
import axios from 'axios';


function App() {
  const [activeSection, setActiveSection] = useState<'inbox' | 'envoi' | 'spam' | 'corbeille'>('inbox');
  const [isComposing, setIsComposing] = useState(false);

  const [selectedMail, setSelectedMail] = useState({
    id: "",
    subject: "",
    from: "",
    to: "",
    body: "",
    attachments: [] as { filename: string; url: string }[]
  });



const deleteMail = async () => {
  const token = localStorage.getItem("access_token");
  if (!selectedMail.id) return;

  await axios.post(
    `http://localhost:3000/gmail/moveToTrash?access_token=${token}&id=${selectedMail.id}`
  );

  setSelectedMail({
    id: "",
    subject: "",
    from: "",
    to: "",
    body: "",
    attachments: []
  });
};



  return (
    <>
      <AuthHandler />

      <div className="d-flex vh-100">

      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        setIsComposing={setIsComposing}
        setSelectedMail={setSelectedMail}
      />



        <div className="col-5 overflow-auto border-end">
          <MailList
            setSelectedMail={setSelectedMail}
            setIsComposing={setIsComposing}
            label={
              activeSection === "envoi" ? "SENT" :
              activeSection === "spam" ? "SPAM" :
              activeSection === "corbeille" ? "TRASH" :
              undefined
            }
          />
        </div>

        <div className="col-5 overflow-auto">
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
              
              // répondre
              onReply={() => {
                setIsComposing(true);
                setSelectedMail({
                  id: "",
                  subject: "Re: " + selectedMail.subject,
                  from: "",
                  to: selectedMail.from,
                  body: `<br><br><blockquote style="border-left:2px solid #ccc;padding-left:10px;">${selectedMail.body}</blockquote>`,
                  attachments: []
                });
              }}

              // transférer
              onForward={() => {
                setIsComposing(true);
                setSelectedMail({
                  id: "",
                  subject: "Fwd: " + selectedMail.subject,
                  from: "",
                  to: "",
                  body: `<br><br><hr/>${selectedMail.body}`,
                  attachments: []
                });
              }}

              onDelete={deleteMail}
            />
          )}
        </div>

      </div>
    </>
  );
}
export default App;
