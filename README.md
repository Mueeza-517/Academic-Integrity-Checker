# Integrity Checker

A full-stack classroom management platform that helps teachers create classes, manage assignments, and detect plagiarism — all in one place. Built with role-based access for Teachers and Students.

## Features

### Authentication
- Google OAuth2 login
- Role-based access (Teacher / Student)
- JWT-based session management
- Switch between Teacher and Student roles on the same account

### For Teachers
- Create and manage classes with unique join codes
- Create assignments with deadlines, descriptions, total marks, and file attachments
- Edit or delete assignments (including adding more files after creation)
- View and download student submissions
- Grade submissions with a marks system (validated against total marks)
- Real-time plagiarism detection across student submissions (PDF, DOCX, TXT, ZIP support)
- Dashboard with class, assignment, and submission statistics

### For Students
- Join classes using a class code
- View all assignments across enrolled classes
- Submit assignments before the deadline
- Resubmit or remove a submission before the deadline
- Download their own submitted files
- View grades once released by the teacher
- Track submission status (Submitted / Pending / Missed)

### General
- Responsive UI with a persistent sidebar (desktop, tablet, and mobile)
- Searchable, filterable, paginated assignments list
- Class dashboard with stats and quick actions

## Tech Stack

**Frontend**
- React (with React Router)
- FontAwesome (icons)
- Axios (API requests)

**Backend**
- Node.js + Express
- MongoDB with Mongoose
- Multer (file uploads)
- Google OAuth2 + JWT (authentication)

**Plagiarism Detection**
- `pdf-parse` — PDF text extraction
- `mammoth` — DOCX text extraction
- `adm-zip` — ZIP archive text extraction
- `natural` — text similarity (n-gram / Jaccard comparison)

## Project Structure
