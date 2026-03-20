const mongoose = require("mongoose");

async function connectToMongoDB(url) {
  try {
    return await mongoose.connect(url);
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    throw error;
  }
}

module.exports = {
  connectToMongoDB,
};