import Exam from '../models/Exam.js';
import Result from '../models/Result.js';
import Student from '../models/Student.js';
import Class from '../models/Class.js';

// --- Exam Controllers ---

// @desc    Schedule a new exam
// @route   POST /api/exams
// @access  Private/Admin
export const createExam = async (req, res, next) => {
  try {
    const { name, classId, date, subjects } = req.body;

    if (!name || !classId || !date || !subjects || !Array.isArray(subjects)) {
      res.status(400);
      throw new Error('Please fill in exam name, class, date, and subjects list');
    }

    const exam = await Exam.create({
      name,
      classId,
      date,
      subjects,
    });

    res.status(201).json({ success: true, exam });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all exams
// @route   GET /api/exams
// @access  Private
export const getExams = async (req, res, next) => {
  try {
    const exams = await Exam.find({})
      .populate('classId', 'name')
      .populate('subjects.subjectId', 'name code');
    res.status(200).json({ success: true, exams });
  } catch (error) {
    next(error);
  }
};


// --- Result Controllers ---

// @desc    Enter marks for a student on an exam
// @route   POST /api/exams/results
// @access  Private (Teacher or Admin)
export const enterMarks = async (req, res, next) => {
  try {
    const { examId, studentId, marks, remarks } = req.body;

    if (!examId || !studentId || !marks || !Array.isArray(marks)) {
      res.status(400);
      throw new Error('Please provide examId, studentId and marks list');
    }

    // Retrieve the exam configuration to verify subjects & calculate totals
    const exam = await Exam.findById(examId);
    if (!exam) {
      res.status(404);
      throw new Error('Exam schedule not found');
    }

    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) {
      res.status(404);
      throw new Error('Student profile not found');
    }

    let obtainedTotal = 0;
    let totalMarks = 0;

    // Validate marks entry and compute totals
    const compiledMarks = marks.map(entry => {
      const examSubject = exam.subjects.find(
        sub => String(sub.subjectId) === String(entry.subjectId)
      );

      if (!examSubject) {
        res.status(400);
        throw new Error(`Subject ID ${entry.subjectId} is not scheduled in this exam`);
      }

      if (entry.obtainedMarks > examSubject.maxMarks) {
        res.status(400);
        throw new Error(`Marks obtained (${entry.obtainedMarks}) exceeds maximum marks (${examSubject.maxMarks})`);
      }

      obtainedTotal += Number(entry.obtainedMarks);
      totalMarks += Number(examSubject.maxMarks);

      return {
        subjectId: entry.subjectId,
        obtainedMarks: Number(entry.obtainedMarks),
      };
    });

    const percentage = totalMarks > 0 ? parseFloat(((obtainedTotal / totalMarks) * 100).toFixed(2)) : 0;

    // Map percentage to grade
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 60) grade = 'C';
    else if (percentage >= 50) grade = 'D';

    // Upsert the results log
    const resultObj = await Result.findOneAndUpdate(
      { examId, studentId },
      {
        examId,
        studentId,
        marks: compiledMarks,
        totalMarks,
        obtainedTotal,
        percentage,
        grade,
        remarks: remarks || '',
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ success: true, result: resultObj });
  } catch (error) {
    next(error);
  }
};

// @desc    Query exam results list
// @route   GET /api/exams/results
// @access  Private
export const getResults = async (req, res, next) => {
  try {
    const { examId, classId, studentId } = req.query;
    const query = {};

    if (studentId) {
      query.studentId = studentId;
    }

    if (examId) {
      query.examId = examId;
    }

    // Filter results by class if specified
    if (classId && !studentId) {
      const studentsInClass = await Student.find({ classId });
      const studentIds = studentsInClass.map(s => s._id);
      query.studentId = { $in: studentIds };
    }

    const results = await Result.find(query)
      .populate('examId', 'name date')
      .populate('studentId', 'fullName admissionNumber section')
      .populate('marks.subjectId', 'name code');

    res.status(200).json({ success: true, results });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student aggregated report card details
// @route   GET /api/exams/reportcard/:studentId
// @access  Private
export const getStudentReportCard = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const studentObj = await Student.findById(studentId).populate('classId', 'name');
    if (!studentObj) {
      res.status(404);
      throw new Error('Student not found');
    }

    // Find all results for this student
    const results = await Result.find({ studentId })
      .populate('examId', 'name date')
      .populate('marks.subjectId', 'name code');

    let totalPointsObtained = 0;
    let totalMaxPoints = 0;
    
    results.forEach(resObj => {
      totalPointsObtained += resObj.obtainedTotal;
      totalMaxPoints += resObj.totalMarks;
    });

    const cumulativePercentage = totalMaxPoints > 0
      ? parseFloat(((totalPointsObtained / totalMaxPoints) * 100).toFixed(2))
      : 0;

    let cumulativeGrade = 'F';
    if (cumulativePercentage >= 90) cumulativeGrade = 'A+';
    else if (cumulativePercentage >= 80) cumulativeGrade = 'A';
    else if (cumulativePercentage >= 70) cumulativeGrade = 'B';
    else if (cumulativePercentage >= 60) cumulativeGrade = 'C';
    else if (cumulativePercentage >= 50) cumulativeGrade = 'D';

    res.status(200).json({
      success: true,
      student: {
        fullName: studentObj.fullName,
        admissionNumber: studentObj.admissionNumber,
        className: studentObj.classId.name,
        section: studentObj.section,
      },
      summary: {
        totalExams: results.length,
        totalPointsObtained,
        totalMaxPoints,
        cumulativePercentage,
        cumulativeGrade,
      },
      results,
    });
  } catch (error) {
    next(error);
  }
};
