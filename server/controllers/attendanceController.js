import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';

// @desc    Mark daily attendance (Create or Update)
// @route   POST /api/attendance
// @access  Private (Teacher and Admin)
export const markAttendance = async (req, res, next) => {
  try {
    const { date, classId, section, records } = req.body;

    if (!date || !classId || !section || !records || !Array.isArray(records)) {
      res.status(400);
      throw new Error('Please provide date, class, section and student records list');
    }

    // Set date to midnight to standardize search queries
    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    // Upsert logic: Find existing attendance log or create new one
    const attendance = await Attendance.findOneAndUpdate(
      { date: attendanceDate, classId, section },
      { date: attendanceDate, classId, section, records },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ success: true, attendance });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance sheet by date, class and section
// @route   GET /api/attendance
// @access  Private
export const getAttendance = async (req, res, next) => {
  try {
    const { date, classId, section } = req.query;

    if (!date || !classId || !section) {
      res.status(400);
      throw new Error('Please provide date, classId and section queries');
    }

    const queryDate = new Date(date);
    queryDate.setUTCHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({ date: queryDate, classId, section })
      .populate('records.studentId', 'fullName admissionNumber');

    // If no attendance record exists, fetch students in this class/section to return a blank sheet
    if (!attendance) {
      const students = await Student.find({ classId, section }).sort({ fullName: 1 });
      const blankRecords = students.map(student => ({
        studentId: {
          _id: student._id,
          fullName: student.fullName,
          admissionNumber: student.admissionNumber,
        },
        status: 'present', // default choice on blank sheet
      }));

      attendance = {
        date: queryDate,
        classId,
        section,
        records: blankRecords,
        isNewRecord: true,
      };
    }

    res.status(200).json({ success: true, attendance });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance history and percentage for a student
// @route   GET /api/attendance/student/:studentId
// @access  Private
export const getStudentAttendanceHistory = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    // Find student
    const student = await Student.findById(studentId);
    if (!student) {
      res.status(404);
      throw new Error('Student not found');
    }

    // Find all attendance records containing this student
    const attendanceRecords = await Attendance.find({
      'records.studentId': studentId,
    }).populate('classId', 'name');

    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    const history = [];

    attendanceRecords.forEach(record => {
      const studentRecord = record.records.find(
        rec => String(rec.studentId) === String(studentId)
      );

      if (studentRecord) {
        if (studentRecord.status === 'present') presentCount++;
        else if (studentRecord.status === 'absent') absentCount++;
        else if (studentRecord.status === 'late') lateCount++;

        history.push({
          date: record.date,
          status: studentRecord.status,
          className: record.classId.name,
          section: record.section,
        });
      }
    });

    const totalDays = history.length;
    const attendancePercentage = totalDays > 0 
      ? Math.round(((presentCount + lateCount * 0.5) / totalDays) * 100) 
      : 100;

    res.status(200).json({
      success: true,
      stats: {
        totalDays,
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        percentage: attendancePercentage,
      },
      history: history.sort((a, b) => new Date(b.date) - new Date(a.date)),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get aggregate stats for dashboard
// @route   GET /api/attendance/report
// @access  Private
export const getGeneralAttendanceReport = async (req, res, next) => {
  try {
    const totalRecords = await Attendance.find({});
    
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    let totalStudentsCounted = 0;

    totalRecords.forEach(record => {
      record.records.forEach(rec => {
        totalStudentsCounted++;
        if (rec.status === 'present') totalPresent++;
        else if (rec.status === 'absent') totalAbsent++;
        else if (rec.status === 'late') totalLate++;
      });
    });

    const percentage = totalStudentsCounted > 0
      ? Math.round(((totalPresent + totalLate * 0.5) / totalStudentsCounted) * 100)
      : 100;

    res.status(200).json({
      success: true,
      stats: {
        totalStudentsCounted,
        present: totalPresent,
        absent: totalAbsent,
        late: totalLate,
        percentage,
      }
    });
  } catch (error) {
    next(error);
  }
};
