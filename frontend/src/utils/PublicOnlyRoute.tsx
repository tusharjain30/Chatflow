import { Navigate } from "react-router-dom";

type Portal = "user" | "reseller" | "admin";

export default function PublicOnlyRoute({
  children,
  portal = "user",
}: {
  children: JSX.Element;
  portal?: Portal;
}) {
  const token = localStorage.getItem("auth_token");
  const authPortal = (localStorage.getItem("auth_portal") || "user") as Portal;

  if (token && portal === authPortal) {
    return (
      <Navigate
        to={portal === "reseller" ? "/reseller" : portal === "admin" ? "/admin" : "/"}
        replace
      />
    );
  }

  return children;
}
