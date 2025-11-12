// db.js
const mysql = require("mysql2/promise");

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "root",
  database: "tienda_local_prueba",
};

async function getConnection() {
  return mysql.createConnection(dbConfig);
}

module.exports = { getConnection };
