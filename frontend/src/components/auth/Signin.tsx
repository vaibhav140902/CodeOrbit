import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../utils/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { BRAND } from "../../config/brand";

export const Signin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/problems');
    } catch (error: any) {
      console.error('Error signing in:', error);
      const code = String(error?.code || "");
      if (code.includes('api-key-not-valid')) {
        alert('Firebase API key is invalid. Update frontend/.env with the correct key from Firebase project settings, then restart npm run dev.');
      } else if (code === 'auth/user-not-found') {
        alert('No account found with this email!');
      } else if (code === 'auth/wrong-password') {
        alert('Incorrect password!');
      } else if (code === 'auth/invalid-credential') {
        alert('Invalid email or password!');
      } else {
        alert('Error: ' + error.message);
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
          <h1 className="text-2xl font-bold sm:text-3xl">Welcome back</h1>
          <p className="text-muted mt-2 mb-8">Sign in and continue your streak.</p>

          <form onSubmit={handleSignin} className="space-y-5">
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

            <div>
              <label className="mb-2 block text-sm font-semibold text-soft">Password</label>
              <input
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field-input"
                required
              />
              <div className="mt-2 text-right">
                <Link to="/forgot-password" className="text-xs text-[color:var(--accent)] hover:underline">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:cursor-not-allowed disabled:opacity-65">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="font-semibold text-[color:var(--accent)] hover:underline">
              Sign up
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link to="/" className="text-xs text-muted hover:underline">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
