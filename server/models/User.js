const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  picture: { type: String, default: '' },
  role: {
    type: String,
    enum: ['teacher', 'student'],
    required: true
  }
}, { timestamps: true })

// Unique combination of email + role
userSchema.index({ email: 1, role: 1 }, { unique: true })

module.exports = mongoose.model('User', userSchema)