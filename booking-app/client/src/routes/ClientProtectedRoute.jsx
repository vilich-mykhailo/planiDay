// ClientProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";

export default function ClientProtectedRoute({ children }) {
  const location = useLocation();

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || role !== "client") {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname + location.search,
          requiredRole: "client",
        }}
      />
    );
  }

  return children;
}