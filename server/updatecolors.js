const mongoose = require('mongoose')
require('dotenv').config()

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await mongoose.connection.collection('classes').updateMany({}, { $set: { color: '#3443eb' } })
  console.log('All classes updated to blue')
  process.exit()
})