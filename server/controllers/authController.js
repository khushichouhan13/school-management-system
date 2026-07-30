import User from '../models/User.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import generateToken from '../utils/generateToken.js';

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      if (user.status === 'inactive') {
        res.status(403);
        throw new Error('User account is inactive. Please contact the administrator.');
      }

      // Fetch profile based on role
      let profile = null;
      if (user.role === 'student') {
        profile = await Student.findOne({ userId: user._id }).populate('classId');
      } else if (user.role === 'teacher') {
        profile = await Teacher.findOne({ userId: user._id });
      }

      res.status(200).json({
        success: true,
        token: generateToken(user._id),
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
          status: user.status,
          profile,
        },
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Private/Admin
export const registerUser = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      res.status(400);
      throw new Error('Please fill in all user fields');
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists with this email');
    }

    const user = await User.create({
      email,
      password,
      role,
    });

    if (user) {
      res.status(201).json({
        success: true,
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      let profile = null;
      if (user.role === 'student') {
        profile = await Student.findOne({ userId: user._id }).populate('classId');
      } else if (user.role === 'teacher') {
        profile = await Teacher.findOne({ userId: user._id }).populate('classes');
      }

      res.status(200).json({
        success: true,
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
          status: user.status,
          profile,
        },
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};
