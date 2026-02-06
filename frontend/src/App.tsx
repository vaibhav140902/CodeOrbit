import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RecoilRoot } from 'recoil';
import { ProblemList } from './components/ProblemList';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminPage } from './components/AdminPage';
import { Landing } from './components/Landing';
import { Signin } from './components/auth/Signin';
import { Signup } from './components/auth/Signup';
import { Leaderboard } from './components/LeaderBoard';
import { About } from './components/About';
import { Topbar } from './components/Topbar';
import SubmissionActivity from "./components/SubmissionActivity";
function App() {
  return (
    <RecoilRoot>
      <BrowserRouter>
        <Routes>
          {/* Public routes WITHOUT Topbar */}
          <Route path="/login" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Routes WITH Topbar */}
          <Route path="/" element={<><Topbar /><Landing /></>} />
          <Route path="/problems" element={<><Topbar /><ProblemList /></>} />
          <Route path="/leaderboard" element={<><Topbar /><Leaderboard leaderboard={[]} /></>} />
          <Route path="/activity" element={<><Topbar /><SubmissionActivity /></>} />
          <Route path="/about" element={<><Topbar /><About /></>} />
          <Route
            path="/admin"
            element={
              <>
                <Topbar />
                <ProtectedRoute requireAdmin={true}>
                  <AdminPage />
                </ProtectedRoute>
              </>
            }
          />
        </Routes>
      </BrowserRouter>
    </RecoilRoot>
  );
}

export default App;