import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import MailList from './components/MailList';
import MailView from './components/MailView';
import AuthHandler from './components/AuthHandler';


function App() {
  
const [selectedMailBody, setSelectedMailBody] = useState('');
  return (
    <>
      <AuthHandler />
      
      <div className="d-flex vh-100">
        <div className="col-2 p-0">
          <Sidebar activeSection="inbox" />
        </div>
        <div className="col-4 overflow-auto border-end">
          <MailList setSelectedMailBody={setSelectedMailBody} />
        </div>
        <div className="col-6 overflow-auto">
          <MailView body={selectedMailBody}/>
        </div>
      </div>
    
    </>
  );
}


export default App;
