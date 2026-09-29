import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth.jsx";
import Shell from "./components/Shell.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import Find from "./pages/Find.jsx";
import Groups from "./pages/Groups.jsx";
import Home from "./pages/Home.jsx";
import Landing from "./pages/Landing.jsx";
import Messages from "./pages/Messages.jsx";
import Profile from "./pages/Profile.jsx";

function BootScreen() {
  return (
    <div className="boot">
      <p>Opening LecturePals…</p>
    </div>
  );
}

function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

function AppRoutes() {
  const { ready } = useAuth();
  if (!ready) return <BootScreen />;
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />
      <Route
        path="/app"
        element={
          <RequireAuth>
            <Shell />
          </RequireAuth>
        }
      >
        <Route index element={<Home />} />
        <Route path="profile" element={<Profile />} />
        <Route path="find" element={<Find />} />
        <Route path="groups" element={<Groups />} />
        <Route path="messages" element={<Messages />} />
        <Route path="messages/:conversationId" element={<Messages />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
