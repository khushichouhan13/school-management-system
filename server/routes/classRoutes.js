import express from 'express';
import {
  getSubjects,
  createSubject,
  deleteSubject,
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
} from '../controllers/classController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getClasses)
  .post(protect, authorize('admin'), createClass);

router.route('/subjects')
  .get(protect, getSubjects)
  .post(protect, authorize('admin'), createSubject);

router.route('/subjects/:id')
  .delete(protect, authorize('admin'), deleteSubject);

router.route('/:id')
  .get(protect, getClassById)
  .put(protect, authorize('admin'), updateClass)
  .delete(protect, authorize('admin'), deleteClass);

export default router;
