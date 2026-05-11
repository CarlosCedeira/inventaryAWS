const movementsModel = require("./movements.model");

async function listMovements(tenantId) {
  return await movementsModel.getAllMovements(tenantId);
}

async function createMovement(movementData) {
  return await movementsModel.createMovement(movementData);
}

module.exports = {
  listMovements,
  createMovement,
};
