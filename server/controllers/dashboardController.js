import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Class from '../models/Class.js';
import Attendance from '../models/Attendance.js';
import Fee from '../models/Fee.js';

// @desc    Get dashboard metrics (Admin / Teacher overview)
// @route   GET /api/dashboard/stats
// @access  Private
export const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Core counts
    const totalStudents = await Student.countDocuments();
    const totalTeachers = await Teacher.countDocuments();
    const totalClasses = await Class.countDocuments();

    // 2. Calculate average attendance percentage
    const attendanceRecords = await Attendance.find({});
    let totalPresent = 0;
    let totalLate = 0;
    let totalStudentsCounted = 0;

    attendanceRecords.forEach(record => {
      record.records.forEach(rec => {
        totalStudentsCounted++;
        if (rec.status === 'present') totalPresent++;
        else if (rec.status === 'late') totalLate++;
      });
    });

    const attendancePercentage = totalStudentsCounted > 0
      ? Math.round(((totalPresent + totalLate * 0.5) / totalStudentsCounted) * 100)
      : 92; // default fallback if no attendance is logged yet

    // 3. Fee collection metrics
    const feeRecords = await Fee.find({});
    let totalCollected = 0;
    let totalExpected = 0;

    feeRecords.forEach(fee => {
      totalCollected += fee.amountPaid;
      totalExpected += fee.amountTotal;
    });

    const totalPending = totalExpected - totalCollected;

    // 4. Generate dynamic recent activity log
    const recentStudents = await Student.find({})
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('classId', 'name');

    const recentTeachers = await Teacher.find({})
      .sort({ createdAt: -1 })
      .limit(2);

    const recentPayments = await Fee.find({ 'paymentHistory.0': { $exists: true } })
      .sort({ updatedAt: -1 })
      .limit(3)
      .populate('studentId', 'fullName');

    const activities = [];

    recentStudents.forEach(stu => {
      activities.push({
        id: `stu-${stu._id}`,
        type: 'student',
        title: 'New Student Admission',
        description: `${stu.fullName} was enrolled in ${stu.classId?.name || 'Class'} (Section ${stu.section})`,
        time: stu.createdAt,
      });
    });

    recentTeachers.forEach(tea => {
      activities.push({
        id: `tea-${tea._id}`,
        type: 'teacher',
        title: 'Teacher Appointed',
        description: `${tea.fullName} joined with qualification ${tea.qualification}`,
        time: tea.createdAt,
      });
    });

    recentPayments.forEach(pay => {
      const lastPayment = pay.paymentHistory[pay.paymentHistory.length - 1];
      if (lastPayment) {
        activities.push({
          id: `pay-${lastPayment._id || Math.random()}`,
          type: 'fee',
          title: 'Fee Installment Paid',
          description: `Received $${lastPayment.amountPaid} via ${lastPayment.paymentMethod} for student ${pay.studentId?.fullName || 'Student'}`,
          time: lastPayment.datePaid,
        });
      }
    });

    // Sort activities by time descending
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        totalTeachers,
        totalClasses,
        attendancePercentage,
        feeCollection: totalCollected,
        pendingFees: totalPending,
      },
      recentActivities: activities.slice(0, 5),
    });
  } catch (error) {
    next(error);
  }
};
