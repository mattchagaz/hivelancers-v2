import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginP from './components/Auth/Login/Login';
import SignupP from './components/Auth/Signup/Signup';
import UserSelection from './components/Pages/UserSelection/UserSelection';
import WelcomeUser from './components/Pages/WelcomeUser/Welcomeuser';
import AppLayout from './components/Layout/AppLayout';
import Dashboard from './components/Pages/Dashboard/Dashboard';
import CreateService from './components/Pages/CreateService/CreateService';
import ExploreServices from './components/Pages/ExploreServices/ExploreServices';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Auth */}
        <Route path="/login" element={<LoginP />} />
        <Route path="/signup" element={<SignupP />} />

        {/* Onboarding */}
        <Route path="/user-selection" element={<UserSelection />} />
        <Route path="/welcome-user" element={<WelcomeUser />} />

        {/* App principal */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/services/new" element={<CreateService />} />
          <Route path="/services" element={<ExploreServices />} />
          <Route path="/explore" element={<ExploreServices />} />
          {/* TODO: rotas futuras */}
          {/* <Route path="/services/:id" element={<ServiceDetails />} /> */}
          {/* <Route path="/orders" element={<Orders />} /> */}
          {/* <Route path="/messages" element={<Messages />} /> */}
          {/* <Route path="/finances" element={<Finances />} /> */}
          {/* <Route path="/rewards" element={<Rewards />} /> */}
          {/* <Route path="/settings" element={<Settings />} /> */}
          {/* <Route path="/profile" element={<Profile />} /> */}
          {/* <Route path="/favorites" element={<Favorites />} /> */}
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;