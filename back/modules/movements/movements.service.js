const movementsModel = require("./movements.model");

async function listMovements(tenantId) {
  return await movementsModel.getAllMovements(tenantId);
}

module.exports = {
  listMovements,
};
