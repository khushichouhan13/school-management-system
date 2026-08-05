import React, { useContext } from 'react';
import { AuthContext } from '../App';
import { 
  LayoutDashboard, 
  GraduationCap, 
  Users, 
  BookOpen, 
  Wallet, 
  FileText, 
  CalendarCheck, 
  Award,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';

export default function Sidebar({ activeView, sidebarCollapsed, toggleSidebarCollapse }) {
  const { user, logout } = useContext(AuthContext);

  const adminLinks = [
    { view: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { view: 'students', label: 'Students', icon: GraduationCap },
    { view: 'teachers', label: 'Faculty Staff', icon: Users },
    { view: 'classes', label: 'Class & subjects', icon: BookOpen },
    { view: 'fees', label: 'Finance ledger', icon: Wallet },
    { view: 'exams', label: 'Exam schedule', icon: FileText },
    { view: 'attendance', label: 'Roll Call Register', icon: CalendarCheck },
    { view: 'marks-entry', label: 'Grade Entry', icon: Award }
  ];

  const teacherLinks = [
    { view: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { view: 'attendance', label: 'Mark Attendance', icon: CalendarCheck },
    { view: 'marks-entry', label: 'Grade book (Marks)', icon: Award }
  ];

  const studentLinks = [
    { view: 'profile', label: 'My Profile', icon: GraduationCap }
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
    <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-logo-area">
          <GraduationCap className="brand-icon" />
          <span className="brand-text">EDUNEX</span>
        </div>
        
        {/* Collapse Toggle Button (Desktop Only) */}
        <button 
          type="button" 
          className="btn-sidebar-collapse" 
          onClick={toggleSidebarCollapse}
          title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Profile Card */}
      <div className="sidebar-user" data-tooltip={user?.profile?.fullName || 'Administrator'}>
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
            const Icon = link.icon;
            return (
              <li key={link.view} className={`nav-item ${isActive ? 'active' : ''}`}>
                <a href={`#${link.view}`} onClick={closeSidebar} data-tooltip={link.label}>
                  <Icon className="nav-icon" />
                  <span className="nav-label">{link.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer / Logout */}
      <div className="sidebar-footer">
        <button onClick={logout} className="btn btn-outline btn-block btn-logout" data-tooltip="Log Out">
          <LogOut size={18} />
          <span className="logout-text">Log Out</span>
        </button>
      </div>
    </aside>
  );
}
