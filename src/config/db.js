// import dotenv from "dotenv";
// dotenv.config();

import mongoose from "mongoose";
console.log(process.env.MONGO_URI);
const connectDB = async () => {
  try {
    const conn = await mongoose.connect('mongodb+srv://naren_d_luffy:naren2003@e-commerce.juqlx.mongodb.net/B2BDatabase');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
