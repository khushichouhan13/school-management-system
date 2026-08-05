import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../App';
import { Menu, Clock, Sun, Moon } from 'lucide-react';

export default function Header({ activeView }) {
  const { theme, setTheme } = useContext(AuthContext);
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
    overview: 'Dashboard',
    students: 'Student Directory',
    teachers: 'Faculty Directory',
    classes: 'Class & Curriculum Management',
    fees: 'Student Fee Accounts',
    exams: 'Scheduled Exams',
    attendance: 'Daily Roll Call Register',
    'marks-entry': 'Result Grade Sheet',
    profile: 'Student Profile Summary'
  };

  const toggleSidebarMobile = (e) => {
    e.stopPropagation();
    document.querySelector('.sidebar')?.classList.toggle('open');
  };

  return (
    <header className="top-header">
      <div className="header-left">
        <button className="sidebar-toggle-btn" onClick={toggleSidebarMobile}>
          <Menu size={22} />
        </button>
        <h2 className="view-title">{titleMap[activeView] || 'EduNex ERP'}</h2>
      </div>
      
      <div className="header-right">
        <div className="system-time">
          <Clock size={16} />
          <span>{timeStr}</span>
        </div>
        
        <button 
          type="button" 
          className="btn-theme-toggle" 
          onClick={toggleTheme} 
          title="Toggle Light/Dark Theme"
        >
          {theme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
