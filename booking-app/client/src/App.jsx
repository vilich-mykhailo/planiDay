// App.jsx
import { Routes, Route, useParams } from "react-router-dom";
import Header from "./components/Header";

import Studios from "./pages/Studios";
import StudioDetails from "./pages/StudioDetails";
import BookingSuccess from "./pages/BookingSuccess";
import Auth from "./pages/Auth";
import Notifications from "./pages/dashboard/Notifications";
import Dashboard from "./pages/dashboard/Dashboard";
import StudioSettings from "./pages/dashboard/StudioSettings";
import Services from "./pages/dashboard/Services";
import Schedule from "./pages/dashboard/Schedule";
import Bookings from "./pages/dashboard/Bookings";
import Golowna from "./components/Golowna";
import Masters from "./pages/dashboard/Masters";
import StudioPublicPage from "./pages/dashboard/StudioPublicPage";
import AppBackground from "./components/AppBackground";
import LoginClient from "./pages/dashboard/LoginClient";
import RegisterClient from "./pages/dashboard/RegisterClient";
import ForgotPassword from "./pages/dashboard/ForgotPassword";
import Terms from "./pages/dashboard/TermsOwner";
import Privacy from "./pages/dashboard/PrivacyOwner";
import LoginOwner from "./components/LoginOwner";
import RegisterOwner from "./components/RegisterOwner";
import ProtectedRoute from "./routes/ProtectedRoute";
import ClientProtectedRoute from "./routes/ClientProtectedRoute";
import MyBookings from "./pages/MyBookings";
import Favourites from "./pages/Favourites";
import { FavouritesProvider } from "./context/FavouritesContext";
import Profile from "./pages/dashboard/Profile";
import ScrollRestoration from "./components/ScrollRestoration";
import PrivacyClient from "./pages/dashboard/PrivacyClient";
import TermsClient from "./pages/dashboard/TermsClient";
import PrivacyOwner from "./pages/dashboard/PrivacyOwner";
import TermsOwner from "./pages/dashboard/TermsOwner";
import MessagesClient from "./pages/MessagesClient";
import Clients from "./pages/dashboard/Clients";
import Login from "./components/Login";
import BillingPlans from "./pages/dashboard/BillingPlans";

function StudioDetailsKeyed() {
  const { slug } = useParams();
  return <StudioDetails key={slug} />;
}

export default function App() {
  return (
    <>
      <ScrollRestoration />

      <FavouritesProvider>
        <AppBackground>
          <Header />

          <Routes>
            <Route path="/" element={<Studios />} />
<Route
  path="/profile"
  element={
    <ClientProtectedRoute>
      <Profile />
    </ClientProtectedRoute>
  }
/>

<Route
  path="/bookings"
  element={
    <ClientProtectedRoute>
      <MyBookings />
    </ClientProtectedRoute>
  }
/>

<Route
  path="/favourites"
  element={
    <ClientProtectedRoute>
      <Favourites />
    </ClientProtectedRoute>
  }
/>

<Route
  path="/security-client"
  element={
    <ClientProtectedRoute>
      <MessagesClient />
    </ClientProtectedRoute>
  }
/>
            <Route path="/termsowner" element={<TermsOwner />} />
            <Route path="/termsclient" element={<TermsClient />} />
            <Route path="/privacyowner" element={<PrivacyOwner />} />
            <Route path="/privacyclient" element={<PrivacyClient />} />
            <Route path="/booking/success" element={<BookingSuccess />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/register" element={<RegisterClient />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
           <Route path="/login" element={<Login />} />
<Route path="/login-owner" element={<Login />} />
            <Route path="/register-owner" element={<RegisterOwner />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<Golowna />} />
              <Route path="studio" element={<StudioSettings />} />
              <Route path="services" element={<Services />} />
              <Route path="billing" element={<BillingPlans />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="clients" element={<Clients />} />
              <Route path="bookings" element={<Bookings />} />
              <Route path="masters" element={<Masters />} />
            </Route>

            <Route path="/:slug" element={<StudioPublicPage />} />
          </Routes>
        </AppBackground>
      </FavouritesProvider>
    </>
  );
}
