import { Navigate } from "react-router-dom";
import {
  getAuthToken,
  getPortalHome,
  type Portal,
} from "@/utils/authStorage";

export default function PublicOnlyRoute({
  children,
  portal = "user",
}: {
  children: JSX.Element;
  portal?: Portal;
}) {
  const token = getAuthToken(portal);

  if (token) {
    return <Navigate to={getPortalHome(portal)} replace />;
  }

  return children;
}
