const mongoose = require("mongoose");
require("dotenv").config();

async function connectdb() {
  try {
    // Determine which MongoDB URI to use based on the environment
    const mongouri = process.env.NODE_ENV === 'production'
      ? process.env.MONGODB_ATLAS_URI // Use Atlas URI in production
      : process.env.MONGODB_LOCAL_URI; // Use local URI in development

    await mongoose.connect(mongouri,);
    console.log(`Connected to MongoDB at: ${mongouri}`);
  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    process.exit(1);
  }
}

module.exports = connectdb;
