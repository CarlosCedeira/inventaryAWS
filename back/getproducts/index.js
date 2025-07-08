const mysql = require("mysql2/promise");

exports.handler = async (event) => {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: "database-1.c5i8q02io99z.eu-west-1.rds.amazonaws.com",
      user: "admin",
      password: "Inventory147",
      database: "database-1",
    });

    const [rows] = await connection.execute("SELECT * FROM productos");

    return {
      statusCode: 200,
      body: JSON.stringify(rows),
    };
  } catch (error) {
    console.error("Error al consultar la base de datos:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error interno del servidor" }),
    };
  } finally {
    if (connection) await connection.end();
  }
};
