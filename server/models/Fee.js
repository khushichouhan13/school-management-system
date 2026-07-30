import mongoose from 'mongoose';

const paymentHistorySchema = new mongoose.Schema({
  amountPaid: {
    type: Number,
    required: true,
  },
  datePaid: {
    type: Date,
    default: Date.now,
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'UPI', 'NetBanking'],
    required: true,
  },
  receiptNo: {
    type: String,
    required: true,
  },
});

const feeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Please assign a student'],
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Please specify student class'],
    },
    amountTotal: {
      type: Number,
      required: [true, 'Please set total fee amount'],
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Paid', 'Pending', 'Partially Paid'],
      default: 'Pending',
    },
    paymentHistory: [paymentHistorySchema],
  },
  {
    timestamps: true,
  }
);

const Fee = mongoose.model('Fee', feeSchema);
export default Fee;
