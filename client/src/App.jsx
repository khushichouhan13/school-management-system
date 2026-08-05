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
import { 
  LayoutDashboard, 
  GraduationCap, 
  Users, 
  Wallet, 
  CalendarCheck, 
  Award,
  Menu
} from 'lucide-react';

// --- Context Definitions ---
export const AuthContext = createContext(null);
export const ToastContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('edunex_token') || null);
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState('overview');
  const [theme, setTheme] = useState(localStorage.getItem('edunex_theme') || 'dark');
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    localStorage.getItem('edunex_sidebar_collapsed') === 'true'
  );

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('edunex_sidebar_collapsed', next);
      return next;
    });
  };

  // Initialize Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('edunex_theme', theme);
  }, [theme]);

  // Swipe gesture listeners for mobile/desktop off-canvas sidebar
  useEffect(() => {
    let startX = null;
    let startY = null;
    let currentX = null;
    let currentY = null;
    let isDragging = false;
    const sidebarWidth = 260;
    let wasOpen = false;

    const handleStart = (clientX, clientY) => {
      if (window.innerWidth >= 1024) return;

      const sidebar = document.querySelector('.sidebar');
      if (!sidebar) return;

      wasOpen = sidebar.classList.contains('open');

      // Drag-open triggers from left 50px edge. Drag-close triggers anywhere if open.
      if (!wasOpen && clientX > 50) return;

      startX = clientX;
      startY = clientY;
      currentX = clientX;
      currentY = clientY;
      isDragging = false;
    };

    const handleMove = (clientX, clientY, preventDefaultFn) => {
      if (window.innerWidth >= 1024) return;
      if (startX === null || startY === null) return;

      currentX = clientX;
      currentY = clientY;

      const diffX = currentX - startX;
      const diffY = currentY - startY;

      const sidebar = document.querySelector('.sidebar');
      const overlay = document.querySelector('.sidebar-overlay');
      if (!sidebar || !overlay) return;

      if (!isDragging) {
        if (Math.abs(diffX) > 5 && Math.abs(diffX) > Math.abs(diffY)) {
          isDragging = true;
        }
      }

      if (isDragging) {
        if (typeof preventDefaultFn === 'function') preventDefaultFn();

        let translateX = 0;
        if (!wasOpen) {
          translateX = Math.max(-sidebarWidth, Math.min(0, -sidebarWidth + diffX));
        } else {
          translateX = Math.max(-sidebarWidth, Math.min(0, diffX));
        }

        sidebar.style.transition = 'none';
        sidebar.style.left = `${translateX}px`;

        overlay.style.transition = 'none';
        const progress = (sidebarWidth + translateX) / sidebarWidth;
        overlay.style.opacity = `${progress}`;
        overlay.style.pointerEvents = 'auto';
      }
    };

    const handleEnd = () => {
      if (window.innerWidth >= 1024) return;
      if (startX === null) return;

      const sidebar = document.querySelector('.sidebar');
      const overlay = document.querySelector('.sidebar-overlay');

      if (isDragging && sidebar && overlay) {
        const diffX = currentX - startX;
        sidebar.style.transition = '';
        overlay.style.transition = '';

        if (!wasOpen) {
          if (diffX > 75) {
            sidebar.classList.add('open');
          } else {
            sidebar.classList.remove('open');
          }
        } else {
          if (diffX < -75) {
            sidebar.classList.remove('open');
          } else {
            sidebar.classList.add('open');
          }
        }

        sidebar.style.left = '';
        overlay.style.opacity = '';
        overlay.style.pointerEvents = '';
      }

      startX = null;
      startY = null;
      isDragging = false;
    };

    const onTouchStart = (e) => {
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    };

    const onTouchMove = (e) => {
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY, () => {
        if (e.cancelable) e.preventDefault();
      });
    };

    const onTouchEnd = () => {
      handleEnd();
    };

    let isMouseDown = false;
    const onMouseDown = (e) => {
      if (e.button !== 0) return;
      if (e.target.closest('button, input, select, textarea, a')) return;
      isMouseDown = true;
      handleStart(e.clientX, e.clientY);
    };

    const onMouseMove = (e) => {
      if (!isMouseDown) return;
      handleMove(e.clientX, e.clientY, () => {
        if (e.cancelable) e.preventDefault();
      });
    };

    const onMouseUp = () => {
      if (isMouseDown) {
        isMouseDown = false;
        handleEnd();
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);

      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

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
      const response = await fetch(`${API_BASE}/api/auth/me`, {
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
      const res = await fetch(`${API_BASE}/api${endpoint}`, config);
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

  const adminBottomLinks = [
    { view: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { view: 'students', label: 'Students', icon: GraduationCap },
    { view: 'teachers', label: 'Staff', icon: Users },
    { view: 'fees', label: 'Finance', icon: Wallet },
    { view: 'menu', label: 'Menu', icon: Menu }
  ];

  const teacherBottomLinks = [
    { view: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { view: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { view: 'marks-entry', label: 'Grades', icon: Award }
  ];

  const studentBottomLinks = [
    { view: 'profile', label: 'Profile', icon: GraduationCap }
  ];

  let bottomLinks = [];
  if (user?.role === 'admin') bottomLinks = adminBottomLinks;
  else if (user?.role === 'teacher') bottomLinks = teacherBottomLinks;
  else if (user?.role === 'student') bottomLinks = studentBottomLinks;

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
              <i className={`fa-solid ${t.type === 'success' ? 'fa-circle-check' :
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
            <div className={`dashboard-view ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
              <Sidebar
                activeView={activeView}
                sidebarCollapsed={sidebarCollapsed}
                toggleSidebarCollapse={toggleSidebarCollapse}
              />
              <div className="sidebar-overlay" onClick={handleContentClick}></div>
              <div className="main-content" onClick={handleContentClick}>
                <Header activeView={activeView} />
                <main className="content-body">
                  <div className="subview-panel">
                    {renderView()}
                  </div>
                </main>
              </div>
            </div>

            {/* Bottom Navigation Bar for Mobile */}
            {bottomLinks.length > 0 && (
              <div className="bottom-nav">
                {bottomLinks.map(link => {
                  const isActive = activeView === link.view;
                  const Icon = link.icon;

                  if (link.view === 'menu') {
                    return (
                      <button 
                        key={link.view} 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          document.querySelector('.sidebar')?.classList.toggle('open');
                        }}
                        className="bottom-nav-item"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        <Icon className="bottom-nav-icon" />
                        <span>{link.label}</span>
                      </button>
                    );
                  }

                  return (
                    <a 
                      key={link.view} 
                      href={`#${link.view}`} 
                      className={`bottom-nav-item ${isActive ? 'active' : ''}`}
                    >
                      <Icon className="bottom-nav-icon" />
                      <span>{link.label}</span>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </AuthContext.Provider>
    </ToastContext.Provider>
  );
}
