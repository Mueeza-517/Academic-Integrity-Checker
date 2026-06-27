const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config()

const app = express()

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/classes', require('./routes/classes'))
app.use('/api/assignments', require('./routes/assignments'))

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB')
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`)
    })
  })
  .catch(err => console.error('MongoDB connection error:', err))