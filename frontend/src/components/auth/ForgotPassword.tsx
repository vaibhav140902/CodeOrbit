import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../utils/firebase";
import { Link } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";
import { BRAND } from "../../config/brand";

export const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage(null);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage("Password reset link sent. Check your inbox and spam folder.");
    } catch (error: unknown) {
      console.error("Error sending reset email:", error);
      const code = String((error as { code?: string })?.code || "");

      if (code.includes("api-key-not-valid")) {
        alert("Firebase API key is invalid. Update frontend/.env and restart npm run dev.");
      } else if (code === "auth/invalid-email") {
        alert("Please enter a valid email.");
      } else if (code === "auth/user-not-found") {
        alert("No user found with this email.");
      } else {
        alert("Could not send reset email right now.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell flex items-center justify-center px-3 py-6 sm:px-6 sm:py-10">
      <div className="w-full max-w-md">
        <div className="mb-5 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 brand-gradient text-xl font-bold sm:text-2xl">
            <img src={BRAND.markPath} alt={`${BRAND.name} logo`} className="h-6 w-6 rounded-md" />
            {BRAND.name}
          </Link>
          <button onClick={toggleTheme} className="btn-ghost text-xs">
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
        </div>

        <div className="surface-card p-5 sm:p-8">
          <h1 className="text-2xl font-bold sm:text-3xl">Reset password</h1>
          <p className="text-muted mt-2 mb-8">We&apos;ll send a secure reset link to your email.</p>

          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-soft">Email</label>
              <input
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field-input"
                required
              />
            </div>

            {successMessage && (
              <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">
                {successMessage}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:cursor-not-allowed disabled:opacity-65">
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm font-semibold text-[color:var(--accent)] hover:underline">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
