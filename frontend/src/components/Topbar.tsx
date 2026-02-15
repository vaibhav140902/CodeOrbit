import { useEffect, useState } from "react";
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
  const [mobileOpen, setMobileOpen] = useState(false);
  
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

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const renderNavLink = (path: string, label: string, mobile = false) => (
    <Link
      key={path}
      to={path}
      className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
        isActive(path)
          ? "bg-[color:var(--accent-soft)] text-[color:var(--text-main)]"
          : "text-[color:var(--text-muted)] hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--text-main)]"
      } ${mobile ? "block w-full text-left" : ""}`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 border-b border-[color:var(--border)] bg-[color:var(--bg-surface)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3 px-4 py-3 md:px-6">
        <Link to="/" className="group flex max-w-[185px] items-center gap-2 sm:max-w-none">
          <span className="font-mono text-sm text-[color:var(--text-muted)]">&lt;/&gt;</span>
          <span className="brand-gradient truncate text-lg font-bold tracking-tight sm:text-xl">Vaibhav&apos;s Code</span>
        </Link>

        <button
          onClick={() => setMobileOpen((state) => !state)}
          className="btn-ghost px-3 py-2 text-xs md:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? "Close" : "Menu"}
        </button>

        <div className="hidden flex-1 items-center justify-end gap-2 md:flex">
          {navLinks.map((link) => renderNavLink(link.path, link.label))}

          <button
            onClick={toggleTheme}
            className="btn-ghost text-sm"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>

          {user ? (
            <>
              <span className="hidden max-w-[180px] truncate text-xs text-[color:var(--text-muted)] lg:block">
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

      {mobileOpen && (
        <div className="border-t border-[color:var(--border)] px-4 pb-4 md:hidden">
          <div className="mt-3 space-y-2">
            {navLinks.map((link) => renderNavLink(link.path, link.label, true))}
          </div>

          <div className="mt-3 flex flex-col gap-2">
            <button
              onClick={toggleTheme}
              className="btn-ghost w-full text-left text-sm"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>

            {user ? (
              <>
                <span className="truncate px-1 text-xs text-[color:var(--text-muted)]">{user.email}</span>
                <button onClick={handleLogout} className="btn-danger w-full text-sm">
                  Logout
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" className="btn-secondary text-center text-sm">
                  Login
                </Link>
                <Link to="/signup" className="btn-primary text-center text-sm">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
