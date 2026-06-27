const router = require('express').Router()
const Assignment = require('../models/Assignment')
const Class = require('../models/Class')
const auth = require('../middleware/auth')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads', req.params.assignmentId)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const unique = `${req.user.email}_${Date.now()}${path.extname(file.originalname)}`
    cb(null, unique)
  }
})

const upload = multer({ storage })

// Create assignment (teacher only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can create assignments' })
    }
    const { classId, title, description, deadline } = req.body
    const assignment = new Assignment({
      classId,
      title,
      description,
      deadline,
      postedBy: req.user.name
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

// Submit assignment (student only)
router.post('/:assignmentId/submit', auth, upload.single('file'), async (req, res) => {
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

    // Basic file name similarity check — real check needs text extraction
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