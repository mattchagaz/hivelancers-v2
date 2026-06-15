import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginP from './components/Auth/Login/Login';
import SignupP from './components/Auth/Signup/Signup';
import VerifyOtp from './components/Auth/VerifyOtp/VerifyOtp';
import ForgetPassword from './components/Auth/ForgetPassword/ForgetPassword';
import { AdminRoute, ProtectedRoute, PublicOnlyRoute } from './components/Auth/ProtectedRoute';
import UserSelection from './components/Pages/UserSelection/UserSelection';
import WelcomeUser from './components/Pages/WelcomeUser/WelcomeUser';
import AppLayout from './components/Layout/AppLayout';
import Dashboard from './components/Pages/Dashboard/Dashboard';
import CreateService from './components/Pages/CreateService/CreateService';
import ExploreServices from './components/Pages/ExploreServices/ExploreServices';
import ServiceDetails from './components/Pages/ServiceDetails/ServiceDetails';
import Checkout from './components/Pages/Checkout/Checkout';
import Orders from './components/Pages/Orders/Orders';
import Settings from './components/Pages/Settings/Settings';
import UserProfile from './components/Pages/UserProfile/UserProfile';
import Messages from './components/Pages/Messages/Messages';
import CustomizeProfile from './components/Pages/CustomizeProfile/CustomizeProfile';
import ProfileProjectDetails from './components/Pages/ProfileProjectDetails/ProfileProjectDetails';
import Favorites from './components/Pages/Favorites/Favorites';
import Finances from './components/Pages/Finances/Finances';
import Admin from './components/Pages/Admin/Admin';
import Rewards from './components/Pages/Rewards/Rewards';
import Subscription from './components/Pages/Subscription/Subscription';
import AccountVerification from './components/Pages/AccountVerification/AccountVerification';
import Notifications from './components/Pages/Notifications/Notifications';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Auth — públicas (redirecionam se já estiver logado) */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginP />} />
          <Route path="/signup" element={<SignupP />} />
          <Route path="/forget-password" element={<ForgetPassword />} />
        </Route>

        {/* OTP — acessível mesmo sem sessão (fluxo de pós-cadastro) */}
        <Route path="/verify-otp" element={<VerifyOtp />} />

        {/* Onboarding — exige login */}
        <Route element={<ProtectedRoute />}>
          <Route path="/user-selection" element={<UserSelection />} />
          <Route path="/welcome-user" element={<WelcomeUser />} />

          {/* App principal */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/admin"
              element={(
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              )}
            />
            <Route path="/services/new" element={<CreateService />} />
            <Route path="/services" element={<ExploreServices />} />
            <Route path="/services/:id/edit" element={<CreateService />} />
            <Route path="/services/:id" element={<ServiceDetails />} />
            <Route path="/checkout/:id" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/explore" element={<ExploreServices />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/finances" element={<Finances />} />
            <Route path="/rewards" element={<Rewards />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/verification" element={<AccountVerification />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile/customize" element={<CustomizeProfile />} />
            <Route path="/profile/:handle/projects/:projectId" element={<ProfileProjectDetails />} />
            <Route path="/profile/:handle" element={<UserProfile />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
