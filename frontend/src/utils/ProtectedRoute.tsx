import { Navigate } from "react-router-dom";

type Portal = "user" | "reseller" | "admin";

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
    return (
      <Navigate
        to={
          portal === "reseller"
            ? "/reseller/login"
            : portal === "admin"
              ? "/admin/login"
              : "/login"
        }
        replace
      />
    );
  }

  if (portal !== authPortal) {
    return (
      <Navigate
        to={
          authPortal === "reseller"
            ? "/reseller"
            : authPortal === "admin"
              ? "/admin"
              : "/"
        }
        replace
      />
    );
  }

  return children;
}
