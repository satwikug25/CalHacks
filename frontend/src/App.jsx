import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import './App.css';
import Login from "./app/Login";
import Choose from "./app/Choose";
import Train from "./app/Train";
import UploadSearch from "./app/UploadSearch";
import Search from "./app/Search";

import Analyze from "./app/Analyze";


function App() {
  const [openedChessGameChat, setOpenedChessGameChat] = useState(null);
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/choose" element={<Choose />} />
        <Route path="/train" element={<Train />} />
        <Route path="/upload" element={<UploadSearch />} />
        <Route path="/search" element={<Search openedChessGameChat={openedChessGameChat} setOpenedChessGameChat={setOpenedChessGameChat} />} />
        <Route path="/analyze" element={<Analyze openedChessGameChat={openedChessGameChat} setOpenedChessGameChat={setOpenedChessGameChat} />} />

      </Routes>
    </Router>
  );
}

export default App;