import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Please provide a date'],
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Please assign a class'],
      index: true,
    },
    section: {
      type: String,
      required: [true, 'Please specify section'],
      trim: true,
      uppercase: true,
    },
    records: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Student',
          required: true,
        },
        status: {
          type: String,
          enum: ['present', 'absent', 'late'],
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compounding index to prevent duplicate attendance logs for same class, section and date
attendanceSchema.index({ date: 1, classId: 1, section: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
