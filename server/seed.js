import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Student from './models/Student.js';
import Teacher from './models/Teacher.js';
import Class from './models/Class.js';
import Subject from './models/Subject.js';
import Attendance from './models/Attendance.js';
import Fee from './models/Fee.js';
import Exam from './models/Exam.js';
import Result from './models/Result.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/school_erp');
    console.log('Connected to MongoDB for seeding...');

    // 1. Clear database
    console.log('Clearing database...');
    await User.deleteMany({});
    await Student.deleteMany({});
    await Teacher.deleteMany({});
    await Class.deleteMany({});
    await Subject.deleteMany({});
    await Attendance.deleteMany({});
    await Fee.deleteMany({});
    await Exam.deleteMany({});
    await Result.deleteMany({});
    console.log('Database cleared.');

    // 2. Create Users
    console.log('Creating users...');
    
    // Create Admin User
    const adminUser = await User.create({
      email: 'admin@school.com',
      password: 'admin123',
      role: 'admin',
      status: 'active',
    });

    // Create Teacher Users
    const t1User = await User.create({ email: 'john.doe@school.com', password: 'teacher123', role: 'teacher' });
    const t2User = await User.create({ email: 'sarah.connor@school.com', password: 'teacher123', role: 'teacher' });
    const t3User = await User.create({ email: 'alan.turing@school.com', password: 'teacher123', role: 'teacher' });

    // Create Student Users
    const s1User = await User.create({ email: 'student1@school.com', password: 'student123', role: 'student' });
    const s2User = await User.create({ email: 'student2@school.com', password: 'student123', role: 'student' });
    const s3User = await User.create({ email: 'student3@school.com', password: 'student123', role: 'student' });
    const s4User = await User.create({ email: 'student4@school.com', password: 'student123', role: 'student' });

    // 3. Create Subjects
    console.log('Creating subjects...');
    const math = await Subject.create({ name: 'Mathematics', code: 'MATH101' });
    const science = await Subject.create({ name: 'Science & Tech', code: 'SCI101' });
    const english = await Subject.create({ name: 'English Literature', code: 'ENG101' });
    const history = await Subject.create({ name: 'World History', code: 'HIST101' });

    // 4. Create Teachers
    console.log('Creating teachers...');
    const teacher1 = await Teacher.create({
      userId: t1User._id,
      fullName: 'John Doe',
      email: 'john.doe@school.com',
      phone: '123-456-7890',
      qualification: 'PhD in Mathematics',
      subjects: [math._id],
      experience: 8,
      classes: [],
    });

    const teacher2 = await Teacher.create({
      userId: t2User._id,
      fullName: 'Sarah Connor',
      email: 'sarah.connor@school.com',
      phone: '987-654-3210',
      qualification: 'M.Sc. in Physics',
      subjects: [science._id],
      experience: 6,
      classes: [],
    });

    const teacher3 = await Teacher.create({
      userId: t3User._id,
      fullName: 'Alan Turing',
      email: 'alan.turing@school.com',
      phone: '555-555-5555',
      qualification: 'B.Sc. in Computer Science',
      subjects: [math._id, science._id],
      experience: 12,
      classes: [],
    });

    // 5. Create Classes
    console.log('Creating classes...');
    const class10 = await Class.create({
      name: 'Class 10',
      sections: ['A', 'B'],
      classTeacherId: teacher1._id,
      subjects: [math._id, english._id, science._id],
    });

    const class11 = await Class.create({
      name: 'Class 11',
      sections: ['A'],
      classTeacherId: teacher2._id,
      subjects: [math._id, science._id, history._id],
    });

    const class12 = await Class.create({
      name: 'Class 12',
      sections: ['A', 'B'],
      classTeacherId: teacher3._id,
      subjects: [math._id, science._id, history._id, english._id],
    });

    // Map back classes to teachers
    teacher1.classes.push(class10._id);
    await teacher1.save();
    teacher2.classes.push(class11._id);
    await teacher2.save();
    teacher3.classes.push(class12._id);
    await teacher3.save();

    // 6. Create Students
    console.log('Creating students...');
    const student1 = await Student.create({
      userId: s1User._id,
      fullName: 'Alex Vance',
      dob: new Date('2011-05-15'),
      gender: 'male',
      parentName: 'Eli Vance',
      contactNumber: '111-222-3333',
      email: 'student1@school.com',
      address: 'Black Mesa East, Apt 4',
      classId: class10._id,
      section: 'A',
      admissionNumber: 'ADM-2026-001',
      profileImage: '',
    });

    const student2 = await Student.create({
      userId: s2User._id,
      fullName: 'Gordon Freeman',
      dob: new Date('2010-09-18'),
      gender: 'male',
      parentName: 'Helen Freeman',
      contactNumber: '444-555-6666',
      email: 'student2@school.com',
      address: 'Anomalous Materials Wing, Room 3',
      classId: class10._id,
      section: 'A',
      admissionNumber: 'ADM-2026-002',
      profileImage: '',
    });

    const student3 = await Student.create({
      userId: s3User._id,
      fullName: 'Chell Aperture',
      dob: new Date('2011-12-01'),
      gender: 'female',
      parentName: 'Cave Johnson',
      contactNumber: '777-888-9999',
      email: 'student3@school.com',
      address: 'Test Chamber 09, Science Labs',
      classId: class10._id,
      section: 'B',
      admissionNumber: 'ADM-2026-003',
      profileImage: '',
    });

    const student4 = await Student.create({
      userId: s4User._id,
      fullName: 'Lara Croft',
      dob: new Date('2009-02-14'),
      gender: 'female',
      parentName: 'Richard Croft',
      contactNumber: '999-000-1111',
      email: 'student4@school.com',
      address: 'Croft Manor, Surrey',
      classId: class12._id,
      section: 'A',
      admissionNumber: 'ADM-2026-004',
      profileImage: '',
    });

    // 7. Initialize Fee Ledgers
    console.log('Initializing fees...');
    
    // Student 1: Paid Fee
    await Fee.create({
      studentId: student1._id,
      classId: class10._id,
      amountTotal: 1500,
      amountPaid: 1500,
      status: 'Paid',
      paymentHistory: [
        {
          amountPaid: 1000,
          datePaid: new Date('2026-04-10'),
          paymentMethod: 'UPI',
          receiptNo: 'REC-341908',
        },
        {
          amountPaid: 500,
          datePaid: new Date('2026-05-12'),
          paymentMethod: 'NetBanking',
          receiptNo: 'REC-524109',
        }
      ]
    });

    // Student 2: Partially Paid Fee
    await Fee.create({
      studentId: student2._id,
      classId: class10._id,
      amountTotal: 1500,
      amountPaid: 800,
      status: 'Partially Paid',
      paymentHistory: [
        {
          amountPaid: 800,
          datePaid: new Date('2026-04-12'),
          paymentMethod: 'Card',
          receiptNo: 'REC-428901',
        }
      ]
    });

    // Student 3: Pending Fee
    await Fee.create({
      studentId: student3._id,
      classId: class10._id,
      amountTotal: 1500,
      amountPaid: 0,
      status: 'Pending',
      paymentHistory: []
    });

    // Student 4: Paid Fee
    await Fee.create({
      studentId: student4._id,
      classId: class12._id,
      amountTotal: 2000,
      amountPaid: 2000,
      status: 'Paid',
      paymentHistory: [
        {
          amountPaid: 2000,
          datePaid: new Date('2026-04-05'),
          paymentMethod: 'Cash',
          receiptNo: 'REC-890234',
        }
      ]
    });

    // 8. Log Attendance
    console.log('Logging attendance history...');
    const d1 = new Date('2026-07-27');
    d1.setUTCHours(0, 0, 0, 0);
    const d2 = new Date('2026-07-28');
    d2.setUTCHours(0, 0, 0, 0);

    // Day 1: Class 10A
    await Attendance.create({
      date: d1,
      classId: class10._id,
      section: 'A',
      records: [
        { studentId: student1._id, status: 'present' },
        { studentId: student2._id, status: 'present' },
      ],
    });

    // Day 2: Class 10A
    await Attendance.create({
      date: d2,
      classId: class10._id,
      section: 'A',
      records: [
        { studentId: student1._id, status: 'present' },
        { studentId: student2._id, status: 'absent' }, // Gordon was absent
      ],
    });

    // Day 1: Class 10B
    await Attendance.create({
      date: d1,
      classId: class10._id,
      section: 'B',
      records: [
        { studentId: student3._id, status: 'late' },
      ],
    });

    // Day 2: Class 10B
    await Attendance.create({
      date: d2,
      classId: class10._id,
      section: 'B',
      records: [
        { studentId: student3._id, status: 'present' },
      ],
    });

    // 9. Exams and results
    console.log('Scheduling exams & results...');
    const midTermExam = await Exam.create({
      name: 'Mid-Term Examination 2026',
      classId: class10._id,
      date: new Date('2026-06-15'),
      subjects: [
        { subjectId: math._id, maxMarks: 100 },
        { subjectId: science._id, maxMarks: 100 },
        { subjectId: english._id, maxMarks: 50 },
      ],
    });

    // Enter marks for Student 1 (Alex Vance)
    await Result.create({
      examId: midTermExam._id,
      studentId: student1._id,
      marks: [
        { subjectId: math._id, obtainedMarks: 95 },
        { subjectId: science._id, obtainedMarks: 88 },
        { subjectId: english._id, obtainedMarks: 45 },
      ],
      totalMarks: 250,
      obtainedTotal: 228,
      percentage: 91.2,
      grade: 'A+',
      remarks: 'Excellent performance in all areas.',
    });

    // Enter marks for Student 2 (Gordon Freeman)
    await Result.create({
      examId: midTermExam._id,
      studentId: student2._id,
      marks: [
        { subjectId: math._id, obtainedMarks: 100 }, // Theoretical Physics master!
        { subjectId: science._id, obtainedMarks: 98 },
        { subjectId: english._id, obtainedMarks: 32 },
      ],
      totalMarks: 250,
      obtainedTotal: 230,
      percentage: 92.0,
      grade: 'A+',
      remarks: 'Brilliant student, outstanding logic skills.',
    });

    // Enter marks for Student 3 (Chell Aperture)
    await Result.create({
      examId: midTermExam._id,
      studentId: student3._id,
      marks: [
        { subjectId: math._id, obtainedMarks: 72 },
        { subjectId: science._id, obtainedMarks: 85 },
        { subjectId: english._id, obtainedMarks: 38 },
      ],
      totalMarks: 250,
      obtainedTotal: 195,
      percentage: 78.0,
      grade: 'B',
      remarks: 'Good scientific aptitude, highly persistent.',
    });

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
