const mongoose = require('mongoose')

const classSchema = new mongoose.Schema({
  name: { type: String, required: true },
  section: { type: String, default: '' },
  teacher: { type: String, required: true },
  teacherEmail: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  bannerImage: { type: String, default: '' },
  color: { type: String, default: '#1a73e8' },
  students: [{ 
    name: String, 
    email: String,
    picture: String
  }]
}, { timestamps: true })

module.exports = mongoose.model('Class', classSchema)