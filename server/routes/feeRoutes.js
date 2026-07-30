import express from 'express';
import {
  getFees,
  createFeeRecord,
  payFee,
  getReceiptDetails,
} from '../controllers/feeController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getFees)
  .post(protect, authorize('admin'), createFeeRecord);

router.post('/:feeId/pay', protect, authorize('admin'), payFee);
router.get('/receipt/:feeId/:paymentId', protect, getReceiptDetails);

export default router;
