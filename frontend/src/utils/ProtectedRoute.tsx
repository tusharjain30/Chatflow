import { Navigate } from "react-router-dom";

type Portal = "user" | "reseller";

export default function ProtectedRoute({
  children,
  portal = "user",
}: {
  children: JSX.Element;
  portal?: Portal;
}) {
  const token = localStorage.getItem("auth_token");
  const authPortal = (localStorage.getItem("auth_portal") || "user") as Portal;

  if (!token) {
    return <Navigate to={portal === "reseller" ? "/reseller/login" : "/login"} replace />;
  }

  if (portal !== authPortal) {
    return <Navigate to={authPortal === "reseller" ? "/reseller" : "/"} replace />;
  }

  return children;
}
