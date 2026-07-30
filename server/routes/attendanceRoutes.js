import express from 'express';
import {
  markAttendance,
  getAttendance,
  getStudentAttendanceHistory,
  getGeneralAttendanceReport,
} from '../controllers/attendanceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getAttendance)
  .post(protect, authorize('teacher', 'admin'), markAttendance);

router.get('/report', protect, getGeneralAttendanceReport);
router.get('/student/:studentId', protect, getStudentAttendanceHistory);

export default router;
