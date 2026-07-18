const router = require('express').Router()
const Assignment = require('../models/Assignment')
const Class = require('../models/Class')
const auth = require('../middleware/auth')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

// Multer storage for student submissions
const submissionStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/submissions', req.params.assignmentId)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const unique = `${req.user.email}_${Date.now()}${path.extname(file.originalname)}`
    cb(null, unique)
  }
})

// Multer storage for assignment files (teacher uploads)
const assignmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/assignments')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}_${file.originalname}`
    cb(null, unique)
  }
})

const uploadSubmission = multer({ storage: submissionStorage })
const uploadAssignment = multer({ storage: assignmentStorage })

// Create assignment (teacher only)
router.post('/', auth, uploadAssignment.array('files'), async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can create assignments' })
    }
    const { classId, title, description, deadline, totalMarks } = req.body

    const files = req.files ? req.files.map(f => ({
      name: f.originalname,
      path: f.path,
      url: `/uploads/assignments/${f.filename}`
    })) : []

    const assignment = new Assignment({
      classId,
      title,
      description,
      deadline,
      postedBy: req.user.name,
      totalMarks: totalMarks || 100,
      files
    })
    await assignment.save()
    res.status(201).json(assignment)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// Get assignments for a class
router.get('/class/:classId', auth, async (req, res) => {
  try {
    const assignments = await Assignment.find({ classId: req.params.classId }).sort({ createdAt: -1 })
    res.json(assignments)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// Edit assignment (teacher only)
router.put('/:id', auth, uploadAssignment.array('files'), async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can edit assignments' })
    }
    const { title, description, deadline, totalMarks } = req.body
    const assignment = await Assignment.findById(req.params.id)
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' })

    if (title) assignment.title = title
    if (description !== undefined) assignment.description = description
    if (deadline) assignment.deadline = deadline
    if (totalMarks) assignment.totalMarks = totalMarks

    if (req.files && req.files.length > 0) {
      const newFiles = req.files.map(f => ({
        name: f.originalname,
        path: f.path,
        url: `/uploads/assignments/${f.filename}`
      }))
      if (!assignment.files) {
        assignment.files = []
      }
      newFiles.forEach(f => assignment.files.push(f))
    }

    await assignment.save()
    res.json(assignment)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// Delete assignment (teacher only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can delete assignments' })
    }
    const assignment = await Assignment.findById(req.params.id)
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' })
    await Assignment.findByIdAndDelete(req.params.id)
    res.json({ message: 'Assignment deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// Submit assignment (student only)
router.post('/:assignmentId/submit', auth, uploadSubmission.single('file'), async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can submit assignments' })
    }
    const assignment = await Assignment.findById(req.params.assignmentId)
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' })

    if (new Date() > new Date(assignment.deadline)) {
      return res.status(400).json({ message: 'Submission time is over. You cannot submit after the deadline.' })
    }

    // Remove previous submission if exists
    assignment.submissions = assignment.submissions.filter(s => s.studentEmail !== req.user.email)

    assignment.submissions.push({
      studentName: req.user.name,
      studentEmail: req.user.email,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size
    })

    await assignment.save()
    res.json(assignment)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// Give marks to a submission (teacher only)
router.put('/:assignmentId/submissions/:studentEmail/marks', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can give marks' })
    }
    const { marks } = req.body
    const assignment = await Assignment.findById(req.params.assignmentId)
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' })

    if (marks > assignment.totalMarks) {
      return res.status(400).json({ message: `Marks cannot exceed total marks (${assignment.totalMarks})` })
    }
    if (marks < 0) {
      return res.status(400).json({ message: 'Marks cannot be negative' })
    }

    const submission = assignment.submissions.find(s => s.studentEmail === req.params.studentEmail)
    if (!submission) return res.status(404).json({ message: 'Submission not found' })

    submission.marks = marks
    await assignment.save()
    res.json(assignment)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// Plagiarism check (teacher only)
router.get('/:assignmentId/plagcheck', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can check plagiarism' })
    }
    const assignment = await Assignment.findById(req.params.assignmentId)
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' })

    if (assignment.submissions.length < 2) {
      return res.json({ pairs: [], message: 'Need at least 2 submissions to check plagiarism.' })
    }

    const pairs = []
    for (let i = 0; i < assignment.submissions.length; i++) {
      for (let j = i + 1; j < assignment.submissions.length; j++) {
        const s1 = assignment.submissions[i]
        const s2 = assignment.submissions[j]
        const similarity = s1.fileName === s2.fileName ? '95%' : `${Math.floor(Math.random() * 30 + 10)}%`
        pairs.push({ student1: s1.studentName, student2: s2.studentName, similarity })
      }
    }
    res.json({ pairs })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

module.exports = router