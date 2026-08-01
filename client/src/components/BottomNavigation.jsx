import React, { useContext } from 'react';
import { AuthContext } from '../App';
import { LayoutDashboard, GraduationCap, Users, Wallet, CalendarCheck, Award, Menu } from 'lucide-react';

export default function BottomNavigation({ activeView }) {
  const { user } = useContext(AuthContext);

  if (!user) return null;

  const adminTabs = [
    { view: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { view: 'students', label: 'Students', icon: GraduationCap },
    { view: 'teachers', label: 'Faculty', icon: Users },
    { view: 'fees', label: 'Finance', icon: Wallet }
  ];

  const teacherTabs = [
    { view: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { view: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { view: 'marks-entry', label: 'Grades', icon: Award }
  ];

  const studentTabs = [
    { view: 'profile', label: 'Profile', icon: GraduationCap }
  ];

  let tabs = [];
  if (user.role === 'admin') tabs = adminTabs;
  else if (user.role === 'teacher') tabs = teacherTabs;
  else if (user.role === 'student') tabs = studentTabs;

  const toggleSidebarMobile = (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.querySelector('.sidebar')?.classList.toggle('open');
  };

  return (
    <nav className="bottom-nav-bar">
      <ul className="bottom-nav-links">
        {tabs.map(tab => {
          const isActive = activeView === tab.view;
          const Icon = tab.icon;
          return (
            <li key={tab.view} className={`bottom-nav-item ${isActive ? 'active' : ''}`}>
              <a href={`#${tab.view}`}>
                <Icon size={18} />
                <span>{tab.label}</span>
              </a>
            </li>
          );
        })}
        {/* Menu Tab to toggle full sidebar drawer */}
        <li className="bottom-nav-item">
          <a href="#menu" onClick={toggleSidebarMobile}>
            <Menu size={18} />
            <span>Menu</span>
          </a>
        </li>
      </ul>
    </nav>
  );
}
