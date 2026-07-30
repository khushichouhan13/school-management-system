import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    marks: [
      {
        subjectId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Subject',
          required: true,
        },
        obtainedMarks: {
          type: Number,
          required: true,
        },
      },
    ],
    totalMarks: {
      type: Number,
      required: true,
    },
    obtainedTotal: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    grade: {
      type: String,
      required: true,
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent double score uploads for a single student on a single exam
resultSchema.index({ examId: 1, studentId: 1 }, { unique: true });

const Result = mongoose.model('Result', resultSchema);
export default Result;
