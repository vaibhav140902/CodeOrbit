import { Suspense, lazy, type ReactNode } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { RecoilRoot } from "recoil";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Topbar } from "./components/Topbar";
import { ConnectionStatus } from "./components/system/ConnectionStatus";
import { ErrorBoundary } from "./components/system/ErrorBoundary";
import { NotFound } from "./components/system/NotFound";

const Landing = lazy(() => import("./components/Landing").then((module) => ({ default: module.Landing })));
const ProblemList = lazy(() =>
  import("./components/ProblemList").then((module) => ({ default: module.ProblemList }))
);
const ProblemWorkspace = lazy(() =>
  import("./components/ProblemWorkspace").then((module) => ({ default: module.ProblemWorkspace }))
);
const Leaderboard = lazy(() =>
  import("./components/LeaderBoard").then((module) => ({ default: module.Leaderboard }))
);
const SubmissionActivity = lazy(() => import("./components/SubmissionActivity"));
const About = lazy(() => import("./components/About").then((module) => ({ default: module.About })));
const AdminPage = lazy(() =>
  import("./components/AdminPage").then((module) => ({ default: module.AdminPage }))
);
const Signin = lazy(() =>
  import("./components/auth/Signin").then((module) => ({ default: module.Signin }))
);
const Signup = lazy(() =>
  import("./components/auth/Signup").then((module) => ({ default: module.Signup }))
);
const ForgotPassword = lazy(() =>
  import("./components/auth/ForgotPassword").then((module) => ({ default: module.ForgotPassword }))
);
const Pricing = lazy(() => import("./components/Pricing").then((module) => ({ default: module.Pricing })));
const PrepTracks = lazy(() =>
  import("./components/PrepTracks").then((module) => ({ default: module.PrepTracks }))
);

const RouteLoader = ({ withTopbar = false }: { withTopbar?: boolean }) => (
  <>
    {withTopbar && <Topbar />}
    <div className="app-shell flex items-center justify-center px-4 py-10">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-4 border-[color:var(--accent)]" />
        <p className="text-muted text-sm">Loading...</p>
      </div>
    </div>
  </>
);

const WithTopbar = ({ children }: { children: ReactNode }) => (
  <>
    <Topbar />
    {children}
  </>
);

function App() {
  return (
    <RecoilRoot>
      <ErrorBoundary>
        <BrowserRouter>
          <ConnectionStatus />
          <Routes>
            <Route
              path="/login"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <Signin />
                </Suspense>
              }
            />
            <Route
              path="/signup"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <Signup />
                </Suspense>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <ForgotPassword />
                </Suspense>
              }
            />

            <Route
              path="/"
              element={
                <Suspense fallback={<RouteLoader withTopbar={true} />}>
                  <WithTopbar>
                    <Landing />
                  </WithTopbar>
                </Suspense>
              }
            />
            <Route
              path="/problems"
              element={
                <Suspense fallback={<RouteLoader withTopbar={true} />}>
                  <WithTopbar>
                    <ProtectedRoute>
                      <ProblemList />
                    </ProtectedRoute>
                  </WithTopbar>
                </Suspense>
              }
            />
            <Route
              path="/prep"
              element={
                <Suspense fallback={<RouteLoader withTopbar={true} />}>
                  <WithTopbar>
                    <ProtectedRoute>
                      <PrepTracks />
                    </ProtectedRoute>
                  </WithTopbar>
                </Suspense>
              }
            />
            <Route
              path="/problems/:problemId"
              element={
                <Suspense fallback={<RouteLoader withTopbar={true} />}>
                  <WithTopbar>
                    <ProtectedRoute>
                      <ProblemWorkspace />
                    </ProtectedRoute>
                  </WithTopbar>
                </Suspense>
              }
            />
            <Route
              path="/leaderboard"
              element={
                <Suspense fallback={<RouteLoader withTopbar={true} />}>
                  <WithTopbar>
                    <ProtectedRoute>
                      <Leaderboard />
                    </ProtectedRoute>
                  </WithTopbar>
                </Suspense>
              }
            />
            <Route
              path="/activity"
              element={
                <Suspense fallback={<RouteLoader withTopbar={true} />}>
                  <WithTopbar>
                    <ProtectedRoute>
                      <SubmissionActivity />
                    </ProtectedRoute>
                  </WithTopbar>
                </Suspense>
              }
            />
            <Route
              path="/pricing"
              element={
                <Suspense fallback={<RouteLoader withTopbar={true} />}>
                  <WithTopbar>
                    <Pricing />
                  </WithTopbar>
                </Suspense>
              }
            />
            <Route
              path="/about"
              element={
                <Suspense fallback={<RouteLoader withTopbar={true} />}>
                  <WithTopbar>
                    <About />
                  </WithTopbar>
                </Suspense>
              }
            />
            <Route
              path="/admin"
              element={
                <Suspense fallback={<RouteLoader withTopbar={true} />}>
                  <WithTopbar>
                    <ProtectedRoute requireAdmin={true}>
                      <AdminPage />
                    </ProtectedRoute>
                  </WithTopbar>
                </Suspense>
              }
            />
            <Route
              path="*"
              element={
                <WithTopbar>
                  <NotFound />
                </WithTopbar>
              }
            />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </RecoilRoot>
  );
}

export default App;
