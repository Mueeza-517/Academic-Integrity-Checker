const mongoose = require('mongoose')

const fileSchema = new mongoose.Schema({
  name: String,
  path: String,
  url: String
})

const submissionSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  fileSize: { type: Number },
  submittedAt: { type: Date, default: Date.now }
})

const assignmentSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  deadline: { type: Date, required: true },
  postedBy: { type: String, required: true },
  files: [fileSchema],
  submissions: [submissionSchema]
}, { timestamps: true })

module.exports = mongoose.model('Assignment', assignmentSchema)