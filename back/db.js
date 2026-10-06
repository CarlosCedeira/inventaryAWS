// db.js
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // Las caducidades son fechas de calendario, no instantes horarios.
  // Evita que mysql2 las convierta a Date y las desplace por zona horaria.
  dateStrings: ["DATE"],
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
