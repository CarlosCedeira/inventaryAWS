const movementsService = require("./movements.service");

async function getMovements(req, res) {
  try {
    const movements = await movementsService.listMovements(req.tenantId);
    res.json(movements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

module.exports = {
  getMovements,
};
