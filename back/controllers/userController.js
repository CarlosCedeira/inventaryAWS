const { pool } = require("../db");
const bcrypt = require("bcrypt");

// Listar usuarios
const getUsers = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, username, role FROM users");
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Crear usuario
const createUser = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
      [username, hash, role]
    );
    res.status(201).json({ message: "Usuario creado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = { getUsers, createUser };
