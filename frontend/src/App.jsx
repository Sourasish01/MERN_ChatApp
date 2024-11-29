import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useEffect } from "react";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, onlineUsers } = useAuthStore();
  const { theme } = useThemeStore();

  console.log({ onlineUsers });

  useEffect(() => { // here we are calling the checkAuth function when the component mounts, component mount means when the component is rendered for the first time
    checkAuth();
  }, [checkAuth]); // here we are passing checkAuth as a dependency to the useEffect hook, so that the useEffect hook runs whenever checkAuth changes

  console.log({ authUser });

  if (isCheckingAuth && !authUser) // here we are checking if the checkAuth function is still running and the user is not authenticated, if any of the conditions become false, and the loading image will no longer be displayed.
    return ( //authentication means whether the request maker has the authenticated cookie token , while making the request ,ie he is logged in some once
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );



  return (
    <div data-theme={theme} className="min-h-screen overflow-auto">
      <Navbar /> {/* Navbar component outside of Routes to be always visible */}

      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/settings" element={<SettingsPage />} /> {/* Settings page is accessible to both authenticated and unauthenticated users */}
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
      </Routes>

      <Toaster /> {/* Toaster component outside of Routes to be always visible */}
    </div>
  );
};
export default App;

