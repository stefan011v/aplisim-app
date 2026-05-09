import { Navigate, useLocation } from "react-router-dom";

function getFallbackRoute(user) {
  if (user?.role === "client") {
    return "/";
  }

  if (
    user?.role === "admin" ||
    user?.role === "staff" ||
    user?.role === "viewer"
  ) {
    return "/";
  }

  return "/login";
}

export default function ProtectedRoute({
  isAuthenticated,
  user,
  allowedRoles = [],
  allowedClientPortalRoles = [],
  children,
}) {
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!user || !user.role) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={getFallbackRoute(user)} replace />;
  }

  if (user.role === "client" && allowedClientPortalRoles.length > 0) {
    if (!allowedClientPortalRoles.includes(user.clientPortalRole)) {
      return <Navigate to={getFallbackRoute(user)} replace />;
    }
  }

  return children;
}