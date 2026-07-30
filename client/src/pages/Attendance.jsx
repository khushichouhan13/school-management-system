import React, { useState, useEffect, useContext } from 'react';
import { AuthContext, ToastContext } from '../App';

export default function Attendance() {
  const { request } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);

  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substring(0, 10));

  const [attendanceSheet, setAttendanceSheet] = useState(null);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await request('/classes');
      if (res.success) {
        setClasses(res.classes);
        if (res.classes.length > 0) setSelectedClass(res.classes[0]._id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoadSheet = async () => {
    if (!selectedClass || !selectedSection || !selectedDate) {
      showToast('Please specify class, section, and date.', 'warning');
      return;
    }

    try {
      const res = await request(`/attendance?classId=${selectedClass}&section=${selectedSection}&date=${selectedDate}`);
      if (res.success) {
        setAttendanceSheet(res.attendance);
        // Normalize record structures
        const initialRecords = res.attendance.records.map(rec => ({
          studentId: rec.studentId._id || rec.studentId,
          fullName: rec.studentId.fullName,
          admissionNumber: rec.studentId.admissionNumber,
          status: rec.status
        }));
        setRecords(initialRecords);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setRecords(prev => prev.map(rec => {
      if (rec.studentId === studentId) {
        return { ...rec, status };
      }
      return rec;
    }));
  };

  const handlePresetAllPresent = () => {
    setRecords(prev => prev.map(rec => ({ ...rec, status: 'present' })));
    showToast('Preset all students to Present', 'info');
  };

  const handleSubmitAttendance = async () => {
    const payload = {
      date: selectedDate,
      classId: selectedClass,
      section: selectedSection,
      records: records.map(r => ({
        studentId: r.studentId,
        status: r.status
      }))
    };

    try {
      const res = await request('/attendance', 'POST', payload);
      if (res.success) {
        showToast('Daily Roll Call register saved successfully!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getClassName = () => {
    const cls = classes.find(c => c._id === selectedClass);
    return cls ? cls.name : '';
  };

  return (
    <div>
      <div className="glass-card">
        <div className="card-header mb-4">
          <h3>Roll Call Register</h3>
        </div>

        <div className="attendance-setup-bar">
          <div className="form-group mb-0 flex-grow-1">
            <label>Class</label>
            <select 
              value={selectedClass} 
              onChange={e => setSelectedClass(e.target.value)} 
              className="form-control"
            >
              {classes.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group mb-0 flex-grow-1">
            <label>Section</label>
            <select 
              value={selectedSection} 
              onChange={e => setSelectedSection(e.target.value)} 
              className="form-control"
            >
              <option value="A">Section A</option>
              <option value="B">Section B</option>
            </select>
          </div>
          <div className="form-group mb-0 flex-grow-1">
            <label>Date</label>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)} 
              className="form-control" 
            />
          </div>
          <button onClick={handleLoadSheet} className="btn btn-indigo align-self-end">
            <i className="fa-solid fa-rotate"></i> Load Sheet
          </button>
        </div>

        {/* Attendance roll sheet list */}
        {attendanceSheet && (
          <div className="attendance-sheet-wrapper mt-4">
            <div className="card-subtitle-divider mb-3">
              <h4 className="sheet-title">
                Attendance Sheet: <span>{getClassName()} - Section {selectedSection}</span>
              </h4>
              <div className="sheet-actions">
                <button onClick={handlePresetAllPresent} className="btn btn-xs btn-outline">Preset All Present</button>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Adm No</th>
                    <th>Student Name</th>
                    <th className="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(rec => (
                    <tr key={rec.studentId}>
                      <td><strong className="text-secondary">{rec.admissionNumber}</strong></td>
                      <td><strong>{rec.fullName}</strong></td>
                      <td>
                        <div className="attendance-status-radios">
                          <label>
                            <input 
                              type="radio" 
                              name={`status-${rec.studentId}`} 
                              value="present" 
                              checked={rec.status === 'present'} 
                              onChange={() => handleStatusChange(rec.studentId, 'present')} 
                              className="radio-present" 
                            />
                            <span className="status-label-btn label-present">Present</span>
                          </label>
                          <label>
                            <input 
                              type="radio" 
                              name={`status-${rec.studentId}`} 
                              value="absent" 
                              checked={rec.status === 'absent'} 
                              onChange={() => handleStatusChange(rec.studentId, 'absent')} 
                              className="radio-absent" 
                            />
                            <span className="status-label-btn label-absent">Absent</span>
                          </label>
                          <label>
                            <input 
                              type="radio" 
                              name={`status-${rec.studentId}`} 
                              value="late" 
                              checked={rec.status === 'late'} 
                              onChange={() => handleStatusChange(rec.studentId, 'late')} 
                              className="radio-late" 
                            />
                            <span className="status-label-btn label-late">Late</span>
                          </label>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="action-footer mt-4">
              <button onClick={handleSubmitAttendance} className="btn btn-emerald">
                <i className="fa-solid fa-cloud-arrow-up"></i> Save Attendance Sheet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
