import { Link, useLocation } from "react-router-dom";
import { auth } from "../App";

export const Topbar = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700 shadow-lg sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo/Brand */}
          <Link to="/" className="group">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent hover:from-blue-300 hover:to-purple-400 transition-all duration-300">
              <span className="font-mono">{"<"}</span>
              Vaibhav's Code
              <span className="font-mono">{"/>"}</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            {[
              { path: "/", label: "Home" },
              { path: "/problems", label: "Problems" },
              { path: "/leaderboard", label: "Leaderboard" },
              { path: "/activity", label: "Activity" },
              { path: "/about", label: "About" },
            ].map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isActive(link.path)
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/50"
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            {/* Logout Button */}
            <button
              onClick={() => auth.signOut()}
              className="ml-4 px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-red-500/50 hover:scale-105 active:scale-95"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};