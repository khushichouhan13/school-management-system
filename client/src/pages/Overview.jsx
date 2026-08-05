import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../App';

export default function Overview() {
  const { user, request } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await request('/dashboard/stats');
      if (res.success) {
        setStats(res.stats);
        setActivities(res.recentActivities);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getCollectionPercentage = () => {
    if (!stats) return 0;
    const total = stats.feeCollection + stats.pendingFees;
    return total > 0 ? Math.round((stats.feeCollection / total) * 100) : 0;
  };

  return (
    <div>
      {/* Stats Counters Grid */}
      <div className="stats-grid">
        <div className="stat-card card-students card-glow-indigo">
          <div className="stat-icon"><i className="fa-solid fa-user-graduate"></i></div>
          <div className="stat-content">
            <span className="stat-label">Total Enrolled Students</span>
            <h3>{stats ? stats.totalStudents : '--'}</h3>
          </div>
        </div>
        <div className="stat-card card-faculty card-glow-violet">
          <div className="stat-icon"><i className="fa-solid fa-chalkboard-user"></i></div>
          <div className="stat-content">
            <span className="stat-label">Total Faculty Staff</span>
            <h3>{stats ? stats.totalTeachers : '--'}</h3>
          </div>
        </div>
        <div className="stat-card card-classes card-glow-pink">
          <div className="stat-icon"><i className="fa-solid fa-school"></i></div>
          <div className="stat-content">
            <span className="stat-label">Active Classes</span>
            <h3>{stats ? stats.totalClasses : '--'}</h3>
          </div>
        </div>
        <div className="stat-card card-attendance card-glow-emerald">
          <div className="stat-icon"><i className="fa-solid fa-calendar-check"></i></div>
          <div className="stat-content">
            <span className="stat-label">Daily Attendance Rate</span>
            <h3>{stats ? `${stats.attendancePercentage}%` : '--%'}</h3>
          </div>
        </div>
      </div>

      {/* Double Column Dashboard Layout */}
      <div className="dashboard-columns mt-4">
        {/* Left Side Column */}
        <div className="column-left flex-grow-2">
          {/* Collection Status (Admin Only) */}
          {user?.role === 'admin' && (
            <div className="glass-card card-fee mb-4">
              <div className="card-header">
                <h3><i className="fa-solid fa-wallet"></i> Fee Collection Dashboard</h3>
                <span className="badge badge-indigo">Term 2026</span>
              </div>
              <div className="card-body">
                <div className="finance-progress-summary">
                  <div className="finance-indicator">
                    <span className="ind-label">Collected Fees</span>
                    <h2 className="currency-green">₹{stats ? stats.feeCollection.toLocaleString() : '0'}</h2>
                  </div>
                  <div className="finance-separator"></div>
                  <div className="finance-indicator">
                    <span className="ind-label">Pending Dues</span>
                    <h2 className="currency-red">₹{stats ? stats.pendingFees.toLocaleString() : '0'}</h2>
                  </div>
                </div>

                <div className="progress-bar-container">
                  <div className="progress-bar-labels">
                    <span>Collection Target</span>
                    <span>{getCollectionPercentage()}%</span>
                  </div>
                  <div className="progress-bar-track">
                    <div 
                      className="progress-bar-fill fill-gradient-emerald" 
                      style={{ width: `${getCollectionPercentage()}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* School Announcement Panel */}
          <div className="glass-card">
            <div className="card-header">
              <h3><i className="fa-solid fa-bullhorn"></i> Campus Announcements</h3>
              <button className="btn btn-text btn-xs text-indigo">View All</button>
            </div>
            <div className="card-body">
              <div className="announcement-list">
                <div className="announcement-item">
                  <div className="announcement-meta">
                    <span className="announcement-tag tag-high">Urgent</span>
                    <span className="announcement-date">July 28, 2026</span>
                  </div>
                  <h4>Mid-Term Report Cards Published</h4>
                  <p>Student report cards for Mid-Term Exams 2026 have been generated and are now visible on student and parent accounts.</p>
                </div>
                <div className="announcement-item">
                  <div className="announcement-meta">
                    <span className="announcement-tag tag-info">Event</span>
                    <span className="announcement-date">July 25, 2026</span>
                  </div>
                  <h4>Annual Science Fair Registration</h4>
                  <p>Registration for the 2026 Science Fair closes next Monday. Students can register projects through their class teachers.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Column: Activities Log */}
        <div className="column-right flex-grow-1">
          <div className="glass-card h-full">
            <div className="card-header">
              <h3><i className="fa-solid fa-clock-rotate-left"></i> System Activity Log</h3>
            </div>
            <div className="card-body px-0">
              <div className="activity-timeline">
                {activities.length > 0 ? (
                  activities.map(act => {
                    const timeFormatted = new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date(act.time).toLocaleDateString([], { month: 'short', day: 'numeric' });
                    return (
                      <div key={act.id} className={`activity-item type-${act.type}`}>
                        <span className="activity-time"><i className="fa-regular fa-clock"></i> {timeFormatted}</span>
                        <h5>{act.title}</h5>
                        <p>{act.description}</p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-muted p-4">No recent activities.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
