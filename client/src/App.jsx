import React, { useState, useEffect, createContext, useContext } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Overview from './pages/Overview';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Classes from './pages/Classes';
import Fees from './pages/Fees';
import Exams from './pages/Exams';
import Attendance from './pages/Attendance';
import MarksEntry from './pages/MarksEntry';
import StudentProfile from './pages/StudentProfile';

// --- Context Definitions ---
export const AuthContext = createContext(null);
export const ToastContext = createContext(null);

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('edunex_token') || null);
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState('overview');
  const [theme, setTheme] = useState(localStorage.getItem('edunex_theme') || 'dark');
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Initialize Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('edunex_theme', theme);
  }, [theme]);

  // Session verification
  useEffect(() => {
    if (token) {
      verifySession();
    } else {
      setUser(null);
    }
  }, [token]);

  // Hash-based routing listener
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '#overview';
      setActiveView(hash.substring(1));
    };

    window.addEventListener('hashchange', handleHashChange);
    // Initial check
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update default page for student role
  useEffect(() => {
    if (user && user.role === 'student' && window.location.hash !== '#profile') {
      window.location.hash = '#profile';
      setActiveView('profile');
    }
  }, [user]);

  const verifySession = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setUser(data.user);
      } else {
        logout();
      }
    } catch (err) {
      console.error(err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('edunex_token', newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('edunex_token');
    window.location.hash = '';
    showToast('Logged out successfully.', 'warning');
  };

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // Centralized fetch caller with auth headers
  const request = async (endpoint, method = 'GET', body = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    try {
      const res = await fetch(`/api${endpoint}`, config);
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          logout();
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(data.message || 'API request failed');
      }
      return data;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  // Render Subview dispatcher
  const renderView = () => {
    if (!user) return null;

    switch (activeView) {
      case 'overview':
        return <Overview />;
      case 'students':
        return user.role === 'admin' ? <Students /> : null;
      case 'teachers':
        return user.role === 'admin' ? <Teachers /> : null;
      case 'classes':
        return user.role === 'admin' ? <Classes /> : null;
      case 'fees':
        return user.role === 'admin' ? <Fees /> : null;
      case 'exams':
        return user.role === 'admin' ? <Exams /> : null;
      case 'attendance':
        return ['admin', 'teacher'].includes(user.role) ? <Attendance /> : null;
      case 'marks-entry':
        return ['admin', 'teacher'].includes(user.role) ? <MarksEntry /> : null;
      case 'profile':
        return user.role === 'student' ? <StudentProfile /> : null;
      default:
        return user.role === 'student' ? <StudentProfile /> : <Overview />;
    }
  };

  const handleContentClick = (e) => {
    if (e.target.closest('.sidebar-toggle-btn')) return;
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <AuthContext.Provider value={{ token, user, login, logout, request, theme, setTheme, loading, setLoading }}>
        
        {/* Loading Spinner */}
        {loading && (
          <div className="global-loader">
            <div className="loader-spinner"></div>
          </div>
        )}

        {/* Toasts List */}
        <div className="toast-container">
          {toasts.map(t => (
            <div key={t.id} className={`toast toast-${t.type}`}>
              <i className={`fa-solid ${
                t.type === 'success' ? 'fa-circle-check' :
                t.type === 'error' ? 'fa-circle-exclamation' : 'fa-triangle-exclamation'
              } toast-icon`}></i>
              <div className="toast-message">{t.message}</div>
            </div>
          ))}
        </div>

        {/* View Routing */}
        {!token || !user ? (
          <Login />
        ) : (
          <div className="app-container">
            <div className="dashboard-view">
              <Sidebar activeView={activeView} />
              <div className="main-content" onClick={handleContentClick}>
                <Header activeView={activeView} />
                <main className="content-body">
                  <div className="subview-panel">
                    {renderView()}
                  </div>
                </main>
              </div>
            </div>
          </div>
        )}

      </AuthContext.Provider>
    </ToastContext.Provider>
  );
}
