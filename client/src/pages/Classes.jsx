import React, { useState, useEffect, useContext } from 'react';
import { AuthContext, ToastContext } from '../App';
import Modal from '../components/Modal';

export default function Classes() {
  const { request } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);

  // Modals status
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);

  // Form fields Class
  const [className, setClassName] = useState('');
  const [classSections, setClassSections] = useState('');
  const [classTeacherId, setClassTeacherId] = useState('');
  const [classSubjects, setClassSubjects] = useState([]);

  // Form fields Subject
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const clRes = await request('/classes');
      const sbRes = await request('/classes/subjects');
      const teRes = await request('/teachers');
      
      if (clRes.success) setClasses(clRes.classes);
      if (sbRes.success) setSubjects(sbRes.subjects);
      if (teRes.success) setTeachers(teRes.teachers);
    } catch (e) {
      console.error(e);
    }
  };

  const openClassModal = () => {
    setClassName('');
    setClassSections('A, B');
    setClassTeacherId('');
    setClassSubjects([]);
    setIsClassModalOpen(true);
  };

  const handleClassSubmit = async (e) => {
    e.preventDefault();
    const sections = classSections.split(',').map(s => s.trim().toUpperCase());
    const payload = {
      name: className,
      sections,
      classTeacherId: classTeacherId || null,
      subjects: classSubjects
    };

    try {
      const res = await request('/classes', 'POST', payload);
      if (res.success) {
        showToast('Class created successfully!');
        setIsClassModalOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteClass = async (id) => {
    if (!confirm('Are you sure you want to delete this class? This affects students enrolled.')) return;
    try {
      const res = await request(`/classes/${id}`, 'DELETE');
      if (res.success) {
        showToast('Class deleted', 'warning');
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openSubjectModal = () => {
    setSubjectName('');
    setSubjectCode('');
    setIsSubjectModalOpen(true);
  };

  const handleSubjectSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: subjectName,
      code: subjectCode.toUpperCase()
    };

    try {
      const res = await request('/classes/subjects', 'POST', payload);
      if (res.success) {
        showToast('Subject catalogued successfully!');
        setIsSubjectModalOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!confirm('Are you sure you want to remove this subject from the syllabus?')) return;
    try {
      const res = await request(`/classes/subjects/${id}`, 'DELETE');
      if (res.success) {
        showToast('Subject deleted', 'warning');
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMultipleSelect = (e, setter) => {
    const selected = Array.from(e.target.selectedOptions).map(o => o.value);
    setter(selected);
  };

  return (
    <div>
      <div className="class-dashboard-grid">
        {/* Left Card: Classes list */}
        <div className="glass-card">
          <div className="card-header-actions mb-4">
            <h3>Classes List</h3>
            <button onClick={openClassModal} className="btn btn-primary btn-sm">
              <i className="fa-solid fa-plus"></i> New Class
            </button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Class Name</th>
                  <th>Sections</th>
                  <th>Class Teacher</th>
                  <th>Subjects Count</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.map(c => (
                  <tr key={c._id}>
                    <td><strong>{c.name}</strong></td>
                    <td>{c.sections.join(', ')}</td>
                    <td>{c.classTeacherId?.fullName || <span className="text-rose text-xs">Unassigned</span>}</td>
                    <td><span className="badge badge-indigo">{c.subjects?.length || 0} Subjects</span></td>
                    <td>
                      <button onClick={() => handleDeleteClass(c._id)} className="btn-table-action btn-table-delete">
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Card: Subjects catalog */}
        <div className="glass-card">
          <div className="card-header-actions mb-4">
            <h3>Curriculum Subjects</h3>
            <button onClick={openSubjectModal} className="btn btn-outline btn-sm">
              <i className="fa-solid fa-plus"></i> Add Subject
            </button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject Code</th>
                  <th>Subject Name</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map(s => (
                  <tr key={s._id}>
                    <td><code className="text-violet font-bold">{s.code}</code></td>
                    <td><strong>{s.name}</strong></td>
                    <td>
                      <button onClick={() => handleDeleteSubject(s._id)} className="btn-table-action btn-table-delete">
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Class creation Modal */}
      <Modal isOpen={isClassModalOpen} onClose={() => setIsClassModalOpen(false)} title="Create Class">
        <form onSubmit={handleClassSubmit} className="modal-form">
          <div className="form-group">
            <label>Class Name</label>
            <input type="text" value={className} onChange={e => setClassName(e.target.value)} placeholder="e.g. Class 10" required />
          </div>
          <div className="form-group">
            <label>Sections (Comma separated)</label>
            <input type="text" value={classSections} onChange={e => setClassSections(e.target.value)} placeholder="e.g. A, B" required />
          </div>
          <div className="form-group">
            <label>Assign Class Teacher</label>
            <select value={classTeacherId} onChange={e => setClassTeacherId(e.target.value)} className="form-control">
              <option value="">-- No Class Teacher --</option>
              {teachers.map(t => (
                <option key={t._id} value={t._id}>{t.fullName}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Select Subjects (Hold Ctrl to select multiple)</label>
            <select 
              multiple 
              rows="5" 
              value={classSubjects} 
              onChange={e => handleMultipleSelect(e, setClassSubjects)}
              className="form-control"
            >
              {subjects.map(s => (
                <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setIsClassModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-indigo">Create Class</button>
          </div>
        </form>
      </Modal>

      {/* Subject creation Modal */}
      <Modal isOpen={isSubjectModalOpen} onClose={() => setIsSubjectModalOpen(false)} title="Add Curriculum Subject">
        <form onSubmit={handleSubjectSubmit} className="modal-form">
          <div className="form-group">
            <label>Subject Name</label>
            <input type="text" value={subjectName} onChange={e => setSubjectName(e.target.value)} placeholder="e.g. Chemistry" required />
          </div>
          <div className="form-group">
            <label>Subject Code</label>
            <input type="text" value={subjectCode} onChange={e => setSubjectCode(e.target.value)} placeholder="e.g. CHEM101" required />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setIsSubjectModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-indigo">Create Subject</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
