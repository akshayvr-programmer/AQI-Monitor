import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DelhiAQIHome from './HomePage';
import GovernmentLogin from './Login';
import CreatePasswordPage from './CreatePassword';
import GovDashBoard from './GovDashBoard';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DelhiAQIHome />} />
        <Route path="/login" element={<GovernmentLogin />} />
        <Route path="/create-password" element={<CreatePasswordPage />} />
        <Route path="/gov-dashboard" element={<GovDashBoard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
