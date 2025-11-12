// db.js
const mysql = require("mysql2/promise");

const dbConfig = {
  host: process.env.DB_HOST,
  database: process.env.DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

async function getConnection() {
  return mysql.createConnection(dbConfig);
}

module.exports = { getConnection };
