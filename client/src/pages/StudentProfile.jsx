import React, { useState, useEffect, useContext } from 'react';
import { AuthContext, ToastContext } from '../App';
import Modal from '../components/Modal';

export default function StudentProfile() {
  const { user, request } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);

  const [attStats, setAttStats] = useState(null);
  const [feeLedger, setFeeLedger] = useState(null);
  const [reportCards, setReportCards] = useState([]);
  
  // Printable view states
  const [isRcModalOpen, setIsRcModalOpen] = useState(false);
  const [selectedReportCard, setSelectedReportCard] = useState(null);

  const studentProfile = user?.profile;

  useEffect(() => {
    if (studentProfile) {
      fetchStudentStats();
    }
  }, [studentProfile]);

  const fetchStudentStats = async () => {
    try {
      // 1. Attendance stats
      const attRes = await request(`/attendance/student/${studentProfile._id}`);
      if (attRes.success) setAttStats(attRes.stats);

      // 2. Fee ledger status
      const feeRes = await request(`/fees?search=${studentProfile._id}`);
      if (feeRes.success && feeRes.fees.length > 0) setFeeLedger(feeRes.fees[0]);

      // 3. Academic reports
      const repRes = await request(`/exams/results?studentId=${studentProfile._id}`);
      if (repRes.success) setReportCards(repRes.results);
    } catch (e) {
      console.error(e);
    }
  };

  const openReportCardViewer = async (examId) => {
    try {
      const res = await request(`/exams/results?examId=${examId}&studentId=${studentProfile._id}`);
      const cardRes = await request(`/exams/reportcard/${studentProfile._id}`);
      if (res.success && cardRes.success && res.results.length > 0) {
        setSelectedReportCard({
          result: res.results[0],
          className: cardRes.class
        });
        setIsRcModalOpen(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!studentProfile) return <p className="text-center text-muted">No student profile bound to this account.</p>;

  const nameLetter = studentProfile.fullName.charAt(0);
  const mockAvatar = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%236366f1'><circle cx='50' cy='50' r='50'/><text x='50' y='60' font-family='sans-serif' font-weight='bold' font-size='40' fill='white' text-anchor='middle'>${nameLetter}</text></svg>`;
  const avatarUrl = studentProfile.profileImage || mockAvatar;

  const attPct = attStats ? attStats.percentage : 0;
  const pendingFees = feeLedger ? (feeLedger.amountTotal - feeLedger.amountPaid) : 0;

  return (
    <div>
      <div className="student-profile-container">
        
        {/* Left Column - Profile Card */}
        <div className="glass-card student-info-card">
          <div className="profile-avatar-wrapper">
            <img src={avatarUrl} alt="Student Avatar" />
          </div>
          <h2>{studentProfile.fullName}</h2>
          <span className="badge badge-violet">{studentProfile.admissionNumber}</span>

          <div className="profile-info-list mt-4">
            <div className="profile-info-item">
              <span className="info-label"><i className="fa-solid fa-graduation-cap"></i> Academic Class</span>
              <strong>{studentProfile.classId?.name || 'Class'} (Section {studentProfile.section})</strong>
            </div>
            <div className="profile-info-item">
              <span className="info-label"><i className="fa-solid fa-envelope"></i> Student Email</span>
              <span>{studentProfile.email}</span>
            </div>
            <div className="profile-info-item">
              <span className="info-label"><i className="fa-solid fa-cake-candles"></i> Date of Birth</span>
              <span>{new Date(studentProfile.dob).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="profile-info-item">
              <span className="info-label"><i className="fa-solid fa-user-group"></i> Parent/Guardian</span>
              <strong>{studentProfile.parentName}</strong>
            </div>
            <div className="profile-info-item">
              <span className="info-label"><i className="fa-solid fa-phone"></i> Parent Contact</span>
              <span>{studentProfile.contactNumber}</span>
            </div>
            <div className="profile-info-item">
              <span className="info-label"><i className="fa-solid fa-location-dot"></i> Home Address</span>
              <p className="info-text text-muted">{studentProfile.address}</p>
            </div>
          </div>
        </div>

        {/* Right Column - Performance Metrics */}
        <div className="student-meta-columns">
          
          {/* Top Row: Attendance Meter & Fee Summary */}
          <div className="double-panel-row mb-4">
            {/* Attendance Meter */}
            <div className="glass-card student-perf-card">
              <div className="card-header">
                <h3><i className="fa-solid fa-calendar-check"></i> Attendance Record</h3>
              </div>
              <div className="attendance-meter-body">
                <div className="attendance-circular-gauge">
                  <svg viewBox="0 0 36 36" className="circular-chart indigo">
                    <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path 
                      className="circle" 
                      strokeDasharray={`${attPct}, 100`} 
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                    />
                    <text x="18" y="20.35" className="percentage">{attPct}%</text>
                  </svg>
                </div>
                <div className="attendance-stat-list">
                  <div className="att-counter">
                    <span className="lbl-present">Present</span>
                    <strong>{attStats ? attStats.present : 0}</strong>
                  </div>
                  <div className="att-counter">
                    <span className="lbl-absent">Absent</span>
                    <strong>{attStats ? attStats.absent : 0}</strong>
                  </div>
                  <div className="att-counter">
                    <span className="lbl-late">Late</span>
                    <strong>{attStats ? attStats.late : 0}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Fee status */}
            <div className="glass-card student-perf-card">
              <div className="card-header">
                <h3><i className="fa-solid fa-receipt"></i> Tuition Fees status</h3>
              </div>
              <div className="fee-meter-body">
                <div className="fee-status-visual">
                  <div className={`fee-status-indicator ${
                    feeLedger?.status === 'Paid' ? 'text-paid' :
                    feeLedger?.status === 'Partially Paid' ? 'text-partial' : 'text-pending'
                  }`}>
                    {feeLedger ? feeLedger.status : 'Pending'}
                  </div>
                </div>
                <div className="fee-breakdown-list">
                  <div className="fee-breakdown-row">
                    <span>Total Semester Fees:</span>
                    <strong>₹{feeLedger ? feeLedger.amountTotal.toLocaleString() : 0}</strong>
                  </div>
                  <div className="fee-breakdown-row">
                    <span>Amount Paid:</span>
                    <strong className="text-emerald">₹{feeLedger ? feeLedger.amountPaid.toLocaleString() : 0}</strong>
                  </div>
                  <div className="fee-breakdown-row font-bold">
                    <span>Balance Due:</span>
                    <strong className="text-rose">₹{pendingFees.toLocaleString()}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Academic Performance / Grade Sheets */}
          <div className="glass-card student-report-card-panel">
            <div className="card-header-actions mb-3">
              <h3><i className="fa-solid fa-award"></i> Academic Report Cards</h3>
            </div>
            <div className="report-cards-list">
              {reportCards.length > 0 ? (
                reportCards.map(result => {
                  const examName = result.examId?.name || 'Examination';
                  const points = `${result.obtainedTotal} / ${result.totalMarks} Marks`;
                  const score = `${result.percentage}% (${result.grade})`;
                  return (
                    <div key={result._id} className="report-card-row-item">
                      <div className="rc-details">
                        <h4>{examName}</h4>
                        <span>Aggregate: <strong>{score}</strong> | Scores: {points}</span>
                      </div>
                      <button 
                        onClick={() => openReportCardViewer(result.examId?._id)} 
                        className="btn btn-xs btn-primary"
                      >
                        <i className="fa-solid fa-file-pdf"></i> View & Print
                      </button>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-muted p-4">No report cards generated yet.</p>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Report Card Print Modal */}
      <Modal isOpen={isRcModalOpen} onClose={() => setIsRcModalOpen(false)} title="Report Card Viewer" className="print-friendly-modal">
        <div className="modal-header no-print" style={{ border: 'none', padding: '0 0 15px 0' }}>
          <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
            <button onClick={handlePrint} className="btn btn-outline btn-xs"><i className="fa-solid fa-print"></i> Print</button>
            <button onClick={() => setIsRcModalOpen(false)} className="btn btn-outline btn-xs"><i className="fa-solid fa-xmark"></i> Close</button>
          </div>
        </div>

        {selectedReportCard && (
          <div className="modal-body print-content">
            <div className="report-card-document">
              <div className="rc-doc-header">
                <div className="rc-doc-brand">
                  <i className="fa-solid fa-graduation-cap"></i>
                  <h2>EDUNEX ACADEMY</h2>
                </div>
                <div className="rc-doc-title">
                  <h3>OFFICIAL REPORT CARD</h3>
                  <span>Exam Term: <strong>{selectedReportCard.result.examId?.name}</strong></span>
                </div>
              </div>

              <div className="rc-doc-meta-info">
                <div className="rc-meta-column">
                  <div className="rc-meta-row"><span>Student Name:</span><strong>{studentProfile.fullName}</strong></div>
                  <div className="rc-meta-row"><span>Admission Number:</span><strong>{studentProfile.admissionNumber}</strong></div>
                  <div className="rc-meta-row"><span>Academic Class:</span><strong>{selectedReportCard.className} - Section {studentProfile.section}</strong></div>
                </div>
                <div className="rc-meta-column">
                  <div className="rc-meta-row"><span>Date Evaluated:</span><strong>{new Date(selectedReportCard.result.examId?.date).toLocaleDateString([], { month: 'long', year: 'numeric' })}</strong></div>
                  <div className="rc-meta-row"><span>Overall Status:</span><strong><span className="badge badge-success">COMPLETED</span></strong></div>
                </div>
              </div>

              <table className="rc-grades-table">
                <thead>
                  <tr>
                    <th>Subject Name</th>
                    <th>Subject Code</th>
                    <th>Maximum Marks</th>
                    <th>Obtained Marks</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedReportCard.result.marks.map(mark => (
                    <tr key={mark.subjectId?._id || mark.subjectId}>
                      <td><strong>{mark.subjectId?.name || 'Subject'}</strong></td>
                      <td><code>{mark.subjectId?.code || ''}</code></td>
                      <td>100</td>
                      <td><strong>{mark.obtainedMarks}</strong></td>
                      <td>
                        {mark.obtainedMarks >= 50 ? (
                          <span style={{ color: '#10b981', fontWeight: '600' }}>PASS</span>
                        ) : (
                          <span style={{ color: '#ef4444', fontWeight: '600' }}>FAIL</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="rc-total-summary-box">
                <div className="rc-sum-stat">
                  <span>Points Obtained</span>
                  <strong>{selectedReportCard.result.obtainedTotal} / {selectedReportCard.result.totalMarks}</strong>
                </div>
                <div className="rc-sum-stat">
                  <span>Percentage Score</span>
                  <strong>{selectedReportCard.result.percentage}%</strong>
                </div>
                <div className="rc-sum-stat">
                  <span>Aggregate Grade</span>
                  <strong className="grade-tag">{selectedReportCard.result.grade}</strong>
                </div>
              </div>

              <div className="rc-remarks-box">
                <h4>Faculty Evaluator Remarks</h4>
                <p>"{selectedReportCard.result.remarks || 'Student has demonstrated satisfactory progress in all standard curriculum objectives.'}"</p>
              </div>

              <div className="rc-doc-signatures">
                <div className="rc-sig-line">
                  <span>Class Teacher</span>
                </div>
                <div className="rc-sig-line">
                  <span>Academy Principal</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
