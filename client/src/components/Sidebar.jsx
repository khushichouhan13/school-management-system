import React, { useContext } from 'react';
import { AuthContext } from '../App';

export default function Sidebar({ activeView }) {
  const { user, logout } = useContext(AuthContext);

  const adminLinks = [
    { view: 'overview', label: 'Overview', icon: 'fa-solid fa-chart-pie' },
    { view: 'students', label: 'Students', icon: 'fa-solid fa-user-graduate' },
    { view: 'teachers', label: 'Faculty Staff', icon: 'fa-solid fa-chalkboard-user' },
    { view: 'classes', label: 'Class & subjects', icon: 'fa-solid fa-school' },
    { view: 'fees', label: 'Finance ledger', icon: 'fa-solid fa-wallet' },
    { view: 'exams', label: 'Exam schedule', icon: 'fa-solid fa-file-invoice' },
    { view: 'attendance', label: 'Roll Call Register', icon: 'fa-solid fa-calendar-check' },
    { view: 'marks-entry', label: 'Grade Entry', icon: 'fa-solid fa-medal' }
  ];

  const teacherLinks = [
    { view: 'overview', label: 'Overview', icon: 'fa-solid fa-chart-pie' },
    { view: 'attendance', label: 'Mark Attendance', icon: 'fa-solid fa-calendar-check' },
    { view: 'marks-entry', label: 'Grade book (Marks)', icon: 'fa-solid fa-medal' }
  ];

  const studentLinks = [
    { view: 'profile', label: 'My Profile', icon: 'fa-solid fa-user-graduate' }
  ];

  let links = [];
  if (user?.role === 'admin') links = adminLinks;
  else if (user?.role === 'teacher') links = teacherLinks;
  else if (user?.role === 'student') links = studentLinks;

  const nameLetter = (user?.profile?.fullName || 'Admin').charAt(0);
  const mockAvatar = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%236366f1'><circle cx='50' cy='50' r='50'/><text x='50' y='60' font-family='sans-serif' font-weight='bold' font-size='40' fill='white' text-anchor='middle'>${nameLetter}</text></svg>`;
  const avatarUrl = user?.profile?.profileImage || mockAvatar;
  const roleDisplay = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Guest';

  const closeSidebar = () => {
    document.querySelector('.sidebar')?.classList.remove('open');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <i className="fa-solid fa-graduation-cap brand-icon"></i>
        <span className="brand-text">EDUNEX</span>
      </div>

      {/* Profile Card */}
      <div className="sidebar-user">
        <div className="user-avatar-wrapper">
          <img src={avatarUrl} alt="User Avatar" />
        </div>
        <div className="user-meta">
          <h4>{user?.profile?.fullName || 'Administrator'}</h4>
          <span className="badge badge-role">{roleDisplay}</span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="sidebar-nav">
        <ul className="nav-links">
          {links.map(link => {
            const isActive = activeView === link.view;
            return (
              <li key={link.view} className={`nav-item ${isActive ? 'active' : ''}`}>
                <a href={`#${link.view}`} onClick={closeSidebar}>
                  <i className={link.icon}></i>
                  <span>{link.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer / Logout */}
      <div className="sidebar-footer">
        <button onClick={logout} className="btn btn-outline btn-block btn-logout">
          <i className="fa-solid fa-arrow-right-from-bracket"></i>
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
