const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = connectDB;

// require('dotenv').config();
// const mongoose = require('mongoose');

// // MongoDB connection
// const uri = process.env.MONGO_URI;

// const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

// async function run() {
//   try {
//     // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
//     await mongoose.connect(uri, clientOptions);
//     await mongoose.connection.db.admin().command({ ping: 1 });
//     console.log("Pinged your deployment. You successfully connected to MongoDB!");
//   } finally {
//     // Ensures that the client will close when you finish/error
//     // await mongoose.disconnect();
//   }
// }
// run().catch(console.dir);

// module.exports = mongoose;

// What changed:

// Removed require('dotenv').config() — server.js handles it
// Removed the run() pattern — replaced with connectDB function
// Removed the ping command — not needed for Express
// Added process.exit(1) — if DB fails, server stops immediately instead of running with no database
// module.exports = connectDB — so server.js can call it properly