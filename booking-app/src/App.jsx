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

          <Route path="/booking/success" element={<BookingSuccess />} />
          <Route path="/auth" element={<Auth />} />

          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<Golowna></Golowna>} />
            <Route path="studio" element={<StudioSettings />} />
            <Route path="services" element={<Services />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="masters" element={<Masters />} />
          </Route>
        </Routes>
      </main>
       </AppBackground>
  );
}
