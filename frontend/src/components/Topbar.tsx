import { Link, useLocation, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../utils/firebase";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";

export const Topbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const isActive = (path: string) => {
    if (path === "/problems") {
      return location.pathname === "/problems" || location.pathname.startsWith("/problems/");
    }
    return location.pathname === path;
  };

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to logout?')) return;
    
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      alert('Failed to logout');
    }
  };

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/problems", label: "Problems" },
    { path: "/leaderboard", label: "Leaderboard" },
    { path: "/activity", label: "Activity" },
    { path: "/about", label: "About" },
    ...(isAdmin ? [{ path: "/admin", label: "Admin" }] : []),
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-[color:var(--border)] bg-[color:var(--bg-surface)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        <Link to="/" className="group flex items-center gap-2">
          <span className="font-mono text-sm text-[color:var(--text-muted)]">&lt;/&gt;</span>
          <span className="brand-gradient text-xl font-bold tracking-tight">Vaibhav&apos;s Code</span>
        </Link>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                isActive(link.path)
                  ? "bg-[color:var(--accent-soft)] text-[color:var(--text-main)]"
                  : "text-[color:var(--text-muted)] hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--text-main)]"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <button
            onClick={toggleTheme}
            className="btn-ghost text-sm"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>

          {user ? (
            <>
              <span className="hidden max-w-[180px] truncate text-xs text-[color:var(--text-muted)] md:block">
                {user.email}
              </span>
              <button onClick={handleLogout} className="btn-danger text-sm">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary text-sm">
                Login
              </Link>
              <Link to="/signup" className="btn-primary text-sm">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
