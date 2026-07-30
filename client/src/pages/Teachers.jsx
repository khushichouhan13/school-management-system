import React, { useState, useEffect, useContext } from 'react';
import { AuthContext, ToastContext } from '../App';
import Modal from '../components/Modal';

export default function Teachers() {
  const { request } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);

  const [teachers, setTeachers] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Add Faculty Member');
  const [teacherId, setTeacherId] = useState('');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [experience, setExperience] = useState(0);
  const [qualification, setQualification] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const res = await request('/teachers');
      if (res.success) setTeachers(res.teachers);
    } catch (e) {
      console.error(e);
    }
  };

  const openFormModal = async (editId = null) => {
    setTeacherId(editId || '');
    
    // Fetch curriculum dependencies
    try {
      const clRes = await request('/classes');
      const sbRes = await request('/classes/subjects');
      if (clRes.success) setClassesList(clRes.classes);
      if (sbRes.success) setSubjectsList(sbRes.subjects);

      if (editId) {
        setModalTitle('Edit Faculty Profile');
        const res = await request(`/teachers/${editId}`);
        if (res.success) {
          const t = res.teacher;
          setFullName(t.fullName);
          setEmail(t.email);
          setPhone(t.phone);
          setExperience(t.experience);
          setQualification(t.qualification);
          setSelectedSubjects(t.subjects.map(s => s._id));
          setSelectedClasses(t.classes.map(c => c._id));
        }
      } else {
        setModalTitle('Add Faculty Member');
        setFullName('');
        setEmail('');
        setPhone('');
        setExperience(0);
        setQualification('');
        setSelectedSubjects([]);
        setSelectedClasses([]);
      }
      setIsModalOpen(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      fullName,
      email,
      phone,
      experience: Number(experience),
      qualification,
      subjects: selectedSubjects,
      classes: selectedClasses
    };

    try {
      let res;
      if (teacherId) {
        res = await request(`/teachers/${teacherId}`, 'PUT', payload);
      } else {
        res = await request('/teachers', 'POST', payload);
      }

      if (res.success) {
        showToast(teacherId ? 'Faculty details saved!' : 'Faculty registered successfully!');
        setIsModalOpen(false);
        fetchTeachers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this faculty member? This de-assigns them from their classes.')) return;
    try {
      const res = await request(`/teachers/${id}`, 'DELETE');
      if (res.success) {
        showToast('Faculty deleted successfully', 'warning');
        fetchTeachers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMultipleSelect = (e, setter) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(o => o.value);
    setter(selectedOptions);
  };

  return (
    <div>
      <div className="glass-card">
        <div className="card-header-actions mb-4">
          <h3 className="card-title">Faculty Roster</h3>
          <button onClick={() => openFormModal()} className="btn btn-primary">
            <i className="fa-solid fa-plus"></i>
            <span>Add Teacher</span>
          </button>
        </div>

        {/* Teachers Grid */}
        <div className="teachers-grid">
          {teachers.length > 0 ? (
            teachers.map(t => {
              const nameLetter = t.fullName.charAt(0);
              const subNames = t.subjects.map(s => s.name).join(', ') || 'General Faculty';
              const classNames = t.classes.map(c => c.name).join(', ') || 'No classes assigned';
              
              return (
                <div key={t._id} className="teacher-card">
                  <div className="teacher-card-avatar">{nameLetter}</div>
                  <h4>{t.fullName}</h4>
                  <span className="teacher-qual">{t.qualification}</span>
                  <div className="teacher-meta-details">
                    <span><i className="fa-solid fa-book-open"></i> {subNames}</span>
                    <span><i className="fa-solid fa-chalkboard"></i> {classNames}</span>
                    <span><i className="fa-solid fa-briefcase"></i> {t.experience} Years Experience</span>
                    <span><i className="fa-solid fa-phone"></i> {t.phone}</span>
                    <span><i className="fa-solid fa-envelope"></i> {t.email}</span>
                  </div>
                  <div className="teacher-card-actions">
                    <button onClick={() => openFormModal(t._id)} className="btn-table-action btn-table-edit">
                      <i className="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button onClick={() => handleDelete(t._id)} className="btn-table-action btn-table-delete">
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-muted p-4 col-span-full">No faculty members registered.</p>
          )}
        </div>
      </div>

      {/* Roster form Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
        <form onSubmit={handleFormSubmit} className="modal-form">
          <div className="form-row-double">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>
          <div className="form-row-double">
            <div className="form-group">
              <label>Phone Number</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Teaching Experience (Years)</label>
              <input type="number" min="0" value={experience} onChange={e => setExperience(e.target.value)} required />
            </div>
          </div>
          <div className="form-group">
            <label>Academic Qualification</label>
            <input 
              type="text" 
              placeholder="e.g. M.Sc. in Physics, PhD in Math" 
              value={qualification}
              onChange={e => setQualification(e.target.value)}
              required 
            />
          </div>
          <div className="form-group">
            <label>Assign Subjects (Hold Ctrl to select multiple)</label>
            <select 
              multiple 
              rows="4" 
              value={selectedSubjects} 
              onChange={e => handleMultipleSelect(e, setSelectedSubjects)}
              className="form-control"
            >
              {subjectsList.map(s => (
                <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Assign Classes (Hold Ctrl to select multiple)</label>
            <select 
              multiple 
              rows="4" 
              value={selectedClasses} 
              onChange={e => handleMultipleSelect(e, setSelectedClasses)}
              className="form-control"
            >
              {classesList.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-indigo">Save Record</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
