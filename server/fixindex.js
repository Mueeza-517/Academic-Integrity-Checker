const mongoose = require('mongoose')
require('dotenv').config()

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('Connected')
  try {
    await mongoose.connection.collection('users').dropIndexes()
    console.log('All indexes dropped successfully')
  } catch (err) {
    console.log('Error:', err.message)
  }
  process.exit()
})