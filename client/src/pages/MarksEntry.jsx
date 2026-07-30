import React, { useState, useEffect, useContext } from 'react';
import { AuthContext, ToastContext } from '../App';

export default function MarksEntry() {
  const { request } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);

  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  
  // Sheet states
  const [loadedExam, setLoadedExam] = useState(null);
  const [students, setStudents] = useState([]);
  const [gradesData, setGradesData] = useState({}); // { [studentId]: { [subjectId]: marks, remarks } }

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

  const handleLoadSheet = async () => {
    if (!selectedExam) {
      showToast('Please select an examination schedule.', 'warning');
      return;
    }

    const exam = exams.find(e => e._id === selectedExam);
    setLoadedExam(exam);

    try {
      // 1. Fetch Students
      const classId = exam.classId?._id || exam.classId;
      const stuRes = await request(`/students?classId=${classId}&limit=100`);
      
      // 2. Fetch existing results
      const resRes = await request(`/exams/results?examId=${selectedExam}`);

      if (stuRes.success && resRes.success) {
        setStudents(stuRes.students);
        
        // Populate initial grades data map
        const dataMap = {};
        stuRes.students.forEach(student => {
          const sResult = resRes.results.find(r => String(r.studentId?._id) === String(student._id));
          const marksMap = {};
          exam.subjects.forEach(sub => {
            const subjectScore = sResult?.marks.find(m => String(m.subjectId?._id || m.subjectId) === String(sub.subjectId?._id || sub.subjectId));
            marksMap[sub.subjectId?._id || sub.subjectId] = subjectScore !== undefined ? subjectScore.obtainedMarks : '';
          });

          dataMap[student._id] = {
            marks: marksMap,
            remarks: sResult?.remarks || ''
          };
        });
        setGradesData(dataMap);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarksChange = (studentId, subjectId, val, maxMarks) => {
    const score = val === '' ? '' : Number(val);
    if (score > maxMarks) {
      showToast(`Score cannot exceed maximum marks (${maxMarks})`, 'error');
      return;
    }

    setGradesData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        marks: {
          ...prev[studentId].marks,
          [subjectId]: score
        }
      }
    }));
  };

  const handleRemarksChange = (studentId, val) => {
    setGradesData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks: val
      }
    }));
  };

  const handleSubmitGrades = async () => {
    try {
      for (const studentId of Object.keys(gradesData)) {
        const studentGrades = gradesData[studentId];
        
        // Compile marks array
        const compiledMarks = Object.keys(studentGrades.marks).map(subjectId => ({
          subjectId,
          obtainedMarks: Number(studentGrades.marks[subjectId])
        }));

        // Send api request for this student
        await request('/exams/results', 'POST', {
          examId: selectedExam,
          studentId,
          marks: compiledMarks,
          remarks: studentGrades.remarks
        });
      }

      showToast('All results and grades generated successfully!');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div className="glass-card">
        <div className="card-header mb-4">
          <h3>Result Entry Dashboard</h3>
        </div>

        <div className="attendance-setup-bar">
          <div className="form-group mb-0 flex-grow-1">
            <label>Select Exam</label>
            <select 
              value={selectedExam} 
              onChange={e => setSelectedExam(e.target.value)} 
              className="form-control"
            >
              <option value="">-- Choose Exam Schedule --</option>
              {exams.map(exam => (
                <option key={exam._id} value={exam._id}>{exam.name} ({exam.classId?.name})</option>
              ))}
            </select>
          </div>
          <button onClick={handleLoadSheet} className="btn btn-indigo align-self-end">
            <i className="fa-solid fa-clipboard-list"></i> Load Marks Sheet
          </button>
        </div>

        {/* Dynamic Marks Grid */}
        {loadedExam && students.length > 0 && (
          <div className="marks-sheet-wrapper mt-4">
            <h4 className="sheet-title mb-3">
              Student Grades Sheet: <span>{loadedExam.name} - {loadedExam.classId?.name}</span>
            </h4>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Adm No</th>
                    <th>Student Name</th>
                    {loadedExam.subjects.map(sub => (
                      <th key={sub.subjectId?._id || sub.subjectId}>
                        {sub.subjectId?.name || 'Subject'}
                        <span className="marks-limit-label">Max: {sub.maxMarks}m</span>
                      </th>
                    ))}
                    <th>Custom Teacher Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => {
                    const rowData = gradesData[student._id] || { marks: {}, remarks: '' };
                    return (
                      <tr key={student._id}>
                        <td><strong className="text-secondary">{student.admissionNumber}</strong></td>
                        <td><strong>{student.fullName}</strong></td>
                        {loadedExam.subjects.map(sub => {
                          const subId = sub.subjectId?._id || sub.subjectId;
                          const score = rowData.marks[subId] || '';
                          return (
                            <td key={subId}>
                              <input 
                                type="number" 
                                className="form-control marks-input" 
                                min="0" 
                                max={sub.maxMarks}
                                value={score}
                                onChange={e => handleMarksChange(student._id, subId, e.target.value, sub.maxMarks)}
                                style={{ maxWidth: '90px', textAlign: 'center', backgroundColor: 'rgba(25, 28, 56, 0.4)' }}
                                required 
                              />
                            </td>
                          );
                        })}
                        <td>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={rowData.remarks || ''}
                            onChange={e => handleRemarksChange(student._id, e.target.value)}
                            placeholder="e.g. Good logic skills" 
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="action-footer mt-4">
              <button onClick={handleSubmitGrades} className="btn btn-emerald">
                <i className="fa-solid fa-circle-check"></i> Submit Grades & Generate Remarks
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
