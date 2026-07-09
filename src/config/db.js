// remove the connection to mongodb
//const mongoose = require("mongoose");

//add the sql server connection 
//require("dotenv").config();

// remove existing code 
// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGODB_URI);
//     console.log("MongoDB connected");
//   } catch (err) {
//     console.log(err);
//     process.exit(1);
//   }
// };

// add new code for the sql 
const sql = require("mssql");
require("dotenv").config();
console.log({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT
});
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: Number(process.env.DB_PORT),
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

let pool;

const connectDB = async () => {
    try {
        pool = await sql.connect(config);
        return pool;
    } catch (err) {
        process.exit(1);
    }
};

module.exports = connectDB;
