import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import ClientDashboard from "../pages/ClientDashboard";
import Clients from "../pages/Clients";
import ClientDetail from "../pages/ClientDetail";
import Leads from "../pages/Leads";
import LeadDetail from "../pages/LeadDetail";
import ProtectedRoute from "./ProtectedRoute";
import AppLayout from "../layouts/AppLayout";
import Tickets from "../pages/Tickets";
import TicketDetail from "../pages/TicketDetail";
import AccessRequests from "../pages/AccessRequests";
import Settings from "../pages/Settings";

export default function AppRouter({
  isAuthenticated,
  user,
  onLogin,
  onLogout,
}) {
  return (
    <BrowserRouter>
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
                <Leads />
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
                <LeadDetail />
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
                <Settings user={user} />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}