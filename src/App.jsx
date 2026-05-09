import { useEffect, useState } from "react";
import AppRouter from "./routes/AppRouter";
import { apiFetch } from "./lib/api";

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const data = await apiFetch("/api/auth/me");
        setUser(data.user);
      } catch {
        setUser(null);
      } finally {
        setCheckingAuth(false);
      }
    }

    checkAuth();
  }, []);

  async function handleLogout() {
    try {
      await apiFetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
    }
  }

  if (checkingAuth) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-900 px-6 text-white">
        <div className="rounded-2xl border border-white/8 bg-slate-900/80 px-[22px] py-[18px] text-sm shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
          Loading APLISIM Business Console...
        </div>
      </div>
    );
  }

  return (
    <AppRouter
      isAuthenticated={!!user}
      user={user}
      onLogin={setUser}
      onLogout={handleLogout}
    />
  );
}