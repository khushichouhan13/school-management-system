import Teacher from '../models/Teacher.js';
import User from '../models/User.js';
import Class from '../models/Class.js';

// @desc    Get all teachers
// @route   GET /api/teachers
// @access  Private
export const getTeachers = async (req, res, next) => {
  try {
    const teachers = await Teacher.find({})
      .populate('subjects', 'name code')
      .populate('classes', 'name');
    res.status(200).json({ success: true, teachers });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single teacher profile
// @route   GET /api/teachers/:id
// @access  Private
export const getTeacherById = async (req, res, next) => {
  try {
    const teacher = await Teacher.findById(req.params.id)
      .populate('subjects', 'name code')
      .populate('classes', 'name')
      .populate('userId', 'email status');

    if (!teacher) {
      res.status(404);
      throw new Error('Teacher not found');
    }

    res.status(200).json({ success: true, teacher });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a teacher (Admin only, creates User account automatically)
// @route   POST /api/teachers
// @access  Private/Admin
export const createTeacher = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      phone,
      qualification,
      subjects,
      experience,
      classes,
    } = req.body;

    if (!fullName || !email || !phone || !qualification || !experience) {
      res.status(400);
      throw new Error('Please fill in all required teacher fields');
    }

    // Check if email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      res.status(400);
      throw new Error('User login account with this email already exists');
    }

    // Create User login (default password is 'teacher123')
    const user = await User.create({
      email,
      password: 'teacher123',
      role: 'teacher',
    });

    // Create teacher profile
    const teacher = await Teacher.create({
      userId: user._id,
      fullName,
      email,
      phone,
      qualification,
      subjects: subjects || [],
      experience,
      classes: classes || [],
    });

    // If classes are specified, map teacher as classTeacher in those classes
    if (classes && classes.length > 0) {
      for (const classId of classes) {
        await Class.findByIdAndUpdate(classId, { classTeacherId: teacher._id });
      }
    }

    res.status(201).json({ success: true, teacher });
  } catch (error) {
    next(error);
  }
};

// @desc    Update teacher profile
// @route   PUT /api/teachers/:id
// @access  Private/Admin
export const updateTeacher = async (req, res, next) => {
  try {
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      res.status(404);
      throw new Error('Teacher not found');
    }

    const {
      fullName,
      email,
      phone,
      qualification,
      subjects,
      experience,
      classes,
    } = req.body;

    // Check email uniqueness if modified
    if (email && email !== teacher.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        res.status(400);
        throw new Error('Email is already taken');
      }
      await User.findByIdAndUpdate(teacher.userId, { email });
    }

    const oldClasses = teacher.classes;

    teacher.fullName = fullName || teacher.fullName;
    teacher.email = email || teacher.email;
    teacher.phone = phone || teacher.phone;
    teacher.qualification = qualification || teacher.qualification;
    teacher.subjects = subjects || teacher.subjects;
    teacher.experience = experience !== undefined ? experience : teacher.experience;
    teacher.classes = classes || teacher.classes;

    const updatedTeacher = await teacher.save();

    // Re-map classTeacherId in Classes
    if (classes) {
      // Remove classTeacherId from classes teacher is no longer teaching
      const removedClasses = oldClasses.filter(c => !classes.includes(String(c)));
      for (const classId of removedClasses) {
        await Class.findByIdAndUpdate(classId, { classTeacherId: null });
      }
      // Add classTeacherId to new classes
      for (const classId of classes) {
        await Class.findByIdAndUpdate(classId, { classTeacherId: teacher._id });
      }
    }

    res.status(200).json({ success: true, teacher: updatedTeacher });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a teacher
// @route   DELETE /api/teachers/:id
// @access  Private/Admin
export const deleteTeacher = async (req, res, next) => {
  try {
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      res.status(404);
      throw new Error('Teacher not found');
    }

    // Remove from User collection
    await User.deleteOne({ _id: teacher.userId });

    // Set classTeacherId to null in all classes they were in charge of
    await Class.updateMany({ classTeacherId: teacher._id }, { classTeacherId: null });

    // Remove Teacher profile
    await Teacher.deleteOne({ _id: req.params.id });

    res.status(200).json({ success: true, message: 'Teacher and credentials deleted successfully' });
  } catch (error) {
    next(error);
  }
};
