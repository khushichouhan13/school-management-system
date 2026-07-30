import Fee from '../models/Fee.js';
import Student from '../models/Student.js';

// @desc    Get fee records (Admin: list all, Student: get own ledger)
// @route   GET /api/fees
// @access  Private
export const getFees = async (req, res, next) => {
  try {
    let fees;

    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) {
        res.status(404);
        throw new Error('Student profile not found');
      }
      fees = await Fee.find({ studentId: student._id })
        .populate('studentId', 'fullName admissionNumber')
        .populate('classId', 'name');
    } else {
      // Admin/Teacher access
      const { status, search } = req.query;
      const query = {};

      if (status) {
        query.status = status;
      }

      if (search) {
        // Find students matching search term
        const matchingStudents = await Student.find({
          $or: [
            { fullName: { $regex: search, $options: 'i' } },
            { admissionNumber: { $regex: search, $options: 'i' } },
          ],
        });
        const studentIds = matchingStudents.map(student => student._id);
        query.studentId = { $in: studentIds };
      }

      fees = await Fee.find(query)
        .populate('studentId', 'fullName admissionNumber section')
        .populate('classId', 'name');
    }

    res.status(200).json({ success: true, fees });
  } catch (error) {
    next(error);
  }
};

// @desc    Create fee structure for a student
// @route   POST /api/fees
// @access  Private/Admin
export const createFeeRecord = async (req, res, next) => {
  try {
    const { studentId, classId, amountTotal } = req.body;

    if (!studentId || !classId || !amountTotal) {
      res.status(400);
      throw new Error('Please specify studentId, classId, and amountTotal');
    }

    // Check if fee ledger already exists for student
    const feeExists = await Fee.findOne({ studentId });
    if (feeExists) {
      res.status(400);
      throw new Error('Fee record already initialized for this student');
    }

    const fee = await Fee.create({
      studentId,
      classId,
      amountTotal,
      amountPaid: 0,
      status: 'Pending',
    });

    res.status(201).json({ success: true, fee });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit fee payment (pay installment)
// @route   POST /api/fees/:feeId/pay
// @access  Private/Admin
export const payFee = async (req, res, next) => {
  try {
    const { amountPaid, paymentMethod } = req.body;
    const { feeId } = req.params;

    if (!amountPaid || !paymentMethod) {
      res.status(400);
      throw new Error('Please specify payment amount and payment method');
    }

    const fee = await Fee.findById(feeId);
    if (!fee) {
      res.status(404);
      throw new Error('Fee ledger record not found');
    }

    const remainingDue = fee.amountTotal - fee.amountPaid;
    if (amountPaid > remainingDue) {
      res.status(400);
      throw new Error(`Payment exceeds remaining due of ${remainingDue}`);
    }

    // Update amountPaid
    fee.amountPaid += Number(amountPaid);

    // Update status
    if (fee.amountPaid >= fee.amountTotal) {
      fee.status = 'Paid';
    } else if (fee.amountPaid > 0) {
      fee.status = 'Partially Paid';
    } else {
      fee.status = 'Pending';
    }

    // Generate random mock receipt number
    const receiptNo = 'REC-' + Math.floor(100000 + Math.random() * 900000);

    // Push payment log
    const paymentRecord = {
      amountPaid: Number(amountPaid),
      datePaid: new Date(),
      paymentMethod,
      receiptNo,
    };
    
    fee.paymentHistory.push(paymentRecord);
    await fee.save();

    res.status(200).json({
      success: true,
      message: 'Payment recorded successfully',
      fee,
      receipt: paymentRecord,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment receipt details
// @route   GET /api/fees/receipt/:feeId/:paymentId
// @access  Private
export const getReceiptDetails = async (req, res, next) => {
  try {
    const { feeId, paymentId } = req.params;
    const feeObj = await Fee.findById(feeId)
      .populate('studentId', 'fullName admissionNumber section')
      .populate('classId', 'name');

    if (!feeObj) {
      res.status(404);
      throw new Error('Fee record not found');
    }

    const receipt = feeObj.paymentHistory.id(paymentId);
    if (!receipt) {
      res.status(404);
      throw new Error('Receipt not found');
    }

    // Verify user authorization: student can only fetch their own receipts
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student || String(student._id) !== String(feeObj.studentId._id)) {
        res.status(403);
        throw new Error('Not authorized to view this receipt');
      }
    }

    res.status(200).json({
      success: true,
      receipt: {
        receiptNo: receipt.receiptNo,
        amountPaid: receipt.amountPaid,
        datePaid: receipt.datePaid,
        paymentMethod: receipt.paymentMethod,
        studentName: feeObj.studentId.fullName,
        admissionNumber: feeObj.studentId.admissionNumber,
        className: feeObj.classId.name,
        section: feeObj.studentId.section,
        totalPaidSoFar: feeObj.amountPaid,
        totalFee: feeObj.amountTotal,
        balanceDue: feeObj.amountTotal - feeObj.amountPaid,
      },
    });
  } catch (error) {
    next(error);
  }
};
