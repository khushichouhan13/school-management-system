import React, { useState, useEffect, useContext } from 'react';
import { AuthContext, ToastContext } from '../App';
import Modal from '../components/Modal';

export default function Exams() {
  const { request } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);

  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form fields
  const [examName, setExamName] = useState('');
  const [classId, setClassId] = useState('');
  const [examDate, setExamDate] = useState('');
  const [subjectsConfig, setSubjectsConfig] = useState([]);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const res = await request('/exams');
      if (res.success) setExams(res.exams);
    } catch (e) {
      console.error(e);
    }
  };

  const openFormModal = async () => {
    setExamName('');
    setClassId('');
    setExamDate('');
    setSubjectsConfig([]);
    
    try {
      const res = await request('/classes');
      if (res.success) setClasses(res.classes);
      setIsModalOpen(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleClassChange = async (e) => {
    const selectedClassId = e.target.value;
    setClassId(selectedClassId);
    setSubjectsConfig([]);
    if (!selectedClassId) return;

    try {
      const res = await request(`/classes/${selectedClassId}`);
      if (res.success) {
        const subjects = res.class.subjects || [];
        const initialConfig = subjects.map(sub => ({
          subjectId: sub._id,
          name: sub.name,
          code: sub.code,
          maxMarks: 100 // default
        }));
        setSubjectsConfig(initialConfig);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarksChange = (subjectId, val) => {
    setSubjectsConfig(prev => prev.map(sub => {
      if (sub.subjectId === subjectId) {
        return { ...sub, maxMarks: Number(val) };
      }
      return sub;
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (subjectsConfig.length === 0) {
      showToast('Select a class containing active curriculum subjects first.', 'warning');
      return;
    }

    const payload = {
      name: examName,
      classId,
      date: examDate,
      subjects: subjectsConfig.map(s => ({
        subjectId: s.subjectId,
        maxMarks: s.maxMarks
      }))
    };

    try {
      const res = await request('/exams', 'POST', payload);
      if (res.success) {
        showToast('Examination scheduled successfully!');
        setIsModalOpen(false);
        fetchExams();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="glass-card">
        <div className="card-header-actions mb-4">
          <h3>Scheduled Examinations</h3>
          <button onClick={openFormModal} className="btn btn-primary">
            <i className="fa-solid fa-calendar-plus"></i> Schedule Exam
          </button>
        </div>

        {/* Data Table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Exam Name</th>
                <th>Target Class</th>
                <th>Scheduled Date</th>
                <th>Subjects Configured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.length > 0 ? (
                exams.map(exam => {
                  const dateFormatted = new Date(exam.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                  const subsText = exam.subjects.map(s => `${s.subjectId?.name || 'Subject'} (${s.maxMarks}m)`).join(', ');

                  return (
                    <tr key={exam._id}>
                      <td><strong>{exam.name}</strong></td>
                      <td>Class: {exam.classId?.name || ''}</td>
                      <td><i className="fa-regular fa-calendar"></i> {dateFormatted}</td>
                      <td><span className="text-xs text-secondary">{subsText}</span></td>
                      <td>
                        <span className="text-muted text-xs"><i className="fa-solid fa-check-double text-emerald"></i> Active</span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="text-center text-muted">No scheduled examinations found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Exam Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule New Examination">
        <form onSubmit={handleFormSubmit} className="modal-form">
          <div className="form-group">
            <label>Exam Name</label>
            <input 
              type="text" 
              value={examName} 
              onChange={e => setExamName(e.target.value)} 
              placeholder="e.g. Final Semester Exam 2026" 
              required 
            />
          </div>
          <div className="form-row-double">
            <div className="form-group">
              <label>Target Class</label>
              <select value={classId} onChange={handleClassChange} className="form-control" required>
                <option value="">-- Select Class --</option>
                {classes.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Exam Date</label>
              <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label className="mb-2 block font-medium text-sm">Configure Subjects & Max Marks</label>
            <div className="exam-subjects-list exam-subjects-config-list">
              {subjectsConfig.length > 0 ? (
                subjectsConfig.map(s => (
                  <div key={s.subjectId} className="exam-subject-row">
                    <span>{s.name} ({s.code})</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label className="text-xs text-muted">Max Marks:</label>
                      <input 
                        type="number" 
                        className="form-control exam-subject-marks" 
                        min="10" 
                        max="100" 
                        value={s.maxMarks} 
                        onChange={e => handleMarksChange(s.subjectId, e.target.value)}
                        style={{ maxWidth: '80px', padding: '6px 10px', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}
                        required 
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted text-xs">Please select a class first to configure subjects.</p>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-indigo">Schedule Exam</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
