import Class from '../models/Class.js';
import Subject from '../models/Subject.js';
import Teacher from '../models/Teacher.js';

// --- Subject Controllers ---

// @desc    Get all subjects
// @route   GET /api/classes/subjects
// @access  Private
export const getSubjects = async (req, res, next) => {
  try {
    const subjects = await Subject.find({});
    res.status(200).json({ success: true, subjects });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a subject
// @route   POST /api/classes/subjects
// @access  Private/Admin
export const createSubject = async (req, res, next) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) {
      res.status(400);
      throw new Error('Please provide subject name and code');
    }

    const subjectExists = await Subject.findOne({ code: code.toUpperCase() });
    if (subjectExists) {
      res.status(400);
      throw new Error('Subject with this code already exists');
    }

    const subject = await Subject.create({ name, code: code.toUpperCase() });
    res.status(201).json({ success: true, subject });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a subject
// @route   DELETE /api/classes/subjects/:id
// @access  Private/Admin
export const deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      res.status(404);
      throw new Error('Subject not found');
    }
    await Subject.deleteOne({ _id: req.params.id });
    res.status(200).json({ success: true, message: 'Subject removed successfully' });
  } catch (error) {
    next(error);
  }
};


// --- Class Controllers ---

// @desc    Get all classes
// @route   GET /api/classes
// @access  Private
export const getClasses = async (req, res, next) => {
  try {
    const classes = await Class.find({})
      .populate('classTeacherId', 'fullName email')
      .populate('subjects', 'name code');
    res.status(200).json({ success: true, classes });
  } catch (error) {
    next(error);
  }
};

// @desc    Get class by ID
// @route   GET /api/classes/:id
// @access  Private
export const getClassById = async (req, res, next) => {
  try {
    const classObj = await Class.findById(req.params.id)
      .populate('classTeacherId', 'fullName email')
      .populate('subjects', 'name code');

    if (!classObj) {
      res.status(404);
      throw new Error('Class not found');
    }
    res.status(200).json({ success: true, classObj });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a class
// @route   POST /api/classes
// @access  Private/Admin
export const createClass = async (req, res, next) => {
  try {
    const { name, sections, classTeacherId, subjects } = req.body;
    if (!name) {
      res.status(400);
      throw new Error('Please add a class name');
    }

    const classObj = await Class.create({
      name,
      sections: sections || ['A'],
      classTeacherId: classTeacherId || null,
      subjects: subjects || [],
    });

    // If teacher is assigned, update teacher's class array
    if (classTeacherId) {
      await Teacher.findByIdAndUpdate(classTeacherId, {
        $addToSet: { classes: classObj._id }
      });
    }

    res.status(201).json({ success: true, classObj });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a class
// @route   PUT /api/classes/:id
// @access  Private/Admin
export const updateClass = async (req, res, next) => {
  try {
    const { name, sections, classTeacherId, subjects } = req.body;
    const classObj = await Class.findById(req.params.id);

    if (!classObj) {
      res.status(404);
      throw new Error('Class not found');
    }

    const oldTeacherId = classObj.classTeacherId;

    classObj.name = name || classObj.name;
    classObj.sections = sections || classObj.sections;
    classObj.classTeacherId = classTeacherId !== undefined ? classTeacherId : classObj.classTeacherId;
    classObj.subjects = subjects || classObj.subjects;

    const updatedClass = await classObj.save();

    // Handle Teacher mapping changes
    if (classTeacherId && String(oldTeacherId) !== String(classTeacherId)) {
      // Remove class from old teacher
      if (oldTeacherId) {
        await Teacher.findByIdAndUpdate(oldTeacherId, { $pull: { classes: classObj._id } });
      }
      // Add class to new teacher
      await Teacher.findByIdAndUpdate(classTeacherId, { $addToSet: { classes: classObj._id } });
    } else if (classTeacherId === null && oldTeacherId) {
      // Remove class from old teacher if teacher assignment removed
      await Teacher.findByIdAndUpdate(oldTeacherId, { $pull: { classes: classObj._id } });
    }

    res.status(200).json({ success: true, classObj: updatedClass });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a class
// @route   DELETE /api/classes/:id
// @access  Private/Admin
export const deleteClass = async (req, res, next) => {
  try {
    const classObj = await Class.findById(req.params.id);
    if (!classObj) {
      res.status(404);
      throw new Error('Class not found');
    }

    // Remove from teacher references
    if (classObj.classTeacherId) {
      await Teacher.findByIdAndUpdate(classObj.classTeacherId, { $pull: { classes: classObj._id } });
    }

    await Class.deleteOne({ _id: req.params.id });
    res.status(200).json({ success: true, message: 'Class deleted successfully' });
  } catch (error) {
    next(error);
  }
};
