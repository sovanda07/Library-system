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

// What changed:

// Removed require('dotenv').config() — server.js handles it
// Removed run() pattern — wrong for Express
// Removed clientOptions — not needed
// Removed ping command — not needed
// module.exports = connectDB instead of module.exports = mongoose

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