import Student from '../models/Student.js';
import User from '../models/User.js';
import Fee from '../models/Fee.js';

// @desc    Get all students (with search, filter, pagination)
// @route   GET /api/students
// @access  Private
export const getStudents = async (req, res, next) => {
  try {
    const { search, classId, section, page = 1, limit = 10, sortBy = 'fullName', sortOrder = 'asc' } = req.query;

    const query = {};

    // Filter by class
    if (classId) {
      query.classId = classId;
    }

    // Filter by section
    if (section) {
      query.section = section;
    }

    // Search query (fullName or admissionNumber)
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { admissionNumber: { $regex: search, $options: 'i' } },
      ];
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const order = sortOrder === 'desc' ? -1 : 1;

    const totalStudents = await Student.countDocuments(query);
    const students = await Student.find(query)
      .populate('classId', 'name')
      .sort({ [sortBy]: order })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      students,
      page: Number(page),
      pages: Math.ceil(totalStudents / Number(limit)),
      total: totalStudents,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single student profile
// @route   GET /api/students/:id
// @access  Private
export const getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('classId')
      .populate('userId', 'email status');

    if (!student) {
      res.status(404);
      throw new Error('Student not found');
    }

    res.status(200).json({ success: true, student });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a student (Admin only, creates User account automatically)
// @route   POST /api/students
// @access  Private/Admin
export const createStudent = async (req, res, next) => {
  try {
    const {
      fullName,
      dob,
      gender,
      parentName,
      contactNumber,
      email,
      address,
      classId,
      section,
      admissionNumber,
      profileImage,
    } = req.body;

    if (!fullName || !dob || !gender || !parentName || !contactNumber || !email || !address || !classId || !section || !admissionNumber) {
      res.status(400);
      throw new Error('Please fill in all required student fields');
    }

    // Check if admission number is taken
    const admissionExists = await Student.findOne({ admissionNumber });
    if (admissionExists) {
      res.status(400);
      throw new Error('Admission number already exists');
    }

    // Check if user login already exists with this email
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      res.status(400);
      throw new Error('A user account with this email already exists');
    }

    // Create User login account (default password is 'student123')
    const user = await User.create({
      email,
      password: 'student123',
      role: 'student',
    });

    // Create student profile
    const student = await Student.create({
      userId: user._id,
      fullName,
      dob,
      gender,
      parentName,
      contactNumber,
      email,
      address,
      classId,
      section,
      admissionNumber,
      profileImage: profileImage || '',
    });

    // Auto-initialize base Fee Ledger for student (e.g. $1200 standard tuition fee)
    await Fee.create({
      studentId: student._id,
      classId: student.classId,
      amountTotal: 1200,
      amountPaid: 0,
      status: 'Pending',
    });

    res.status(201).json({ success: true, student });
  } catch (error) {
    next(error);
  }
};

// @desc    Update student details
// @route   PUT /api/students/:id
// @access  Private/Admin
export const updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      res.status(404);
      throw new Error('Student not found');
    }

    const {
      fullName,
      dob,
      gender,
      parentName,
      contactNumber,
      email,
      address,
      classId,
      section,
      admissionNumber,
      profileImage,
    } = req.body;

    // Check email availability if changed
    if (email && email !== student.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        res.status(400);
        throw new Error('Email is already registered by another user');
      }
      // Update associated User's email
      await User.findByIdAndUpdate(student.userId, { email });
    }

    // Check admission number if changed
    if (admissionNumber && admissionNumber !== student.admissionNumber) {
      const admissionExists = await Student.findOne({ admissionNumber });
      if (admissionExists) {
        res.status(400);
        throw new Error('Admission number is already in use');
      }
    }

    student.fullName = fullName || student.fullName;
    student.dob = dob || student.dob;
    student.gender = gender || student.gender;
    student.parentName = parentName || student.parentName;
    student.contactNumber = contactNumber || student.contactNumber;
    student.email = email || student.email;
    student.address = address || student.address;
    student.classId = classId || student.classId;
    student.section = section || student.section;
    student.admissionNumber = admissionNumber || student.admissionNumber;
    student.profileImage = profileImage !== undefined ? profileImage : student.profileImage;

    const updatedStudent = await student.save();
    res.status(200).json({ success: true, student: updatedStudent });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a student
// @route   DELETE /api/students/:id
// @access  Private/Admin
export const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      res.status(404);
      throw new Error('Student not found');
    }

    // Delete associated User login account
    await User.deleteOne({ _id: student.userId });

    // Delete fee records
    await Fee.deleteMany({ studentId: student._id });

    // Delete Student profile
    await Student.deleteOne({ _id: req.params.id });

    res.status(200).json({ success: true, message: 'Student and credentials deleted successfully' });
  } catch (error) {
    next(error);
  }
};
