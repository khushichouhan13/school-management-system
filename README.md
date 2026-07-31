# EduNex - Premium School ERP & Management System

EduNex is a modern, state-of-the-art School Enterprise Resource Planning (ERP) and Management System built with a React frontend and Node/Express backend. It features a curated premium dark UI dashboard, role-based modules, and robust database tracking for student rosters, faculty, classroom scheduling, attendance roll call, finance ledger tracking, and examination grading.

---

## 🚀 Key Modules & Features

1. **Overview Dashboard**
   - Live counting stats: Total Enrolled Students, Faculty Staff, Active Classes, and Daily Attendance Rate.
   - **Fee Collection Overview**: Real-time target tracking showing Collected Fees vs. Pending Dues formatted in Indian Rupees (₹).
   - System Activity Log: Chronological tracking of recent administrative actions.

2. **Student & Faculty Management**
   - Full student admissions directory with detailed profiles (enrolled class/section, parents' contact details, fee dues, and results).
   - Staff directory tracking teacher qualifications, teaching experience, and assigned subjects.

3. **Class & Subjects Configurations**
   - Class management mapping classes to sections (e.g., Class 10A, Class 10B).
   - Linking class teachers and curriculum subjects (e.g., Mathematics, World History) to individual classrooms.

4. **Roll Call Register**
   - Daily attendance logging for classrooms with status indicators (Present, Absent, Late).

5. **Finance Ledger & Billing**
   - Ledger tracking for student semester fees.
   - Record installments, track remaining balances, and view/print system-generated transaction receipts.

6. **Exam Scheduling & Grade Entry**
   - Create examinations, schedule exam dates, and configure maximum/obtained marks per subject.
   - Enter student grades, auto-calculate percentages, and award letter grades (A+, B, etc.).

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite 8, Lucide React, FontAwesome, Vanilla CSS with custom HSL dark theme tokens.
- **Backend**: Node.js, Express.js (configured as ES Modules), Mongoose ODM, JWT authentication, and bcryptjs.
- **Database**: MongoDB (Local or Atlas cloud).

---

## 📁 Directory Structure

```text
schoolManagementSystem/
├── client/                 # React SPA frontend (Vite environment)
│   ├── src/
│   │   ├── components/     # Common UI layouts (Sidebar, Navbar, Modal)
│   │   ├── pages/          # Application views (Overview, Students, Fees, etc.)
│   │   └── App.jsx         # App routes & auth context wrapper
│   ├── package.json
│   └── vite.config.js
│
├── server/                 # Express REST API backend
│   ├── config/             # DB configuration
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Auth verification and custom error handling
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API routes definition
│   ├── seed.js             # Mock database seeder script
│   ├── server.js           # Server starter file
│   └── package.json
│
├── .gitignore              # Project-wide git version control exclusions
└── README.md               # Documentation guide
```



 

 

 
