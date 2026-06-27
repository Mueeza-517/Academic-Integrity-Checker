const router = require('express').Router()
const jwt = require('jsonwebtoken')
const User = require('../models/User')

router.post('/google', async (req, res) => {
  try {
    const { name, email, picture, role } = req.body

    let user = await User.findOne({ email, role })

    if (user) {
      // Update picture if changed
      user.picture = picture
      await user.save()
    } else {
      // Create new user with this role
      user = new User({ name, email, picture, role })
      await user.save()
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        picture: user.picture, 
        role: user.role 
      } 
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

module.exports = router