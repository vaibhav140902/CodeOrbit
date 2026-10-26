import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { httpsCallable } from "firebase/functions";
import { auth, db, functions } from '../../utils/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { BRAND } from "../../config/brand";

export const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const claimDailyFreePass = httpsCallable<Record<string, never>, { granted: boolean }>(functions, "claimDailyFreePass");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    if (password.length < 6) {
      alert('Password must be at least 6 characters!');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(
        doc(db, "users", userCredential.user.uid),
        {
          email: userCredential.user.email ?? email,
          isAdmin: false,
          points: 0,
          role: "user",
          status: "active",
          displayName: email.split("@")[0] || "User",
          emailVerified: false,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        },
        { merge: true }
      );

      try {
        await claimDailyFreePass({});
      } catch (claimError) {
        console.warn("Daily free pass claim failed:", claimError);
      }

      alert('✅ Account created! You can now sign in.');
      navigate('/login');
    } catch (error: any) {
      console.error('Error:', error);
      const code = String(error?.code || "");
      if (code.includes('api-key-not-valid')) {
        alert('Firebase API key is invalid. Update frontend/.env with the correct key from Firebase project settings, then restart npm run dev.');
      } else if (code === 'auth/email-already-in-use') {
        alert('This email is already registered!');
      } else if (code === 'auth/invalid-email') {
        alert('Invalid email address!');
      } else if (code === 'auth/weak-password') {
        alert('Password is too weak!');
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
          <h1 className="text-2xl font-bold sm:text-3xl">Create account</h1>
          <p className="text-muted mt-2 mb-8">Start building your problem-solving profile.</p>

          <form onSubmit={handleSignup} className="space-y-5">
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
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field-input"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-soft">Confirm password</label>
              <input
                type="password"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="field-input"
                required
                minLength={6}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:cursor-not-allowed disabled:opacity-65">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[color:var(--accent)] hover:underline">
              Sign in
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
