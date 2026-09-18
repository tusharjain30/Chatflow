import { Navigate } from "react-router-dom";
import {
  getAuthToken,
  getPortalLogin,
  type Portal,
} from "@/utils/authStorage";

export default function ProtectedRoute({
  children,
  portal = "user",
}: {
  children: JSX.Element;
  portal?: Portal;
}) {
  const token = getAuthToken(portal);

  if (!token) {
    return <Navigate to={getPortalLogin(portal)} replace />;
  }

  return children;
}
