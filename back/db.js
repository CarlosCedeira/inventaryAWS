// db.js
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  database: process.env.DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 100,
});

async function getConnection() {
  return pool.getConnection();
}

async function closePool() {
  await pool.end();
}

module.exports = { getConnection, closePool };
