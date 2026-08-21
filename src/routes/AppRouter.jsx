import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import AppLayout from "../layouts/AppLayout";
import RouteFallback from "../components/RouteFallback";

// Each screen ships as its own chunk so the first paint does not carry the
// whole console.
const Login = lazy(() => import("../pages/Login"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const ClientDashboard = lazy(() => import("../pages/ClientDashboard"));
const Clients = lazy(() => import("../pages/Clients"));
const ClientDetail = lazy(() => import("../pages/ClientDetail"));
const Leads = lazy(() => import("../pages/Leads"));
const LeadDetail = lazy(() => import("../pages/LeadDetail"));
const Tickets = lazy(() => import("../pages/Tickets"));
const TicketDetail = lazy(() => import("../pages/TicketDetail"));
const AccessRequests = lazy(() => import("../pages/AccessRequests"));
const Settings = lazy(() => import("../pages/Settings"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/ResetPassword"));

export default function AppRouter({
  isAuthenticated,
  user,
  onLogin,
  onLogout,
  onUserRefresh,
}) {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <Login onLogin={onLogin} />
            )
          }
        />

        <Route
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
              <AppLayout user={user} onLogout={onLogout} />
            </ProtectedRoute>
          }
        >
          <Route
            path="/"
            element={
              user?.role === "client" ? (
                <ProtectedRoute
                  isAuthenticated={isAuthenticated}
                  user={user}
                  allowedRoles={["client"]}
                >
                  <ClientDashboard user={user} />
                </ProtectedRoute>
              ) : (
                <ProtectedRoute
                  isAuthenticated={isAuthenticated}
                  user={user}
                  allowedRoles={["admin", "staff", "viewer"]}
                >
                  <Dashboard />
                </ProtectedRoute>
              )
            }
          />

          <Route
            path="/clients"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                user={user}
                allowedRoles={["admin", "staff", "viewer"]}
              >
                <Clients user={user} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/clients/:id"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                user={user}
                allowedRoles={["admin", "staff", "viewer", "client"]}
              >
                <ClientDetail user={user} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/leads"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                user={user}
                allowedRoles={["admin", "staff", "viewer"]}
              >
                <Leads user={user} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/leads/:id"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                user={user}
                allowedRoles={["admin", "staff", "viewer"]}
              >
                <LeadDetail user={user} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tickets"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                user={user}
                allowedRoles={["admin", "staff", "viewer", "client"]}
              >
                <Tickets user={user} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tickets/:id"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                user={user}
                allowedRoles={["admin", "staff", "viewer", "client"]}
              >
                <TicketDetail user={user} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/access-requests"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                user={user}
                allowedRoles={["admin"]}
              >
                <AccessRequests />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                user={user}
                allowedRoles={["admin", "client"]}
                allowedClientPortalRoles={["admin"]}
              >
                <Settings user={user} onUserRefresh={onUserRefresh} />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />}
        />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}