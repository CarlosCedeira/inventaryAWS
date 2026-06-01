const movementsService = require("./movements.service");
const { parseStockQuantity } = require("../../utils/stockQuantity");

async function getMovements(req, res) {
  try {
    const movements = await movementsService.listMovements(req.tenantId);
    res.json(movements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function createMovement(req, res) {
  try {
    const productId = parseStockQuantity(req.body.producto_id, {
      label: "Producto",
    });
    const quantity = parseStockQuantity(req.body.cantidad);

    const movement = await movementsService.createMovement({
      tenantId: req.tenantId,
      userId: req.user.id,
      productId,
      inventoryId: req.body.inventario_id,
      type: req.body.tipo,
      quantity,
      lotNumber: req.body.numero_lote,
      expirationDate: req.body.fecha_caducidad,
      reason: req.body.motivo,
    });

    res.status(201).json({
      message: "Movimiento registrado correctamente",
      ...movement,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

module.exports = {
  getMovements,
  createMovement,
};
