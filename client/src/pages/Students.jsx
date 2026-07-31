import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext, ToastContext } from '../App';
import Modal from '../components/Modal';

export default function Students() {
  const { request } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Outstanding Fee tracking state
  const [outstandingFees, setOutstandingFees] = useState({});

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('New Student Enrollment');
  const [studentId, setStudentId] = useState('');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('male');
  const [classId, setClassId] = useState('');
  const [section, setSection] = useState('A');
  const [parentName, setParentName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [address, setAddress] = useState('');

  // Debouncing search
  const debounceTimer = useRef(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [page, classFilter, sectionFilter]);

  const fetchClasses = async () => {
    try {
      const res = await request('/classes');
      if (res.success) setClasses(res.classes);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStudents = async (searchStr = search) => {
    try {
      const url = `/students?page=${page}&limit=10&search=${searchStr}&classId=${classFilter}&section=${sectionFilter}`;
      const res = await request(url);
      if (res.success) {
        setStudents(res.students);
        setPages(res.pages);
        setTotal(res.total);
        
        // Trigger background fee fetches
        res.students.forEach(s => {
          fetchStudentFeeBadge(s._id);
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStudentFeeBadge = async (studentId) => {
    try {
      const res = await request(`/fees?search=${studentId}`);
      if (res.success && res.fees.length > 0) {
        const ledger = res.fees[0];
        const outstanding = ledger.amountTotal - ledger.amountPaid;
        setOutstandingFees(prev => ({ ...prev, [studentId]: outstanding }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    setPage(1);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchStudents(val);
    }, 350);
  };

  const openEnrollModal = async (editId = null) => {
    setStudentId(editId || '');
    if (editId) {
      setModalTitle('Edit Student Details');
      try {
        const res = await request(`/students/${editId}`);
        if (res.success) {
          const s = res.student;
          setFullName(s.fullName);
          setAdmissionNumber(s.admissionNumber);
          setEmail(s.email);
          setDob(s.dob.substring(0, 10));
          setGender(s.gender);
          setClassId(s.classId?._id || '');
          setSection(s.section);
          setParentName(s.parentName);
          setContactNumber(s.contactNumber);
          setProfileImage(s.profileImage || '');
          setAddress(s.address);
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      setModalTitle('New Student Enrollment');
      setFullName('');
      setAdmissionNumber('');
      setEmail('');
      setDob('');
      setGender('male');
      setClassId(classes[0]?._id || '');
      setSection('A');
      setParentName('');
      setContactNumber('');
      setProfileImage('');
      setAddress('');
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      fullName,
      admissionNumber,
      email,
      dob,
      gender,
      classId,
      section,
      parentName,
      contactNumber,
      profileImage,
      address
    };

    try {
      let res;
      if (studentId) {
        res = await request(`/students/${studentId}`, 'PUT', payload);
      } else {
        res = await request('/students', 'POST', payload);
      }

      if (res.success) {
        showToast(studentId ? 'Student profile updated!' : 'Student registered successfully!');
        setIsModalOpen(false);
        fetchStudents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this student record? This deletes associated grades/credentials/ledgers.')) return;
    try {
      const res = await request(`/students/${id}`, 'DELETE');
      if (res.success) {
        showToast('Student deleted successfully', 'warning');
        fetchStudents();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getAvatarBg = (name) => {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4'];
    let hash = 0;
    const cleanName = name || 'Student';
    for (let i = 0; i < cleanName.length; i++) {
      hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const startIdx = total > 0 ? (page - 1) * 10 + 1 : 0;
  const endIdx = Math.min(page * 10, total);

  return (
    <div>
      {/* Title & Top Action Bar */}
      <div className="page-header mb-4">
        <div className="header-title-area">
          <h2 className="page-title">Students</h2>
          <span className="page-subtitle">{total} total registered students</span>
        </div>
        <div className="header-actions-area">
          <button className="btn-import" onClick={() => showToast('Import feature coming soon!')}>
            <i className="fa-solid fa-file-excel text-emerald"></i>
            <span>Import Excel / CSV</span>
          </button>
          <button onClick={() => openEnrollModal()} className="btn-add-student">
            <i className="fa-solid fa-plus"></i>
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Top 4 Cards Grid */}
      <div className="stats-grid mb-4">
        {/* Card 1: Plans Expiring */}
        <div className="stat-card card-expiring card-glow-warning">
          <div className="stat-card-left">
            <div className="icon-circle icon-circle-warning">
              <i className="fa-regular fa-clock"></i>
            </div>
            <div className="stat-card-info">
              <span className="stat-card-title">PLANS EXPIRING IN 7 DAYS</span>
              <span className="stat-badge badge-light-warning">Show</span>
            </div>
          </div>
          <h1 className="stat-card-number text-warning">0</h1>
        </div>

        {/* Card 2: Expired Plans */}
        <div className="stat-card card-expired card-glow-danger">
          <div className="stat-card-left">
            <div className="icon-circle icon-circle-danger">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div className="stat-card-info">
              <span className="stat-card-title">EXPIRED PLANS</span>
              <span className="stat-badge badge-light-danger">Show</span>
            </div>
          </div>
          <h1 className="stat-card-number text-danger">0</h1>
        </div>

        {/* Card 3: Left Students */}
        <div className="stat-card card-left-students card-glow-grey">
          <div className="stat-card-left">
            <div className="icon-circle icon-circle-grey">
              <i className="fa-regular fa-user"></i>
            </div>
            <div className="stat-card-info">
              <span className="stat-card-title">LEFT STUDENTS</span>
              <span className="stat-badge badge-light-grey">Show</span>
            </div>
          </div>
          <h1 className="stat-card-number text-grey">1</h1>
        </div>

        {/* Card 4: All Students */}
        <div className="stat-card card-all-students card-glow-primary">
          <div className="stat-card-left">
            <div className="icon-circle icon-circle-primary">
              <i className="fa-solid fa-users"></i>
            </div>
            <div className="stat-card-info">
              <span className="stat-card-title">ALL STUDENTS</span>
              <span className="stat-badge badge-primary-active">Active</span>
            </div>
          </div>
          <h1 className="stat-card-number text-primary">{total}</h1>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="glass-card">
        <div className="card-header-actions mb-4">
          <div className="search-filters">
            <div className="search-input-wrapper">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input 
                type="text" 
                placeholder="Search by name, phone, ID..." 
                value={search}
                onChange={handleSearchChange}
              />
            </div>
            <select 
              value={classFilter} 
              onChange={e => { setClassFilter(e.target.value); setPage(1); }} 
              className="form-control"
            >
              <option value="">All Classes</option>
              {classes.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            <select 
              value={sectionFilter} 
              onChange={e => { setSectionFilter(e.target.value); setPage(1); }} 
              className="form-control"
            >
              <option value="">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Adm. Number</th>
                <th>Full Name</th>
                <th>Class / Section</th>
                <th>Parent Name</th>
                <th>Outstanding Fees</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length > 0 ? (
                students.map(s => {
                  const balance = outstandingFees[s._id];
                  return (
                    <tr key={s._id}>
                      <td><strong className="text-indigo">{s.admissionNumber}</strong></td>
                      <td>
                        <div className="student-profile-cell">
                          <div className="avatar-initials" style={{ backgroundColor: getAvatarBg(s.fullName) }}>
                            {s.fullName ? s.fullName.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div className="student-meta-cell">
                            <span className="student-name">{s.fullName}</span>
                            <span className="student-email">{s.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>{s.classId?.name || 'Class'} ({s.section})</td>
                      <td>{s.parentName}</td>
                      <td>
                        {balance === undefined ? (
                          <span className="text-muted">Loading...</span>
                        ) : balance === 0 ? (
                          <span className="badge badge-success">No Dues</span>
                        ) : (
                          <span className="badge badge-danger">₹{balance.toLocaleString()}</span>
                        )}
                      </td>
                      <td>
                        <button onClick={() => openEnrollModal(s._id)} className="btn-table-action btn-table-edit">
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button onClick={() => handleDelete(s._id)} className="btn-table-action btn-table-delete">
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center text-muted">No student records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="table-pagination">
          <span className="pagination-info">
            Showing <strong>{startIdx}</strong> to <strong>{endIdx}</strong> of <strong>{total}</strong> entries
          </span>
          <div className="pagination-buttons">
            <button 
              disabled={page === 1}
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              className="btn btn-outline btn-xs"
            >
              <i className="fa-solid fa-chevron-left"></i> Prev
            </button>
            <span>Page {page} of {pages}</span>
            <button 
              disabled={page >= pages}
              onClick={() => setPage(prev => Math.min(prev + 1, pages))}
              className="btn btn-outline btn-xs"
            >
              Next <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Creation Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
        <form onSubmit={handleFormSubmit} className="modal-form">
          <div className="form-row-double">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Admission Number</label>
              <input 
                type="text" 
                value={admissionNumber} 
                onChange={e => setAdmissionNumber(e.target.value)} 
                required 
                readOnly={!!studentId}
                placeholder="e.g. ADM-2026-005" 
              />
            </div>
          </div>
          <div className="form-row-double">
            <div className="form-group">
              <label>Student Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Date of Birth</label>
              <input type="date" value={dob} onChange={e => setDob(e.target.value)} required />
            </div>
          </div>
          <div className="form-row-double">
            <div className="form-group">
              <label>Gender</label>
              <select value={gender} onChange={e => setGender(e.target.value)} className="form-control" required>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Assigned Class</label>
              <select value={classId} onChange={e => setClassId(e.target.value)} className="form-control" required>
                <option value="">-- Select Class --</option>
                {classes.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row-double">
            <div className="form-group">
              <label>Assigned Section</label>
              <select value={section} onChange={e => setSection(e.target.value)} className="form-control" required>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
              </select>
            </div>
            <div className="form-group">
              <label>Parent / Guardian Name</label>
              <input type="text" value={parentName} onChange={e => setParentName(e.target.value)} required />
            </div>
          </div>
          <div className="form-row-double">
            <div className="form-group">
              <label>Parent Contact Number</label>
              <input type="tel" value={contactNumber} onChange={e => setContactNumber(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Profile Image URL (Optional)</label>
              <input type="text" value={profileImage} onChange={e => setProfileImage(e.target.value)} placeholder="Image URL" />
            </div>
          </div>
          <div className="form-group">
            <label>Residential Address</label>
            <textarea value={address} onChange={e => setAddress(e.target.value)} rows="2" required></textarea>
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
