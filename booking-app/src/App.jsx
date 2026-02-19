import { Routes, Route, useParams } from "react-router-dom";
import Header from "./components/Header";

import Home from "./pages/Home";
import Studios from "./pages/Studios";
import StudioDetails from "./pages/StudioDetails";
import BookingSuccess from "./pages/BookingSuccess";
import Auth from "./pages/Auth";

import Dashboard from "./pages/dashboard/Dashboard";
import StudioSettings from "./pages/dashboard/StudioSettings";
import Services from "./pages/dashboard/Services";
import Schedule from "./pages/dashboard/Schedule";
import Bookings from "./pages/dashboard/Bookings";
import Golowna from "./components/Golowna";
import Masters from "./pages/dashboard/Masters";
import StudioPublicPage from "./pages/dashboard/StudioPublicPage";
import AppBackground from "./components/AppBackground";
import StaffSchedule from "./pages/dashboard/StaffSchedule";
import LoginClient from "./pages/dashboard/LoginClient";
import RegisterClient from "./pages/dashboard/RegisterClient";
import ForgotPassword from "./pages/dashboard/ForgotPassword";
import Terms from "./pages/dashboard/Terms";
import Privacy from "./pages/dashboard/Privacy";
import LoginOwner from "./components/LoginOwner";
import RegisterOwner from "./components/RegisterOwner";

function StudioDetailsKeyed() {
  const { slug } = useParams();
  return <StudioDetails key={slug} />;
}
export default function App() {
  return (
     <AppBackground>
      <Header />

      <main className="mx-auto max-w-6xl px-4 pt-0 pb-8">

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/studios" element={<Studios />} />
          <Route path="/studios/:slug" element={<StudioPublicPage />} />
<Route path="/terms" element={<Terms />} />
<Route path="/privacy" element={<Privacy />} />
          <Route path="/booking/success" element={<BookingSuccess />} />
          <Route path="/auth" element={<Auth />} />
<Route path="/login" element={<LoginClient />} />
<Route path="/register" element={<RegisterClient />} />
<Route path="/forgot-password" element={<ForgotPassword />} />

<Route path="/login-owner" element={<LoginOwner />} />
<Route path="/register-owner" element={<RegisterOwner />} />


          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<Golowna></Golowna>} />
            <Route path="studio" element={<StudioSettings />} />
            <Route path="services" element={<Services />} />
            <Route path="/dashboard/staff-schedule" element={<StaffSchedule />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="masters" element={<Masters />} />
          </Route>
        </Routes>
      </main>
       </AppBackground>
  );
}
