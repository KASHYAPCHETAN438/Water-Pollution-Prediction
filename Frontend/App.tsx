
import React, { useState, createContext, useContext, useEffect, ReactNode } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

import Navbar from './components/Navbar';
import Chatbot from './components/Chatbot';
import Footer from './components/Footer';
import Home from './pages/Home';
import Signup from './pages/Signup';
import Login from './pages/Login';
import About from './pages/About';
import Portfolio from './pages/Portfolio';
import Prediction from './pages/Prediction';
import ForgotPassword from './pages/ForgotPassword';

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const login = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('token');
    console.log('👤 User logged out');
  };
  
  const isAuthenticated = !!token;

  // ========== NEW: Token Validation & Auto-Logout on Backend Down ==========
  useEffect(() => {
    if (!token) return;

    // Check token validity every 5 minutes (300000 ms) or when tab/window comes to focus
    const validateTokenWithBackend = async () => {
      try {
        const response = await fetch('/api/auth/validate-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          console.log('❌ Backend says token is invalid/expired → logging out');
          logout();
        }
      } catch (err) {
        console.log('⚠️ Backend unreachable → auto logout (backend might be down)');
        logout();
      }
    };

    // Validate token periodically every 5 minutes
    const tokenCheckInterval = setInterval(validateTokenWithBackend, 5 * 60 * 1000);

    // Also validate when window regains focus (user switches back to tab)
    window.addEventListener('focus', validateTokenWithBackend);

    // ========== NEW: Clear Token on Tab/Browser Close ==========
    const handleBeforeUnload = () => {
      // Clear token from localStorage when user closes tab/browser
      localStorage.removeItem('token');
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(tokenCheckInterval);
      window.removeEventListener('focus', validateTokenWithBackend);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};


const ProtectedRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};


function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/about" element={<About />} />
              <Route 
                path="/prediction" 
                element={
                  <ProtectedRoute>
                    <Prediction />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
          <Chatbot />
          <Footer />
        </div>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;