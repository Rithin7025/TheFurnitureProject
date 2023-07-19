const mongoose = require('mongoose');

require('dotenv').config()

// Define the database connection URL

// Establish the database connection
mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to the database'))
  .catch((error) => console.error('Database connection error:', error));

module.exports = mongoose;
