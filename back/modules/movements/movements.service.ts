import type { MovementFilters } from "./movements.model.ts";

const movementsModel = require("./movements.model.ts") as typeof import("./movements.model.ts");

async function listMovements(tenantId: number, filters: MovementFilters) {
  return movementsModel.getAllMovements(tenantId, filters);
}

async function createMovement(movementData: Parameters<typeof movementsModel.createMovement>[0]) {
  return movementsModel.createMovement(movementData);
}

export { listMovements, createMovement };
