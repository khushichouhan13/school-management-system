import express from 'express';
import {
  createExam,
  getExams,
  enterMarks,
  getResults,
  getStudentReportCard,
} from '../controllers/examController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getExams)
  .post(protect, authorize('admin'), createExam);

router.route('/results')
  .get(protect, getResults)
  .post(protect, authorize('teacher', 'admin'), enterMarks);

router.get('/reportcard/:studentId', protect, getStudentReportCard);

export default router;
