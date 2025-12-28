import { BrowserRouter, Routes, Route } from 'react-router-dom';
import GovernmentLogin from './Login';
import CreatePasswordPage from './CreatePassword';
import GovDashBoard from './GovDashBoard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GovernmentLogin />} />
        <Route path="/create-password" element={<CreatePasswordPage />} />
        <Route path="/gov-dashboard" element={<GovDashBoard />} />
      </Routes>
    </BrowserRouter>
  );
}