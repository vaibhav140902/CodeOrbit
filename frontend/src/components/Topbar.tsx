import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../utils/firebase";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { BRAND } from "../config/brand";

interface NavLinkItem {
  path: string;
  label: string;
}

export const Topbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = useMemo<NavLinkItem[]>(
    () => [
      { path: "/", label: "Home" },
      { path: "/problems", label: "Problems" },
      { path: "/prep", label: "Prep" },
      { path: "/leaderboard", label: "Leaderboard" },
      { path: "/activity", label: "Activity" },
      { path: "/pricing", label: "Pricing" },
      { path: "/about", label: "About" },
      ...(isAdmin ? [{ path: "/admin", label: "Admin" }] : []),
    ],
    [isAdmin]
  );

  const mobileDockLinks = useMemo<NavLinkItem[]>(
    () => [
      { path: "/", label: "Home" },
      { path: "/problems", label: "Problems" },
      { path: "/prep", label: "Prep" },
      { path: "/leaderboard", label: "Ranking" },
      { path: "/activity", label: "Activity" },
    ],
    []
  );

  const isActive = (path: string) => {
    if (path === "/problems") {
      return location.pathname === "/problems" || location.pathname.startsWith("/problems/");
    }
    if (path === "/prep") {
      return location.pathname === "/prep";
    }
    return location.pathname === path;
  };

  const isWorkspaceRoute =
    location.pathname.startsWith("/problems/") && location.pathname !== "/problems";
  const isAdminRoute = location.pathname === "/admin";
  const showMobileDock = !isWorkspaceRoute && !isAdminRoute;

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to logout?")) return;
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
      alert("Failed to logout");
    }
  };

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const renderNavLink = (link: NavLinkItem, mobile = false) => (
    <Link
      key={link.path}
      to={link.path}
      className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
        isActive(link.path)
          ? "bg-[color:var(--accent-soft)] text-[color:var(--text-main)]"
          : "text-[color:var(--text-muted)] hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--text-main)]"
      } ${mobile ? "block w-full text-left" : ""}`}
    >
      {link.label}
    </Link>
  );

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-[color:var(--border)] bg-[color:var(--bg-surface)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3 px-3 py-3 sm:px-4 md:px-6">
          <Link to="/" className="group flex max-w-[180px] items-center gap-2 sm:max-w-none">
            <img src={BRAND.markPath} alt={`${BRAND.name} logo`} className="h-6 w-6 rounded-md sm:h-7 sm:w-7" />
            <span className="brand-gradient truncate text-base font-bold tracking-tight sm:text-xl">
              {BRAND.name}
            </span>
          </Link>

          <button
            onClick={() => setMobileOpen((state) => !state)}
            className="btn-ghost px-3 py-2 text-xs md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? "Close" : "Menu"}
          </button>

          <div className="hidden flex-1 items-center justify-end gap-2 md:flex">
            {navLinks.map((link) => renderNavLink(link))}

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
          <div className="border-t border-[color:var(--border)] px-3 pb-4 md:hidden sm:px-4">
            <div className="mt-3 space-y-2">{navLinks.map((link) => renderNavLink(link, true))}</div>

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

      {showMobileDock && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--border)] bg-[color:var(--bg-surface)]/98 px-2 py-1 backdrop-blur md:hidden">
          <div
            className="mx-auto grid w-full max-w-[1180px] grid-cols-5 gap-1"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px))" }}
          >
            {mobileDockLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`rounded-lg px-2 py-2 text-center text-[11px] font-semibold leading-tight transition-colors ${
                  isActive(link.path)
                    ? "bg-[color:var(--accent-soft)] text-[color:var(--text-main)]"
                    : "text-[color:var(--text-muted)]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
