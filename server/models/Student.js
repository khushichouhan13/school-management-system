import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Please add student full name'],
      trim: true,
    },
    dob: {
      type: Date,
      required: [true, 'Please add date of birth'],
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: [true, 'Please specify gender'],
    },
    parentName: {
      type: String,
      required: [true, 'Please add parent or guardian name'],
      trim: true,
    },
    contactNumber: {
      type: String,
      required: [true, 'Please add contact number'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add email address'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Please add address details'],
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Please assign a class'],
      index: true,
    },
    section: {
      type: String,
      required: [true, 'Please assign a section'],
      trim: true,
      uppercase: true,
    },
    admissionNumber: {
      type: String,
      required: [true, 'Please add admission number'],
      unique: true,
      trim: true,
      index: true,
    },
    profileImage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Student = mongoose.model('Student', studentSchema);
export default Student;
