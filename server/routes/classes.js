const router = require('express').Router()
const Class = require('../models/Class')
const auth = require('../middleware/auth')

// Generate unique class code
const generateCode = async () => {
  let code
  do {
    code = Math.random().toString(36).substring(2, 8).toUpperCase()
  } while (await Class.findOne({ code }))
  return code
}

// Create class (teacher only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can create classes' })
    }
    const { name, section, bannerImage, color } = req.body
    const code = await generateCode()
    const newClass = new Class({
      name,
      section,
      teacher: req.user.name,
      teacherEmail: req.user.email,
      code,
      bannerImage: bannerImage || '',
      color: color || '#1a73e8'
    })
    await newClass.save()
    res.status(201).json(newClass)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// Get all classes for teacher
router.get('/my', auth, async (req, res) => {
  try {
    let classes
    if (req.user.role === 'teacher') {
      classes = await Class.find({ teacherEmail: req.user.email })
    } else {
      classes = await Class.find({ 'students.email': req.user.email })
    }
    res.json(classes)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// Join class by code (student only)
router.post('/join', auth, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can join classes' })
    }
    const { code } = req.body
    const cls = await Class.findOne({ code: code.toUpperCase() })
    if (!cls) return res.status(404).json({ message: 'Invalid class code. Please check and try again.' })

    if (cls.teacherEmail === req.user.email) {
      return res.status(400).json({ message: 'You cannot join your own class as a student.' })
    }

    const alreadyJoined = cls.students.find(s => s.email === req.user.email)
    if (alreadyJoined) {
      return res.status(400).json({ message: 'You have already joined this class.' })
    }

    cls.students.push({ name: req.user.name, email: req.user.email, picture: req.user.picture || '' })
    await cls.save()
    res.json(cls)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// Get single class
router.get('/:id', auth, async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id)
    if (!cls) return res.status(404).json({ message: 'Class not found' })
    res.json(cls)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

module.exports = router