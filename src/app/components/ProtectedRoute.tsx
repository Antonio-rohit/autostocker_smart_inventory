import { Navigate, Outlet } from "react-router";
import { getAuthToken } from "../lib/auth";

export function ProtectedRoute() {
  const token = getAuthToken();
  return token ? <Outlet /> : <Navigate to="/" replace />;
}
