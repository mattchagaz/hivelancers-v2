import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AdminRoute, ProtectedRoute, PublicOnlyRoute } from './components/Auth/ProtectedRoute';
import './App.css';

const LoginP = lazy(() => import('./components/Auth/Login/Login'));
const SignupP = lazy(() => import('./components/Auth/Signup/Signup'));
const VerifyOtp = lazy(() => import('./components/Auth/VerifyOtp/VerifyOtp'));
const ForgetPassword = lazy(() => import('./components/Auth/ForgetPassword/ForgetPassword'));
const UserSelection = lazy(() => import('./components/Pages/UserSelection/UserSelection'));
const WelcomeUser = lazy(() => import('./components/Pages/WelcomeUser/WelcomeUser'));
const AppLayout = lazy(() => import('./components/Layout/AppLayout'));
const Dashboard = lazy(() => import('./components/Pages/Dashboard/Dashboard'));
const CreateService = lazy(() => import('./components/Pages/CreateService/CreateService'));
const ExploreServices = lazy(() => import('./components/Pages/ExploreServices/ExploreServices'));
const MyServices = lazy(() => import('./components/Pages/MyServices/MyServices'));
const ServiceDetails = lazy(() => import('./components/Pages/ServiceDetails/ServiceDetails'));
const Checkout = lazy(() => import('./components/Pages/Checkout/Checkout'));
const Orders = lazy(() => import('./components/Pages/Orders/Orders'));
const Settings = lazy(() => import('./components/Pages/Settings/Settings'));
const UserProfile = lazy(() => import('./components/Pages/UserProfile/UserProfile'));
const Messages = lazy(() => import('./components/Pages/Messages/Messages'));
const CustomizeProfile = lazy(() => import('./components/Pages/CustomizeProfile/CustomizeProfile'));
const ProfileProjectDetails = lazy(() => import('./components/Pages/ProfileProjectDetails/ProfileProjectDetails'));
const Favorites = lazy(() => import('./components/Pages/Favorites/Favorites'));
const Finances = lazy(() => import('./components/Pages/Finances/Finances'));
const Admin = lazy(() => import('./components/Pages/Admin/Admin'));
const Rewards = lazy(() => import('./components/Pages/Rewards/Rewards'));
const Subscription = lazy(() => import('./components/Pages/Subscription/Subscription'));
const AccountVerification = lazy(() => import('./components/Pages/AccountVerification/AccountVerification'));
const Notifications = lazy(() => import('./components/Pages/Notifications/Notifications'));
const Support = lazy(() => import('./components/Pages/Support/Support'));
const SupportTicket = lazy(() => import('./components/Pages/SupportTicket/SupportTicket'));
const SupportTicketDetails = lazy(() => import('./components/Pages/SupportTicketDetails/SupportTicketDetails'));
const Legal = lazy(() => import('./components/Pages/Legal/Legal'));

const RouteFallback = () => <div className="route-fallback">Carregando...</div>;

function App() {
  return (
    <Router>
      <Suspense fallback={<RouteFallback />}>
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

        {/* Central jurídica — pública para leitura antes ou depois do cadastro */}
        <Route path="/legal" element={<Navigate to="/privacy" replace />} />
        <Route path="/terms" element={<Legal />} />
        <Route path="/privacy" element={<Legal />} />
        <Route path="/cookies" element={<Legal />} />
        <Route path="/lgpd" element={<Legal />} />

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
            <Route path="/services" element={<MyServices />} />
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
            <Route path="/support" element={<Support />} />
            <Route path="/support/ticket" element={<SupportTicket />} />
            <Route path="/support/tickets/:id" element={<SupportTicketDetails />} />
            <Route path="/ticket" element={<SupportTicket />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
