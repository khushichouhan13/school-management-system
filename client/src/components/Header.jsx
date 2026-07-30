import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../App';

export default function Header({ activeView }) {
  const { user, theme, setTheme } = useContext(AuthContext);
  const [timeStr, setTimeStr] = useState('--:-- --');

  // Sync clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timePart = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const datePart = now.toLocaleDateString([], { month: 'short', day: 'numeric' });
      setTimeStr(`${timePart} | ${datePart}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const titleMap = {
    overview: 'Overview Dashboard',
    students: 'Student Directory',
    teachers: 'Faculty Directory',
    classes: 'Class & Curriculum Management',
    fees: 'Student Fee accounts',
    exams: 'Scheduled Exams',
    attendance: 'Daily Roll Call Register',
    'marks-entry': 'Result Grade Sheet',
    profile: 'Student Profile Summary'
  };

  const nameLetter = (user?.profile?.fullName || 'Admin').charAt(0);
  const mockAvatar = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%236366f1'><circle cx='50' cy='50' r='50'/><text x='50' y='60' font-family='sans-serif' font-weight='bold' font-size='40' fill='white' text-anchor='middle'>${nameLetter}</text></svg>`;
  const avatarUrl = user?.profile?.profileImage || mockAvatar;

  const toggleSidebarMobile = (e) => {
    e.stopPropagation();
    document.querySelector('.sidebar').classList.toggle('open');
  };

  return (
    <header className="top-header">
      <div className="header-left">
        <button className="sidebar-toggle-btn" onClick={toggleSidebarMobile}>
          <i class="fa-solid fa-bars"></i>
        </button>
        <h2 className="view-title">{titleMap[activeView] || 'EduNex ERP'}</h2>
      </div>
      <div className="header-right">
        <div className="system-time">
          <i className="fa-regular fa-clock"></i>
          <span>{timeStr}</span>
        </div>
        
        <button 
          type="button" 
          className="btn-theme-toggle" 
          onClick={toggleTheme} 
          title="Toggle Light/Dark Theme"
        >
          <i className={theme === 'light' ? 'fa-solid fa-sun' : 'fa-solid fa-moon'}></i>
        </button>

        <div className="header-icon-badge">
          <i className="fa-regular fa-bell"></i>
          <span className="dot"></span>
        </div>
        <div className="header-profile-quick">
          <img src={avatarUrl} alt="Avatar" />
        </div>
      </div>
    </header>
  );
}
