import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DelhiAQIHome from './HomePage';
import GovernmentLogin from './Login';
import CreatePasswordPage from './CreatePassword';
import GovDashBoard from './GovDashBoard';
import LandingPage from './LandingPage';
import './App.css';

function DashboardPage() {
  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <iframe 
        src="/dashboard.html" 
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Dashboard"
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RedirectToStarter />} />
        <Route path="/login" element={<GovernmentLogin />} />
        <Route path="/create-password" element={<CreatePasswordPage />} />
        <Route path="/gov-dashboard" element={<GovDashBoard />} />
        <Route path="/dashboard" element={<RedirectToDashboard />} />
        
        
      </Routes>
    </BrowserRouter>
  );
}
function RedirectToDashboard() {
  window.location.href = './dashboard.html';

  return null;
}

function RedirectToStarter() {
  React.useEffect(() => {
    window.location.href = '/landing.html';
  }, []);
  return null;
}

export default App;
